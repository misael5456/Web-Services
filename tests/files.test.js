const os = require('os');
const fs = require('fs');
const path = require('path');

// Config de prueba ANTES de cargar la app
process.env.STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fsrest-'));
process.env.MAX_FILE_SIZE_MB = '1';
process.env.API_KEY = '';

const request = require('supertest');
const app = require('../src/app');

describe('API de archivos REST', () => {
  test('GET /api/health -> 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST sube un archivo -> 201 + Location', async () => {
    const res = await request(app).post('/api/files').attach('file', Buffer.from('hola'), 'a.txt');
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/api/files/a.txt');
    expect(res.body.size).toBe(4);
  });

  test('POST duplicado -> 409', async () => {
    const res = await request(app).post('/api/files').attach('file', Buffer.from('x'), 'a.txt');
    expect(res.status).toBe(409);
  });

  test('POST sin archivo -> 400', async () => {
    const res = await request(app).post('/api/files');
    expect(res.status).toBe(400);
  });

  test('POST extensión no permitida -> 415', async () => {
    const res = await request(app).post('/api/files').attach('file', Buffer.from('x'), 'virus.exe');
    expect(res.status).toBe(415);
  });

  test('POST archivo demasiado grande -> 413', async () => {
    const big = Buffer.alloc(1.5 * 1024 * 1024, 'a');
    const res = await request(app).post('/api/files').attach('file', big, 'big.txt');
    expect(res.status).toBe(413);
  });

  test('GET lista con paginación y _links', async () => {
    const res = await request(app).get('/api/files?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.name)).toContain('a.txt');
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    expect(res.body._links.self.href).toBeDefined();
  });

  test('GET descarga el contenido', async () => {
    const res = await request(app).get('/api/files/a.txt');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hola');
  });

  test('HEAD devuelve metadatos sin cuerpo', async () => {
    const res = await request(app).head('/api/files/a.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBe('4');
  });

  test('GET inexistente -> 404', async () => {
    const res = await request(app).get('/api/files/nada.txt');
    expect(res.status).toBe(404);
  });

  test('Path traversal -> 400', async () => {
    const res = await request(app).get('/api/files/..%2Fsecret.txt');
    expect(res.status).toBe(400);
  });

  test('PUT crea (201) y luego reemplaza (200)', async () => {
    const r1 = await request(app).put('/api/files/b.txt').set('Content-Type', 'text/plain').send('uno');
    expect(r1.status).toBe(201);
    const r2 = await request(app).put('/api/files/b.txt').set('Content-Type', 'text/plain').send('dos');
    expect(r2.status).toBe(200);
    const get = await request(app).get('/api/files/b.txt');
    expect(get.text).toBe('dos');
  });

  test('PUT de un .json con Content-Type JSON conserva el contenido', async () => {
    const res = await request(app).put('/api/files/d.json').set('Content-Type', 'application/json').send({ ok: true });
    expect(res.status).toBe(201);
    expect(res.body.size).toBe(JSON.stringify({ ok: true }).length);
  });

  test('PATCH renombra -> 200', async () => {
    const res = await request(app).patch('/api/files/b.txt').send({ name: 'c.txt' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('c.txt');
    expect((await request(app).get('/api/files/b.txt')).status).toBe(404);
  });

  test('PATCH a nombre existente -> 409', async () => {
    const res = await request(app).patch('/api/files/c.txt').send({ name: 'a.txt' });
    expect(res.status).toBe(409);
  });

  test('DELETE -> 204 y luego 404', async () => {
    expect((await request(app).delete('/api/files/c.txt')).status).toBe(204);
    expect((await request(app).delete('/api/files/c.txt')).status).toBe(404);
  });
});
