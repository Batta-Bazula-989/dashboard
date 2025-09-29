// Simple in-memory storage (will reset on each cold start)
let recentData = [];
const maxDataSize = 100;

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-request-id, x-batch-id, x-batch-index, x-batch-total, x-item-id');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET - Fetch recent data
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            data: recentData,
            count: recentData.length,
            timestamp: new Date().toISOString()
        });
    }

    // POST - Receive new data
    if (req.method === 'POST') {
        try {
            const data = req.body;
            const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            console.log(`[${requestId}] Received data`);

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

            return res.status(200).json({
                success: true,
                message: 'Data received and stored',
                requestId: requestId,
                totalItems: recentData.length
            });
        } catch (error) {
            console.error('Error processing data:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}