const express = require('express');
const employeesController = require('./employees.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.get('/', requireAuth, employeesController.listEmployees);
router.post('/assign', requireAuth, requireRole(ROLES.CFO), employeesController.assignEmployee);
router.delete('/assign', requireAuth, requireRole(ROLES.CFO), employeesController.removeEmployee);

module.exports = router;
