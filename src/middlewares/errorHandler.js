const multer = require('multer');
const config = require('../config');

module.exports = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      message = `El archivo excede el límite de ${config.maxFileSize / 1024 / 1024} MB`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      status = 400;
      message = 'Envía un único archivo en el campo "file" (multipart/form-data)';
    } else {
      status = 400;
    }
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = `El archivo excede el límite de ${config.maxFileSize / 1024 / 1024} MB`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON inválido';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Error interno del servidor';
  }

  res.status(status).json({ error: { status, message } });
};
