CREATE TABLE IF NOT EXISTS employee_rm_assignments (
  id SERIAL PRIMARY KEY,
  emp_id INT NOT NULL REFERENCES users(id),
  rm_id INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT employee_rm_assignments_emp_id_unique UNIQUE (emp_id)
);
