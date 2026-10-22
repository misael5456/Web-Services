require('dotenv').config({ quiet: true });
const path = require('path');

const DEFAULT_EXT = '.txt,.md,.json,.csv,.pdf,.png,.jpg,.jpeg,.gif,.zip';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage')),
  maxFileSize: (parseFloat(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  apiKey: process.env.API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN === undefined ? '*' : process.env.CORS_ORIGIN,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || DEFAULT_EXT)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};
