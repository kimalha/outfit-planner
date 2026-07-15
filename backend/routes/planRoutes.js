const express = require('express');
const router = express.Router();
const { getPlans, savePlan } = require('../controllers/planController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.route('/')
    .get(getPlans)
    .post(savePlan);

module.exports = router;