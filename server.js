const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, reqUrl));

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA if not a static asset
        if (!ext || ext === '.html') {
          fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
            if (err2) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('404 Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(indexContent);
            }
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🚀 Career Apex CRM is running at: http://localhost:${port}\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`⚠️ Port ${PORT} is already in use. Trying alternative port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);

