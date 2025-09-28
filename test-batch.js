const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBatchHandling() {
    console.log('🧪 Testing batch handling improvements...\n');

    // Test 1: Single item
    console.log('Test 1: Single item');
    try {
        const response = await axios.post(`${BASE_URL}/api/data`, {
            test: 'single item',
            id: 1
        }, {
            headers: {
                'x-request-id': 'test-single-1',
                'x-batch-id': 'single-test',
                'x-batch-total': '1',
                'x-batch-index': '0'
            }
        });
        console.log('✅ Single item response:', response.data);
    } catch (error) {
        console.error('❌ Single item failed:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Batch of 3 items (simulate missing one)
    console.log('Test 2: Incomplete batch (missing item 1)');
    const batchId = `batch-${Date.now()}`;
    
    try {
        // Send item 0
        console.log('Sending item 0...');
        const response0 = await axios.post(`${BASE_URL}/api/data`, {
            test: 'batch item 0',
            id: 0
        }, {
            headers: {
                'x-request-id': `${batchId}-0`,
                'x-batch-id': batchId,
                'x-batch-total': '3',
                'x-batch-index': '0'
            }
        });
        console.log('✅ Item 0 response:', response0.data);

        // Send item 2 (skip item 1)
        console.log('Sending item 2 (skipping 1)...');
        const response2 = await axios.post(`${BASE_URL}/api/data`, {
            test: 'batch item 2',
            id: 2
        }, {
            headers: {
                'x-request-id': `${batchId}-2`,
                'x-batch-id': batchId,
                'x-batch-total': '3',
                'x-batch-index': '2'
            }
        });
        console.log('✅ Item 2 response:', response2.data);

        // Check health to see pending batch
        console.log('\nChecking health status...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('📊 Health status:', JSON.stringify(healthResponse.data, null, 2));

        // Wait a moment then send missing item 1
        console.log('\nSending missing item 1...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response1 = await axios.post(`${BASE_URL}/api/data`, {
            test: 'batch item 1',
            id: 1
        }, {
            headers: {
                'x-request-id': `${batchId}-1`,
                'x-batch-id': batchId,
                'x-batch-total': '3',
                'x-batch-index': '1'
            }
        });
        console.log('✅ Item 1 response:', response1.data);

    } catch (error) {
        console.error('❌ Batch test failed:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Check final health status
    console.log('Test 3: Final health check');
    try {
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('📊 Final health status:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

// Run tests
testBatchHandling().catch(console.error);

