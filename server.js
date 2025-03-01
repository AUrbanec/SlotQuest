const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // 24 hours
    });
    res.end();
    return;
  }
  
  // Handle POST request to save stake.json
  if (req.method === 'POST' && req.url === '/save-stake-json') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
      
      // Prevent potential DOS attack by limiting body size
      if (body.length > 1e6) {
        body = '';
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Payload too large' 
        }));
        req.connection.destroy();
      }
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Validate that the data structure is correct
        if (!Array.isArray(data) || !data[0] || !Array.isArray(data[0].slot_games)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Invalid data structure' 
          }));
          return;
        }
        
        // Save to file
        fs.writeFile(
          path.join(__dirname, 'stake.json'),
          JSON.stringify(data, null, 2),
          'utf8',
          err => {
            if (err) {
              console.error('Error saving stake.json:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                message: 'Error saving file', 
                error: err.message 
              }));
              return;
            }
            
            console.log('stake.json file updated successfully');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true, 
              message: 'File saved successfully' 
            }));
          }
        );
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON', 
          error: error.message 
        }));
      }
    });
    
    return;
  }
  
  // Handle static file requests
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);
  
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.log(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('404 - File Not Found');
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      // Add CORS headers to allow requests from any origin
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Admin interface available at http://localhost:${PORT}/admin.html`);
  console.log(`Press Ctrl+C to stop`);
});