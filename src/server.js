const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`Servidor de archivos REST en http://localhost:${config.port}`);
  console.log(`Almacenamiento: ${config.storageDir}`);
  console.log(config.apiKey ? 'Autenticación por x-api-key: ACTIVADA' : 'Autenticación: desactivada');
});
