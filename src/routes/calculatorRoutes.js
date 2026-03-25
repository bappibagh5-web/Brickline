const express = require('express');
const calculatorController = require('../controllers/calculatorController');

const router = express.Router();

router.post('/calculator/calculate', calculatorController.calculate);

module.exports = router;
