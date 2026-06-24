CREATE TABLE IF NOT EXISTS reimbursement_approvals (
  id SERIAL PRIMARY KEY,
  reimbursement_id INT NOT NULL REFERENCES reimbursements(id),
  approver_id INT NOT NULL REFERENCES users(id),
  approver_role VARCHAR(10) NOT NULL,
  action VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
