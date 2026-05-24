const { spawn, execSync } = require('child_process');
const path = require('path');

// Step 1: Kill any existing process on port 8081
console.log('[1/3] Clearing port 8081...');
try {
    const result = execSync(
        'powershell -Command "Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"',
        { encoding: 'utf8' }
    ).trim();
    if (result) {
        const pids = [...new Set(result.split(/\r?\n/).map(p => p.trim()).filter(Boolean))];
        pids.forEach(pid => {
            try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (e) {}
        });
        console.log('    Killed old processes on port 8081.');
    } else {
        console.log('    Port 8081 is free.');
    }
} catch (e) {
    console.log('    Port 8081 is free.');
}

console.log('[2/3] Starting Cloudflare Tunnel for Expo Metro Bundler...');

const cloudflared = spawn(path.join(__dirname, 'cloudflared.exe'), [
    'tunnel', 
    '--url', 
    'http://localhost:8081'
]);

let urlFound = false;

cloudflared.stderr.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (match && !urlFound) {
        urlFound = true;
        const tunnelUrl = match[0];
        console.log(`\n====================================================`);
        console.log(`SUCCESS! Expo Tunnel created at:`);
        console.log(`-> ${tunnelUrl}`);
        console.log(`====================================================\n`);
        
        console.log(`[3/3] Starting Expo with Cloudflare Tunnel...`);
        // Start Expo and tell it to use this tunnel URL for the QR code!
        const expo = spawn('npx', ['expo', 'start', '--clear'], { 
            stdio: 'inherit', 
            shell: true,
            env: {
                ...process.env,
                EXPO_PACKAGER_PROXY_URL: tunnelUrl
            }
        });

        expo.on('close', (code) => {
            console.log(`Expo server exited with code ${code}`);
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
