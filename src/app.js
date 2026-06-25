const express = require('express');
const cookieParser = require('cookie-parser');
const onboardingRoutes = require('./modules/onboarding/onboarding.routes');
const rolesRoutes = require('./modules/roles/roles.routes');
const employeesRoutes = require('./modules/employees/employees.routes');
const reimbursementsRoutes = require('./modules/reimbursements/reimbursements.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/rest/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/rest/onboardings', onboardingRoutes);
app.use('/rest/roles', rolesRoutes);
app.use('/rest/employees', employeesRoutes);
app.use('/rest/reimbursements', reimbursementsRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

module.exports = app;
