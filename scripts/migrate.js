require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../src/config/db');

const migrationsDir = path.join(__dirname, '..', 'migrations');

const runMigrations = async () => {
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  console.log('Migrations completed.');
};

runMigrations()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
