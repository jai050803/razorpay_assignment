const express = require('express');
const cookieParser = require('cookie-parser');
const onboardingRoutes = require('./modules/onboarding/onboarding.routes');
const rolesRoutes = require('./modules/roles/roles.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/rest/onboardings', onboardingRoutes);
app.use('/rest/roles', rolesRoutes);

module.exports = app;
