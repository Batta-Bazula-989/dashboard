const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected WebSocket clients
const wsClients = new Set();

// Store connected SSE clients with metadata
const sseClients = new Map(); // clientId -> { res, lastSeen, id }
let sseClientIdCounter = 0;

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    wsClients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to data dashboard',
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        wsClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        wsClients.delete(ws);
    });
});

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'welcome',
        message: 'Connected to data dashboard',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Store client connection with metadata
    const clientId = ++sseClientIdCounter;
    const clientData = { 
        id: clientId, 
        res, 
        lastSeen: Date.now(),
        connected: true
    };
    sseClients.set(clientId, clientData);

    console.log(`SSE Client ${clientId} connected (total: ${sseClients.size})`);

    // Handle client disconnect
    req.on('close', () => {
        if (sseClients.has(clientId)) {
            sseClients.delete(clientId);
            console.log(`SSE Client ${clientId} disconnected (total: ${sseClients.size})`);
        }
    });

    // Handle client errors
    req.on('error', (error) => {
        console.error(`SSE Client ${clientId} error:`, error);
        if (sseClients.has(clientId)) {
            sseClients.delete(clientId);
            console.log(`SSE Client ${clientId} removed due to error (total: ${sseClients.size})`);
        }
    });

    // Send keep-alive every 30 seconds
    const keepAlive = setInterval(() => {
        if (res.destroyed || !sseClients.has(clientId)) {
            clearInterval(keepAlive);
            return;
        }
        
        try {
            res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
            // Update last seen time
            if (sseClients.has(clientId)) {
                sseClients.get(clientId).lastSeen = Date.now();
            }
        } catch (error) {
            console.error(`Keep-alive failed for SSE client ${clientId}:`, error);
            clearInterval(keepAlive);
            sseClients.delete(clientId);
        }
    }, 30000);

    req.on('close', () => {
        clearInterval(keepAlive);
        if (sseClients.has(clientId)) {
            sseClients.delete(clientId);
        }
    });
});

// Store for tracking batch data
const pendingBatches = new Map();
const batchTimeout = 30000; // 30 seconds timeout for incomplete batches
const processedRequests = new Map(); // Track processed requests with timestamps
const duplicateWindow = 60000; // 60 seconds window for duplicate detection

