const express = require('express');
const employeesController = require('./employees.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, employeesController.listEmployees);

module.exports = router;
