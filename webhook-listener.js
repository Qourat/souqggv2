const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PORT = 9100;
const SECRET = process.env.WEBHOOK_SECRET || 'souq-deploy-2024';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook/deploy') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    // Verify signature
    const sig = req.headers['x-hub-signature-256'];
    if (sig) {
      const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
      if (sig !== expected) {
        console.log('[WEBHOOK] Invalid signature');
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    }

    console.log(`[${new Date().toISOString()}] Webhook received, deploying...`);
    
    try {
      const output = execSync('/var/www/souq_v2/deploy.sh', { 
        timeout: 180000,
        env: { ...process.env, PATH: '/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/v20.x/bin' }
      });
      console.log(output.toString());
      res.writeHead(200);
      res.end('Deployed successfully');
    } catch (err) {
      console.error('Deploy failed:', err.message);
      res.writeHead(500);
      res.end('Deploy failed');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Webhook listener running on 127.0.0.1:${PORT}`);
});
