const express = require('express');
const onboardingController = require('./onboarding.controller');

const router = express.Router();

router.post('/register', onboardingController.register);
router.post('/login', onboardingController.login);
router.post('/logout', onboardingController.logout);

module.exports = router;
