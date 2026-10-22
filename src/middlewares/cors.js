const config = require('../config');

// CORS opcional (CORS_ORIGIN). Solo hace falta si el cliente se abre desde otro origen
// (por ejemplo, un index.html abierto con file:// o con Live Server).
module.exports = (req, res, next) => {
  if (config.corsOrigin) {
    res.set({
      'Access-Control-Allow-Origin': config.corsOrigin,
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
      'Access-Control-Expose-Headers': 'Location,Content-Disposition,Content-Length',
      Vary: 'Origin',
    });
    if (req.method === 'OPTIONS') return res.status(204).end();
  }
  next();
};
