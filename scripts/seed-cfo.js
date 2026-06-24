require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('../src/config/db');

const CFO_EMAIL = 'cfo@example.com';
const CFO_NAME = 'Chief Financial Officer';
const CFO_PASSWORD = 'ChangeMe123!';

const seedCfo = async () => {
  const passwordHash = await bcrypt.hash(CFO_PASSWORD, 12);

  await pool.query(
    `
      INSERT INTO roles (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
    `,
    ['CFO']
  );

  const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['CFO']);
  const cfoRoleId = roleResult.rows[0].id;

  await pool.query(
    `
      INSERT INTO employees (role_id, name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        role_id = EXCLUDED.role_id,
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW()
    `,
    [cfoRoleId, CFO_NAME, CFO_EMAIL, passwordHash]
  );

  console.log(`CFO account seeded: ${CFO_EMAIL}`);
};

seedCfo()
  .catch((error) => {
    console.error('CFO seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
