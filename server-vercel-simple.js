const express = require('express');
const path = require('path');
const cors = require('cors');

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

// Serve all other static files
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Simple data storage
const recentData = [];
const maxDataSize = 100; // Keep last 100 items

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

// HTTP endpoint to receive data from n8n
app.post('/api/data', (req, res) => {
    try {
        const data = req.body;
        const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`[${requestId}] Received data:`, {
            dataType: Array.isArray(data) ? 'array' : typeof data,
            dataLength: Array.isArray(data) ? data.length : 1,
            timestamp: new Date().toISOString()
        });

        // Store the data
        recentData.push({
            data: data,
            timestamp: new Date().toISOString(),
            requestId: requestId,
            source: 'api'
        });
        
        // Keep only recent data
        if (recentData.length > maxDataSize) {
            recentData.shift();
        }
        
        res.json({
            success: true,
            message: 'Data received and stored',
            requestId: requestId,
            totalItems: recentData.length
        });

    } catch (error) {
        console.error('Error processing data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            requestId: req.headers['x-request-id'] || 'unknown'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        totalItems: recentData.length
    });
});

// Serve specific files with proper MIME types
app.get('/scripts/dashboard-vercel.js', (req, res) => {
    console.log('Serving dashboard-vercel.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'scripts', 'dashboard-vercel.js'));
});

app.get('/components/:filename', (req, res) => {
    const filename = req.params.filename;
    console.log(`Serving component: ${filename}`);
    if (filename.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(path.join(__dirname, 'components', filename));
    } else {
        res.status(404).send('Not found');
    }
});

app.get('/styles/:filename', (req, res) => {
    const filename = req.params.filename;
    if (filename.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
        res.sendFile(path.join(__dirname, 'styles', filename));
    } else {
        res.status(404).send('Not found');
    }
});

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content, but no error
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-vercel.html'));
});

// Export for Vercel
module.exports = app;
