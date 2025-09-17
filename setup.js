const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up n8n Data Dashboard...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found. Please run this from the project directory.');
    process.exit(1);
}

try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!\n');

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
        console.error('❌ Failed to install dependencies.');
        process.exit(1);
    }

    console.log('🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Configure your n8n HTTP node to send data to: http://localhost:3000/api/data');
    console.log('4. (Optional) Run test data: node test-data.js');

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
}
