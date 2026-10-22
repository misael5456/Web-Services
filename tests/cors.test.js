const os = require('os');
const fs = require('fs');
const path = require('path');
process.env.STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fsrest-cors-'));
process.env.API_KEY = 'secreto';
process.env.CORS_ORIGIN = '*';

const request = require('supertest');
const app = require('../src/app');

test('OPTIONS (preflight) responde 204 sin exigir API key', async () => {
  const res = await request(app).options('/api/files').set('Origin', 'http://otro.com');
  expect(res.status).toBe(204);
  expect(res.headers['access-control-allow-origin']).toBe('*');
  expect(res.headers['access-control-allow-headers']).toMatch(/x-api-key/);
});

test('GET / sirve el cliente web', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
  expect(res.text).toMatch(/Cliente REST/);
});
