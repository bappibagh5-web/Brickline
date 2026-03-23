const express = require('express');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

router.post('/applications', applicationController.createApplication);
router.get('/applications/:id', applicationController.getApplication);
router.patch('/applications/:id', applicationController.updateApplication);

module.exports = router;
