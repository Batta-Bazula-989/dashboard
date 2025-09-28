const express = require('express');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files with proper MIME types
app.use('/styles', express.static(path.join(__dirname, 'styles'), {
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'text/css');
    }
}));

app.use('/scripts', express.static(path.join(__dirname, 'scripts'), {
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'application/javascript');
    }
}));

app.use('/components', express.static(path.join(__dirname, 'components'), {
    setHeaders: (res, path) => {
        res.setHeader('Content-Type', 'application/javascript');
    }
}));

app.use(express.static(path.join(__dirname)));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// WebSocket clients
const clients = new Set();

// Simple data storage
const recentData = [];
const maxDataSize = 100; // Keep last 100 items

// Broadcast data to all WebSocket clients
function broadcastData(data, requestId, source) {
    const message = JSON.stringify({
        data: data,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        source: source
    });

    clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });

    console.log(`[${requestId}] Broadcasted to ${clients.size} clients from ${source}`);
}

// Simple API endpoint to get recent data
app.get('/api/data', (req, res) => {
    res.json({
        success: true,
        data: recentData,
        count: recentData.length,
        timestamp: new Date().toISOString()
    });
});

// Clear all data endpoint
app.post('/api/clear', (req, res) => {
    const previousCount = recentData.length;
    recentData.length = 0; // Clear the array
    
    console.log(`🗑️ Cleared ${previousCount} items from storage`);
    
    res.json({
        success: true,
        message: `Cleared ${previousCount} items`,
        previousCount: previousCount,
        timestamp: new Date().toISOString()
    });
});


// Store for tracking batch data
const pendingBatches = new Map();
const batchTimeout = 30000; // 30 seconds timeout for incomplete batches

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

        // Process all data - no duplicate filtering
        const now = Date.now();

        // Handle single item (no batching)
        if (batchTotal === 1) {
            // Store and broadcast the data
            storeData(data, requestId, 'single');
            
            res.json({
                success: true,
                message: 'Single item received and stored',
                requestId: requestId,
                itemId: itemId,
                totalItems: recentData.length
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
            
            // Store and broadcast complete batch
            storeData(sortedData, requestId, `batch_${batchId}`);
            
            // Clean up
            pendingBatches.delete(batchId);
            
            res.json({
                success: true,
                message: 'Complete batch received and stored',
                requestId: requestId,
                batchId: batchId,
                totalItems: sortedData.length,
                totalStored: recentData.length
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

// Function to store data and broadcast to WebSocket clients
function storeData(data, requestId, source) {
    const message = {
        data: data,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        source: source
    };

    recentData.push(message);
    
    // Keep only recent data
    if (recentData.length > maxDataSize) {
        recentData.shift();
    }

    // Broadcast to WebSocket clients
    broadcastData(data, requestId, source);

    console.log(`[${requestId}] Stored ${Array.isArray(data) ? data.length : 1} items from ${source}, total items: ${recentData.length}`);
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
        clients: clients.size,
        uptime: process.uptime(),
        activeBatches: activeBatches.length,
        batchDetails: activeBatches
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-vercel.html'));
});

// Periodic cleanup of stale data
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes
    
    
    // Clean up stale batches
    for (const [batchId, batch] of pendingBatches.entries()) {
        if (now - batch.lastUpdate > staleThreshold) {
            console.warn(`Cleaning up stale batch ${batchId}`);
            clearTimeout(batch.timeout);
            pendingBatches.delete(batchId);
        }
    }
    
    if (pendingBatches.size > 0) {
        console.log(`Cleanup: ${pendingBatches.size} pending batches, ${recentData.length} stored items`);
    }
}, 60000); // Run cleanup every minute

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    // Send recent data to new client
    if (recentData.length > 0) {
        const lastData = recentData[recentData.length - 1];
        ws.send(JSON.stringify(lastData));
    }

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Export for Vercel
module.exports = app;



