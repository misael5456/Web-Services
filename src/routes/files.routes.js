const express = require('express');
const config = require('../config');
const upload = require('../middlewares/upload');
const c = require('../controllers/files.controller');

const router = express.Router();

router.get('/', c.list);
router.post('/', upload.single('file'), c.create);

router.head('/:name', c.head);
router.get('/:name', c.download);
// Parsers por ruta: un parser JSON global rompería PUT de archivos .json
router.put('/:name', express.raw({ type: () => true, limit: config.maxFileSize }), c.replace);
router.patch('/:name', express.json({ limit: '10kb' }), c.rename);
router.delete('/:name', c.remove);

module.exports = router;
