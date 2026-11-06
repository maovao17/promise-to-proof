import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const root = new URL('../examples/venture-crm/', import.meta.url);
const pages = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/customers.mjs': ['customers.mjs', 'text/javascript; charset=utf-8']
};
createServer((req, res) => {
  const page = Object.hasOwn(pages, req.url) ? pages[req.url] : null;
  if (req.method !== 'GET' || !page) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': page[1] }).end(readFileSync(new URL(page[0], root)));
}).listen(4173, '127.0.0.1', () => console.log('Customer Desk: http://127.0.0.1:4173'));
