const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Step 1: Kill any existing process on port 8011
console.log('[1/3] Clearing port 8011...');
try {
    const result = execSync(
        'powershell -Command "Get-NetTCPConnection -LocalPort 8011 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
        { encoding: 'utf8' }
    ).trim();
    if (result) {
        const pids = [...new Set(result.split(/\r?\n/).map(p => p.trim()).filter(Boolean))];
        pids.forEach(pid => {
            try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
        });
        console.log('    Killed old processes on port 8011.');
    } else {
        console.log('    Port 8011 is free.');
    }
} catch (e) {
    console.log('    Port 8011 is free.');
}

// Step 2: Start Cloudflare tunnel
console.log('[2/3] Starting Cloudflare Tunnel...');
const cloudflared = spawn(path.join(__dirname, 'cloudflared.exe'), [
    'tunnel', '--url', 'http://localhost:8011'
]);

let urlFound = false;

cloudflared.stderr.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];
        console.log('');
        console.log('====================================================');
        console.log('  Backend Tunnel URL:');
        console.log(`  ${tunnelUrl}`);
        console.log('====================================================');
        console.log('');

        // Write tunnel URL to mobile/.env so Expo reads it on startup
        const envPath = path.join(__dirname, '..', 'mobile', '.env');
        fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${tunnelUrl}\n`);
        console.log('[Auto-Config] Wrote tunnel URL to mobile/.env');
        console.log('');

        // Step 3: Start the backend server
        console.log('[3/3] Starting backend server on port 8011...');
        const backend = spawn('node', ['src/server.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        backend.on('close', (code) => {
            console.log(`Backend server exited with code ${code}`);
            cloudflared.kill();
            process.exit(code);
        });
    }
});

cloudflared.on('close', (code) => {
    console.log(`Cloudflare tunnel exited with code ${code}`);
    process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    cloudflared.kill();
    process.exit(0);
});
