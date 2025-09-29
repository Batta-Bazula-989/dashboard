// Simple server for Vercel deployment
// This file is required by Vercel but the actual API endpoints are in /api/

const express = require('express');
const app = express();

// Serve static files from public directory
app.use(express.static('public'));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index-vercel.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
