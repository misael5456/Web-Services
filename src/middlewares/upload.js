const multer = require('multer');
const config = require('../config');

// Memoria + límite: permite validar y escribir con flag 'wx' (409 si existe)
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 1 },
});
