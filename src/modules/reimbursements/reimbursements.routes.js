const express = require('express');
const reimbursementsController = require('./reimbursements.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const { ROLES } = require('../../utils/constants');

const router = express.Router();

router.get('/', requireAuth, reimbursementsController.listReimbursements);

router.post(
  '/',
  requireAuth,
  requireRole(ROLES.EMP),
  reimbursementsController.createReimbursement
);

router.patch(
  '/',
  requireAuth,
  requireRole(ROLES.RM, ROLES.APE, ROLES.CFO),
  reimbursementsController.updateStatus
);

module.exports = router;
