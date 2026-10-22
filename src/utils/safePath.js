const path = require('path');
const config = require('../config');
const HttpError = require('./HttpError');

/**
 * Valida que el nombre sea un nombre de archivo simple (sin rutas) y
 * devuelve la ruta absoluta dentro de STORAGE_DIR.
 * Evita ataques de path traversal (../../etc/passwd).
 */
function resolveSafe(name) {
  if (
    typeof name !== 'string' ||
    name.length === 0 ||
    name.length > 255 ||
    name.includes('\0') ||
    name.includes('\\') ||
    name.startsWith('.') ||
    name !== path.basename(name)
  ) {
    throw new HttpError(400, 'Nombre de archivo inválido');
  }
  const full = path.join(config.storageDir, name);
  if (!full.startsWith(config.storageDir + path.sep)) {
    throw new HttpError(400, 'Nombre de archivo inválido');
  }
  return full;
}

/** Lista blanca de extensiones (solo al escribir archivos). */
function assertAllowedExtension(name) {
  const ext = path.extname(name).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    throw new HttpError(
      415,
      `Tipo de archivo no permitido. Extensiones válidas: ${config.allowedExtensions.join(', ')}`
    );
  }
}

module.exports = { resolveSafe, assertAllowedExtension };
