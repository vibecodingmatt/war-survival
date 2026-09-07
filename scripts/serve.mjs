import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
http.createServer((req, res) => {
  try {
    let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (relative.startsWith('/war-survival/')) relative = relative.slice('/war-survival'.length);
    const target = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
    const within = path.relative(root, target);
    if (within.startsWith('..') || path.isAbsolute(within) || /(^|[\\/])(?:\.git|references|node_modules)(?:[\\/]|$)/.test(within)) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const stat = statSync(target);
    if (!stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    createReadStream(target).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log('War: Survival: http://127.0.0.1:' + port + '/war-survival/'));
