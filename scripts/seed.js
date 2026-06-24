require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

const CFO_USER = {
  name: 'CFO',
  email: 'cfo@org.com',
  password: 'CFO#ORG@April2026',
  role: 'CFO',
};

const seedCfo = async () => {
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [
    CFO_USER.email,
  ]);

  if (existingUser.rowCount > 0) {
    console.log(`CFO user already exists: ${CFO_USER.email}. Skipping seed.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(CFO_USER.password, 10);

  await pool.query(
    `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
    `,
    [CFO_USER.name, CFO_USER.email, hashedPassword, CFO_USER.role]
  );

  console.log(`CFO user seeded: ${CFO_USER.email}`);
};

seedCfo()
  .catch((error) => {
    console.error('CFO seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
