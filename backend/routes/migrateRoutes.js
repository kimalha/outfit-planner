const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { migrateData } = require('../controllers/migrateController');

router.use(verifyToken);

router.post('/', migrateData);

module.exports = router;
