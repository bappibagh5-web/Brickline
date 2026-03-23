const express = require('express');
const fieldController = require('../controllers/fieldController');

const router = express.Router();

router.get('/fields', fieldController.getFields);

module.exports = router;
