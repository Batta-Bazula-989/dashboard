const WebSocket = require('ws');

// Test script to simulate n8n sending data
const testData = [
    {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        timestamp: new Date().toISOString(),
        status: "active"
    },
    {
        id: 2,
        name: "Another User",
        email: "another@example.com",
        timestamp: new Date().toISOString(),
        status: "pending"
    },
    {
        id: 3,
        name: "Third User",
        email: "third@example.com",
        timestamp: new Date().toISOString(),
        status: "completed"
    }
];

async function sendTestData() {
    const baseUrl = 'http://localhost:3000';

    console.log('🧪 Sending test data to dashboard...');

    for (let i = 0; i < testData.length; i++) {
        const data = testData[i];

        try {
            const response = await fetch(`${baseUrl}/api/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log(`✅ Data ${i + 1} sent:`, result);

            // Wait 2 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ Error sending data ${i + 1}:`, error.message);
        }
    }

    console.log('🎉 Test data sending completed!');
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000/api/health');
        const health = await response.json();
        console.log('✅ Server is running:', health);
        return true;
    } catch (error) {
        console.error('❌ Server is not running. Please start it with: npm start');
        return false;
    }
}

// Run the test
async function runTest() {
    console.log('🚀 Starting test...');

    const serverRunning = await checkServer();
    if (!serverRunning) {
        process.exit(1);
    }

    await sendTestData();
}

// Run if this file is executed directly
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = { sendTestData, testData };

