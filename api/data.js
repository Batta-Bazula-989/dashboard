// api/data.js
let recentData = [];
const maxDataSize = 100;

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-id, x-batch-id, x-batch-index, x-batch-total, x-item-id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET requests
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: recentData,
      count: recentData.length,
      timestamp: new Date().toISOString()
    });
  }

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const data = req.body;
      const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      recentData.push({
        data,
        timestamp: new Date().toISOString(),
        requestId,
        source: 'api'
      });

      if (recentData.length > maxDataSize) recentData.shift();

      return res.status(200).json({
        success: true,
        message: 'Data received and stored',
        requestId,
        totalItems: recentData.length
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
