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

// Store connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to data dashboard',
        timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// HTTP endpoint to receive data from n8n
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        const requestId = req.headers['x-request-id'] || 'unknown';
        
        console.log(`[${requestId}] Received data from n8n:`, {
            dataType: Array.isArray(data) ? 'array' : typeof data,
            dataLength: Array.isArray(data) ? data.length : 1,
            timestamp: new Date().toISOString()
        });

        // Validate data structure
        if (!data) {
            throw new Error('No data received');
        }

        // Broadcast to all connected WebSocket clients
        const message = JSON.stringify({
            type: 'data',
            data: data,
            timestamp: new Date().toISOString(),
            requestId: requestId
        });

        let sentCount = 0;
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    sentCount++;
                } catch (error) {
                    console.error('Error sending to client:', error);
                }
            }
        });

        console.log(`[${requestId}] Broadcasted to ${sentCount} clients`);

        res.json({
            success: true,
            message: 'Data received and broadcasted',
            clients: sentCount,
            requestId: requestId
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

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server running on ws://localhost:${WS_PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔗 n8n endpoint: http://localhost:${PORT}/api/data`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
