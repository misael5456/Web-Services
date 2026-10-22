const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config');
const logger = require('./middlewares/logger');
const cors = require('./middlewares/cors');
const auth = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const filesRoutes = require('./routes/files.routes');
const HttpError = require('./utils/HttpError');

fs.mkdirSync(config.storageDir, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use(logger);
app.use(cors);
app.use(express.static(path.join(__dirname, '..', 'public'))); // cliente web en /

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/files', auth, filesRoutes);

app.use((req, res, next) => next(new HttpError(404, 'Ruta no encontrada')));
app.use(errorHandler);

module.exports = app;