// HTTP endpoint to receive data from n8n
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const batchId = req.headers['x-batch-id'] || 'single';
        const batchIndex = parseInt(req.headers['x-batch-index'] || '0');
        const batchTotal = parseInt(req.headers['x-batch-total'] || '1');
        const itemId = req.headers['x-item-id'] || `${batchId}_${batchIndex}`;
        
        console.log(`[${requestId}] Received data:`, {
            batchId: batchId,
            batchIndex: batchIndex,
            batchTotal: batchTotal,
            itemId: itemId,
            dataType: Array.isArray(data) ? 'array' : typeof data,
            dataLength: Array.isArray(data) ? data.length : 1,
            timestamp: new Date().toISOString(),
            headers: {
                'x-batch-id': req.headers['x-batch-id'],
                'x-batch-index': req.headers['x-batch-index'],
                'x-batch-total': req.headers['x-batch-total'],
                'x-item-id': req.headers['x-item-id']
            }
        });

        // Validate data structure
        if (!data) {
            throw new Error('No data received');
        }

        // Log detailed timing information
        console.log(`[${requestId}] Processing ${batchTotal === 1 ? 'single item' : `batch item ${batchIndex + 1}/${batchTotal}`}`);

        // Check for duplicate requests with better tracking (include requestId to allow same data from different sources)
        const requestKey = `${batchId}_${batchIndex}_${requestId}`;
        const now = Date.now();
        
        // Check if this exact request was already processed
        if (processedRequests.has(requestKey)) {
            console.warn(`[${requestId}] EXACT DUPLICATE REQUEST DETECTED: ${requestKey} - ignoring`);
            res.json({
                success: true,
                message: 'Exact duplicate request ignored',
                requestId: requestId,
                duplicate: true
            });
            return;
        }

        // Mark this exact request as processed
        processedRequests.set(requestKey, now);

        // Handle single item (no batching)
        if (batchTotal === 1) {
            broadcastData(data, requestId, 'single');
            
            res.json({
                success: true,
                message: 'Single item received and broadcasted',
                clients: clients.size,
                requestId: requestId,
                itemId: itemId
            });
            return;
        }

        // Handle batched data (no locking needed - duplicate detection handles race conditions)
        if (!pendingBatches.has(batchId)) {
            pendingBatches.set(batchId, {
                id: batchId,
                total: batchTotal,
                received: new Set(),
                data: new Map(),
                requestId: requestId,
                createdAt: Date.now(),
                lastUpdate: Date.now(),
                timeout: setTimeout(() => {
                    console.warn(`[${batchId}] Batch timeout - processing incomplete batch`);
                    processIncompleteBatch(batchId);
                }, batchTimeout)
            });
        }

        // Get the batch (no locking needed - duplicate detection handles race conditions)
        const batch = pendingBatches.get(batchId);
        
        // Store the data
        batch.data.set(batchIndex, data);
        batch.received.add(batchIndex);
        batch.lastUpdate = Date.now();
        
        console.log(`[${requestId}] Batch ${batchId} progress: ${batch.received.size}/${batchTotal} items received`);
        console.log(`[${requestId}] Missing items: [${Array.from({length: batchTotal}, (_, i) => i).filter(i => !batch.received.has(i)).join(', ')}]`);

        // Check if batch is complete
        if (batch.received.size === batchTotal) {
            clearTimeout(batch.timeout);
            
            // Sort data by index to maintain order
            const sortedData = [];
            for (let i = 0; i < batchTotal; i++) {
                if (batch.data.has(i)) {
                    const item = batch.data.get(i);
                    if (Array.isArray(item)) {
                        sortedData.push(...item);
                    } else {
                        sortedData.push(item);
                    }
                }
            }
            
            console.log(`[${requestId}] ✅ Batch ${batchId} COMPLETE: ${sortedData.length} total items`);
            console.log(`[${requestId}] Items in order: [${sortedData.map((item, idx) => idx).join(', ')}]`);
            
            // Broadcast complete batch
            broadcastData(sortedData, requestId, `batch_${batchId}`);
            
            // Clean up
            pendingBatches.delete(batchId);
            
            res.json({
                success: true,
                message: 'Complete batch received and broadcasted',
                clients: clients.size,
                requestId: requestId,
                batchId: batchId,
                totalItems: sortedData.length
            });
        } else {
            // Partial batch - respond immediately but don't broadcast yet
            console.log(`[${requestId}] ⏳ Batch ${batchId} still waiting for ${batchTotal - batch.received.size} more items`);
            
            res.json({
                success: true,
                message: `Partial batch received (${batch.received.size}/${batchTotal})`,
                requestId: requestId,
                batchId: batchId,
                progress: `${batch.received.size}/${batchTotal}`,
                missing: Array.from({length: batchTotal}, (_, i) => i).filter(i => !batch.received.has(i))
            });
        }

    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// Helper function to broadcast data to all clients (both WebSocket and SSE)
