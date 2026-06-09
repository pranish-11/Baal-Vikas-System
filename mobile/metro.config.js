const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    return (req, res, next) => {
      if (req.url === '/api-url') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        try {
          const envPath = path.join(__dirname, '.env');
          if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/EXPO_PUBLIC_API_URL=(.+)/);
            if (match && match[1]) {
              res.end(JSON.stringify({ apiUrl: match[1].trim() }));
              return;
            }
          }
        } catch (e) {
          console.error('Error reading .env in Metro middleware:', e);
        }
        res.end(JSON.stringify({ apiUrl: null }));
        return;
      }
      return metroMiddleware(req, res, next);
    };
  }
};

module.exports = config;

