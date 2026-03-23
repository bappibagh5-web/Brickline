const express = require('express');
const conditionController = require('../controllers/conditionController');

const router = express.Router();

router.post('/applications/:id/conditions', conditionController.createCondition);
router.get('/applications/:id/conditions', conditionController.getConditions);
router.patch('/conditions/:id', conditionController.updateCondition);

module.exports = router;
