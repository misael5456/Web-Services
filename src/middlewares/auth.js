const crypto = require('crypto');
const config = require('../config');
const HttpError = require('../utils/HttpError');

const hash = (v) => crypto.createHash('sha256').update(String(v)).digest();

// Si API_KEY está definida, exige el header x-api-key
module.exports = (req, res, next) => {
  if (!config.apiKey) return next();
  const provided = req.get('x-api-key') || '';
  if (!crypto.timingSafeEqual(hash(provided), hash(config.apiKey))) {
    res.set('WWW-Authenticate', 'ApiKey');
    throw new HttpError(401, 'API key inválida o ausente');
  }
  next();
};
