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

// HTTP endpoint to receive data from n8n
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        console.log('Received data from n8n:', JSON.stringify(data, null, 2));

        // Broadcast to all connected SSE clients
        const message = JSON.stringify({
            type: 'data',
            data: data,
            timestamp: new Date().toISOString()
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

        res.json({
            success: true,
            message: 'Data received and broadcasted',
            clients: sentCount
        });
    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        clients: clients.size,
        uptime: process.uptime()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Export for Vercel
module.exports = app;
