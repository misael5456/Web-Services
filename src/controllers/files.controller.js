const fs = require('fs/promises');
const config = require('../config');
const HttpError = require('../utils/HttpError');
const { resolveSafe, assertAllowedExtension } = require('../utils/safePath');

const BASE = '/api/files';
const link = (name) => `${BASE}/${encodeURIComponent(name)}`;

const toMeta = (name, st) => ({
  name,
  size: st.size,
  createdAt: st.birthtime,
  modifiedAt: st.mtime,
  _links: { self: { href: link(name) } },
});

async function statFile(full) {
  try {
    const st = await fs.stat(full);
    if (!st.isFile()) throw new HttpError(404, 'Archivo no encontrado');
    return st;
  } catch (e) {
    if (e.code === 'ENOENT') throw new HttpError(404, 'Archivo no encontrado');
    throw e;
  }
}

const exists = (full) => fs.access(full).then(() => true, () => false);

// GET /api/files?page=1&limit=10
async function list(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const entries = await fs.readdir(config.storageDir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith('.')) continue;
    files.push(toMeta(e.name, await fs.stat(resolveSafe(e.name))));
  }
  files.sort((a, b) => a.name.localeCompare(b.name));

  const total = files.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const data = files.slice((page - 1) * limit, page * limit);
  const pageLink = (p) => `${BASE}?page=${p}&limit=${limit}`;

  const _links = { self: { href: pageLink(page) } };
  if (page > 1) _links.prev = { href: pageLink(page - 1) };
  if (page < totalPages) _links.next = { href: pageLink(page + 1) };

  res.json({ data, pagination: { page, limit, total, totalPages }, _links });
}

// GET /api/files/:name
async function download(req, res, next) {
  const { name } = req.params;
  const full = resolveSafe(name);
  await statFile(full);
  res.download(full, name, (err) => {
    if (err && !res.headersSent) next(err);
  });
}

// HEAD /api/files/:name  (solo metadatos, sin cuerpo)
async function head(req, res) {
  const { name } = req.params;
  const st = await statFile(resolveSafe(name));
  res.type(name);
  res.set({
    'Content-Length': st.size,
    'Last-Modified': st.mtime.toUTCString(),
  });
  res.status(200).end();
}

// POST /api/files  (multipart/form-data, campo "file")
async function create(req, res) {
  if (!req.file) {
    throw new HttpError(400, 'Falta el archivo en el campo "file" (multipart/form-data)');
  }
  // Multer decodifica el nombre como latin1; lo corregimos a UTF-8
  const name = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const full = resolveSafe(name);
  assertAllowedExtension(name);

  try {
    await fs.writeFile(full, req.file.buffer, { flag: 'wx' }); // 'wx' falla si existe
  } catch (e) {
    if (e.code === 'EEXIST') {
      throw new HttpError(409, 'Ya existe un archivo con ese nombre. Usa PUT para reemplazarlo');
    }
    throw e;
  }
  const st = await fs.stat(full);
  res.status(201).location(link(name)).json(toMeta(name, st));
}

// PUT /api/files/:name  (cuerpo = contenido binario del archivo)
async function replace(req, res) {
  const { name } = req.params;
  const full = resolveSafe(name);
  assertAllowedExtension(name);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(400, 'El cuerpo de la petición está vacío');
  }
  const existed = await exists(full);
  await fs.writeFile(full, req.body);
  const st = await fs.stat(full);

  res.status(existed ? 200 : 201);
  if (!existed) res.location(link(name));
  res.json(toMeta(name, st));
}

// PATCH /api/files/:name  body JSON: { "name": "nuevo.txt" }
async function rename(req, res) {
  const { name } = req.params;
  const newName = req.body && req.body.name;
  const src = resolveSafe(name);
  if (typeof newName !== 'string') {
    throw new HttpError(400, 'Se requiere un JSON con { "name": "nuevo-nombre.ext" }');
  }
  const dst = resolveSafe(newName);
  assertAllowedExtension(newName);
  await statFile(src);

  if (newName !== name) {
    try {
      await fs.link(src, dst); // falla con EEXIST si el destino existe (no sobrescribe)
    } catch (e) {
      if (e.code === 'EEXIST') throw new HttpError(409, 'Ya existe un archivo con el nuevo nombre');
      throw e;
    }
    await fs.unlink(src);
  }
  res.json(toMeta(newName, await fs.stat(dst)));
}

// DELETE /api/files/:name
async function remove(req, res) {
  const full = resolveSafe(req.params.name);
  await statFile(full);
  await fs.unlink(full);
  res.status(204).end();
}

module.exports = { list, download, head, create, replace, rename, remove };