function broadcastData(data, requestId, source) {
    const message = JSON.stringify({
        type: 'data',
        data: data,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        source: source
    });

    let wsSentCount = 0;
    let sseSentCount = 0;
    let deadWsClients = [];
    let deadSseClients = [];
    
    // Broadcast to WebSocket clients
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                wsSentCount++;
            } catch (error) {
                console.error('Error sending to WebSocket client:', error);
                deadWsClients.push(client);
            }
        } else {
            deadWsClients.push(client);
        }
    });

    // Broadcast to SSE clients
    sseClients.forEach((clientData, clientId) => {
        try {
            if (!clientData.res.destroyed && clientData.connected) {
                clientData.res.write(`data: ${message}\n\n`);
                clientData.lastSeen = Date.now();
                sseSentCount++;
            } else {
                deadSseClients.push(clientId);
            }
        } catch (error) {
            console.error(`Error sending to SSE client ${clientId}:`, error);
            deadSseClients.push(clientId);
        }
    });

    // Clean up dead WebSocket clients
    deadWsClients.forEach(client => {
        wsClients.delete(client);
    });

    // Clean up dead SSE clients
    deadSseClients.forEach(clientId => {
        sseClients.delete(clientId);
        console.log(`Removed dead SSE client ${clientId} during broadcast`);
    });

    const totalSent = wsSentCount + sseSentCount;
    const totalDead = deadWsClients.length + deadSseClients.length;
    
    console.log(`[${requestId}] Broadcasted ${Array.isArray(data) ? data.length : 1} items from ${source} to ${totalSent} active clients (${wsSentCount} WebSocket, ${sseSentCount} SSE) (removed ${totalDead} dead clients)`);
}

// Helper function to process incomplete batches
function processIncompleteBatch(batchId) {
    const batch = pendingBatches.get(batchId);
    if (!batch) return;

    console.warn(`[${batch.requestId}] Processing incomplete batch ${batchId}: ${batch.received.size}/${batch.total} items`);

    // Sort and broadcast available data
    const sortedData = [];
    for (let i = 0; i < batch.total; i++) {
        if (batch.data.has(i)) {
            const item = batch.data.get(i);
            if (Array.isArray(item)) {
                sortedData.push(...item);
            } else {
                sortedData.push(item);
            }
        }
    }

    if (sortedData.length > 0) {
        broadcastData(sortedData, batch.requestId, `incomplete_batch_${batchId}`);
    }

    // Clean up batch
    pendingBatches.delete(batchId);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    const activeBatches = Array.from(pendingBatches.values()).map(batch => ({
        id: batch.id,
        total: batch.total,
        received: batch.received.size,
        progress: `${batch.received.size}/${batch.total}`,
        age: Date.now() - batch.createdAt
    }));

    res.json({
        status: 'healthy',
        clients: {
            websocket: wsClients.size,
            sse: sseClients.size,
            total: wsClients.size + sseClients.size
        },
        uptime: process.uptime(),
        activeBatches: activeBatches.length,
        batchDetails: activeBatches
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔗 n8n endpoint: http://localhost:${PORT}/api/data`);
});

// Periodic cleanup of stale data
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes
    
    // Clean up stale processed requests
    for (const [key, timestamp] of processedRequests.entries()) {
        if (now - timestamp > duplicateWindow) {
            processedRequests.delete(key);
        }
    }
    
    // Clean up stale batches
    for (const [batchId, batch] of pendingBatches.entries()) {
        if (now - batch.lastUpdate > staleThreshold) {
            console.warn(`Cleaning up stale batch ${batchId}`);
            clearTimeout(batch.timeout);
            pendingBatches.delete(batchId);
        }
    }
    
    // Clean up stale WebSocket clients
    const deadWsClients = [];
    wsClients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) {
            deadWsClients.push(client);
        }
    });
    
    deadWsClients.forEach(client => {
        wsClients.delete(client);
    });

    // Clean up stale SSE clients (clients that haven't been seen in a while)
    for (const [clientId, clientData] of sseClients.entries()) {
        if (now - clientData.lastSeen > staleThreshold) {
            console.warn(`Cleaning up stale SSE client ${clientId}`);
            try {
                if (!clientData.res.destroyed) {
                    clientData.res.end();
                }
            } catch (error) {
                // Ignore errors when ending stale connections
            }
            sseClients.delete(clientId);
        }
    }
    
    if (processedRequests.size > 0 || pendingBatches.size > 0 || deadWsClients.length > 0) {
        console.log(`Cleanup: ${processedRequests.size} processed requests, ${pendingBatches.size} pending batches, ${wsClients.size} WebSocket clients, ${sseClients.size} SSE clients, ${deadWsClients.length} dead WebSocket clients removed`);
    }
}, 60000); // Run cleanup every minute

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

