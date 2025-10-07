// Railway Deployment Server
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory data storage (persists within Railway instance)
let recentData = [];
const maxDataSize = 100;

// API Routes
app.get('/api/data', (req, res) => {
  console.log(`GET /api/data - returning ${recentData.length} items`);
  res.json({
    success: true,
    data: recentData,
    count: recentData.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine data type based on content
    let dataType = 'unknown';
    if (data && typeof data === 'object') {
      if (data.competitor_name && data.ai_analysis) {
        dataType = 'ad_text_analysis';
      } else if (data.video_id || (data.body && data.body.output)) {
        dataType = 'video_analysis';
      } else if (Array.isArray(data) && data.length > 0) {
        // Check if array contains video analysis or ad text analysis
        const firstItem = data[0];
        if (firstItem.video_id || (firstItem.body && firstItem.body.output)) {
          dataType = 'video_analysis';
        } else if (firstItem.competitor_name && firstItem.ai_analysis) {
          dataType = 'ad_text_analysis';
        }
      }
    }

    const newItem = {
      data,
      dataType,
      timestamp: new Date().toISOString(),
      requestId,
      source: 'api'
    };

    recentData.push(newItem);

    if (recentData.length > maxDataSize) recentData.shift();

    console.log(`POST /api/data - added ${dataType} item, total items: ${recentData.length}`);

    res.json({
      success: true,
      message: `${dataType} data received and stored`,
      dataType,
      requestId,
      totalItems: recentData.length
    });
  } catch (error) {
    console.error('POST /api/data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/data', (req, res) => {
  try {
    const previousCount = recentData.length;
    recentData = [];
    
    console.log(`DELETE /api/data - cleared ${previousCount} items`);

    res.json({
      success: true,
      message: 'All data cleared successfully',
      previousCount,
      currentCount: 0
    });
  } catch (error) {
    console.error('DELETE /api/data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Main route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test route for video analysis
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-video.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dataCount: recentData.length,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dashboard server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access your dashboard at: http://localhost:${PORT}`);
});

module.exports = app;
