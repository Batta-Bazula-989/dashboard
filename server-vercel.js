const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Store connected SSE clients
const clients = new Set();

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

    // Store client connection
    const clientId = Date.now() + Math.random();
    clients.add({ id: clientId, res });

    // Handle client disconnect
    req.on('close', () => {
        clients.delete({ id: clientId, res });
        console.log(`Client ${clientId} disconnected`);
    });

    // Send keep-alive every 30 seconds
    const keepAlive = setInterval(() => {
        if (res.destroyed) {
            clearInterval(keepAlive);
            return;
        }
        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
    }, 30000);

    req.on('close', () => {
        clearInterval(keepAlive);
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

        // Handle batched data
        if (!pendingBatches.has(batchId)) {
            pendingBatches.set(batchId, {
                id: batchId,
                total: batchTotal,
                received: new Set(),
                data: new Map(),
                requestId: requestId,
                createdAt: Date.now(),
                timeout: setTimeout(() => {
                    console.warn(`[${batchId}] Batch timeout - processing incomplete batch`);
                    processIncompleteBatch(batchId);
                }, batchTimeout)
            });
        }

        const batch = pendingBatches.get(batchId);
        
        // Store the data
        batch.data.set(batchIndex, data);
        batch.received.add(batchIndex);
        
        console.log(`[${requestId}] Batch ${batchId} progress: ${batch.received.size}/${batchTotal} items received`);

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
            
            console.log(`[${requestId}] Batch ${batchId} complete: ${sortedData.length} total items`);
            
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
            res.json({
                success: true,
                message: `Partial batch received (${batch.received.size}/${batchTotal})`,
                requestId: requestId,
                batchId: batchId,
                progress: `${batch.received.size}/${batchTotal}`
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

// Helper function to broadcast data to all SSE clients
function broadcastData(data, requestId, source) {
    const message = JSON.stringify({
        type: 'data',
        data: data,
        timestamp: new Date().toISOString(),
        requestId: requestId,
        source: source
    });

    let sentCount = 0;
    clients.forEach((client) => {
        try {
            if (!client.res.destroyed) {
                client.res.write(`data: ${message}\n\n`);
                sentCount++;
            }
        } catch (error) {
            console.error('Error sending to client:', error);
            clients.delete(client);
        }
    });

    console.log(`[${requestId}] Broadcasted ${Array.isArray(data) ? data.length : 1} items from ${source} to ${sentCount} clients`);
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

    // Clean up
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

// Export for Vercel
module.exports = app;


