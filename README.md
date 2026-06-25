# Razorpay Hiring Assignment — Reimbursements Tool (RBAC Backend)
 
 
> **Role-Based Access Control for a Reimbursements Management System**
> Stack: Node.js (>=20.10.2) · Express.js · PostgreSQL · Cookie-based Auth
> Port: **7002** (strict)
 

 ---
 
  
## Setup & Running
 
### Prerequisites
- Node.js >= 20.10.2
- PostgreSQL running locally
### 1. Clone & install
```bash
git clone <your-repo-url>
npm install
```
 
### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your DB credentials
```
 
### 3. Run migrations
```bash
npm run db:migrate
```
 
### 4. Seed CFO account
```bash
npm run db:seed-data
```
 
### 5. Start the server
```bash
npm run dev
# Runs on http://localhost:7002
```
 
---
 
## Environment Variables
 
```env
# .env.example
PORT=7002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=replace_with_your_database_name
DB_USER=postgres
DB_PASSWORD=yourpassword
SESSION_SECRET=your_session_secret_here
JWT_SECRET=replace-with-a-secure-jwt-secret

```
 
---

## Project Overview
 
A backend API for a reimbursements management tool with strict role-based access control (RBAC). Built for Razorpay's engineering hiring assignment.
 
**Key constraints:**
- JavaScript only (no TypeScript)
- Express.js framework
- PostgreSQL database
- Cookie-based session authentication
- All routes under `/rest` prefix
- Must run on port **7002**
---



## Roles & Permissions
 
| Role | String | Description |
|------|--------|-------------|
| Employee | `EMP` | Default role for every new registered user |
| Reporting Manager | `RM` | Manages a group of EMPs; approves/rejects reimbursements |
| Accounts Payable Executive | `APE` | Second-level approver for reimbursements |
| Chief Financial Officer | `CFO` | Root/super user. Seeded, not registered. Final viewer. |
 
**CFO Seed Credentials (exact):**
```
email:    cfo@org.com
password: CFO#ORG@April2026
```
 
---
 
 
## Organization Structure
 
```
CFO
 └── APE (multiple)
 └── RM (multiple)
      └── EMP (multiple, each reports to exactly one RM)
```
 
**Key rules:**
- Every EMP reports to exactly **one** RM
- There is **no direct relationship** between EMP↔APE, RM↔APE, APE↔CFO
- CFO assigns roles and manages RM↔EMP mappings
---
 
## File Structure
 
```
razorpay-reimbursements/
├── package.json                  # scripts: dev, db:migrate, db:seed-data
├── .env                          # environment variables (not committed)
├── .env.example                  # example env template
├── .gitignore
├── README.md
├── prompt-logs.txt               # incremental AI prompt log (required)
│
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_employee_rm_assignments.sql
│   ├── 003_create_reimbursements.sql
│   └── 004_create_reimbursement_approvals.sql
│
├── scripts/
│   ├── migrate.js                # runs all migrations in order
│   └── seed.js                   # seeds only the CFO account
│
└── src/
    ├── server.js                 # entry point, starts on port 7002
    ├── app.js                    # express app setup, middleware, routes
    │
    ├── config/
    │   └── db.js                 # PostgreSQL pool/connection config
    │
    ├── middleware/
    │   ├── auth.middleware.js    # validates session cookie, attaches user
    │   └── role.middleware.js    # role-guard factory: requireRole(...roles)
    │
    ├── modules/
    │   │
    │   ├── onboarding/           # PUBLIC endpoints
    │   │   ├── onboarding.routes.js
    │   │   ├── onboarding.controller.js
    │   │   └── onboarding.service.js
    │   │
    │   ├── roles/                # CFO-only role assignment
    │   │   ├── roles.routes.js
    │   │   ├── roles.controller.js
    │   │   └── roles.service.js
    │   │
    │   ├── employees/            # employee listing + RM assignments
    │   │   ├── employees.routes.js
    │   │   ├── employees.controller.js
    │   │   └── employees.service.js
    │   │
    │   └── reimbursements/       # create, update, list reimbursements
    │       ├── reimbursements.routes.js
    │       ├── reimbursements.controller.js
    │       └── reimbursements.service.js
    │
    └── utils/
        ├── response.js           # standard success/error response helpers
        ├── validators.js         # email domain check, input validation
        └── constants.js          # ROLES, STATUSES enums
```
 
---
 
## Database Schema
 
### Table: `users`
```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,       -- bcrypt hashed
  role       VARCHAR(10) NOT NULL DEFAULT 'EMP',
  created_at TIMESTAMP DEFAULT NOW()
);
```
 
### Table: `employee_rm_assignments`
*(tracks which EMP reports to which RM)*
```sql
CREATE TABLE employee_rm_assignments (
  id         SERIAL PRIMARY KEY,
  emp_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rm_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(emp_id)  -- one EMP can only have one RM
);
```
 
### Table: `reimbursements`
```sql
CREATE TABLE reimbursements (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- the EMP
  title        VARCHAR(255) NOT NULL,
  description  TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
  rm_approved  BOOLEAN DEFAULT FALSE,
  ape_approved BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
```
 
### Table: `reimbursement_approvals`
*(audit log of every approval/rejection action)*
```sql
CREATE TABLE reimbursement_approvals (
  id                SERIAL PRIMARY KEY,
  reimbursement_id  INT NOT NULL REFERENCES reimbursements(id) ON DELETE CASCADE,
  approver_id       INT NOT NULL REFERENCES users(id),
  approver_role     VARCHAR(10) NOT NULL,   -- RM | APE | CFO
  action            VARCHAR(20) NOT NULL,   -- APPROVED | REJECTED
  created_at        TIMESTAMP DEFAULT NOW()
);
```
 
---
 
## API Endpoints Reference
 
All endpoints are prefixed with `/rest`. Auth is **cookie-based**.
 
---
 
### PUBLIC ENDPOINTS
 
#### `POST /rest/onboardings/register`
Self-service registration. Role defaults to `EMP`.
 
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@org.com",
  "password": "secret123"
}
```
**Rules:** Only `@org.com` emails allowed.
 
---
 
#### `POST /rest/onboardings/login`
**Request Body:**
```json
{
  "email": "john@org.com",
  "password": "secret123"
}
```
Sets auth cookie on success. Only `@org.com` emails.
 
---
 
#### `POST /rest/onboardings/logout`
No body needed. Clears the auth cookie.
 
---
 
### PROTECTED ENDPOINTS (require auth cookie)
 
---
 
#### `POST /rest/roles/assign`
**Who:** CFO only
 
**Request Body:**
```json
{
  "userId": 5,
  "role": "RM"
}
```
Valid roles: `EMP`, `RM`, `APE`, `CFO`
 
---
 
#### `GET /rest/employees`
**Who:** RM, APE, CFO (EMP → 403)
 
**Visibility:**
| Role | Sees |
|------|------|
| RM | EMPs reporting to them |
| APE | All EMPs + all RMs |
| CFO | Everyone (all roles) |
 
**Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      { "userId": 1, "name": "Jane", "email": "jane@org.com", "role": "EMP" }
    ]
  }
}
```
 
---
 
#### `POST /rest/employees/assign`
**Who:** CFO only
 
Assigns an EMP to an RM.
 
**Request Body:**
```json
{
  "empUserId": 3,
  "rmUserId": 2
}
```
 
---
 
#### `DELETE /rest/employees/assign`
**Who:** CFO only
 
Removes the EMP↔RM assignment.
 
**Request Body:**
```json
{
  "empUserId": 3,
  "rmUserId": 2
}
```
 
---
 
#### `POST /rest/reimbursements`
**Who:** EMP only
 
Creates a new reimbursement. Starts as `PENDING`.
 
**Request Body:**
```json
{
  "title": "Team Lunch",
  "description": "Lunch with the engineering team",
  "amount": 1500.00
}
```
 
---
 
#### `PATCH /rest/reimbursements`
**Who:** RM, APE, CFO (EMP → 403)
 
Approve or reject a reimbursement.
 
**Request Body:**
```json
{
  "reimbursementId": 7,
  "status": "APPROVED"
}
```
Valid statuses: `APPROVED`, `REJECTED`
 
**Approval Logic (important):**
- RM approves → sets `rm_approved = true` internally
- APE approves → sets `ape_approved = true` internally
- EMP sees `APPROVED` **only when both** `rm_approved = true` AND `ape_approved = true`
- Any rejection (by RM, APE, or CFO) immediately sets status to `REJECTED`
---
 
#### `GET /rest/reimbursements`
**Who:** All roles (different views)
 
| Role | Sees |
|------|------|
| EMP | Their own reimbursements (with computed `status`) |
| RM | `PENDING` reimbursements from their EMPs (not yet RM-approved) |
| APE | Reimbursements RM-approved but not yet APE-approved |
| CFO | Reimbursements fully approved (both RM + APE) |
 
**Response:**
```json
{
  "status": "success",
  "data": {
    "reimbursements": [
      {
        "title": "Team Lunch",
        "description": "Lunch with the engineering team",
        "amount": 1500.00,
        "status": "PENDING"
      }
    ]
  }
}
```
 
---
 
#### `GET /rest/reimbursements/:userId`
**Who:** RM (for their subordinate EMPs), APE, CFO
 
Lists all reimbursements for the given `userId` — only allowed if that user is an EMP and a subordinate of the requester.
 
Same response shape as `GET /rest/reimbursements`.
 
---
 
## Approval Flow Logic
 
```
EMP raises reimbursement → status: PENDING (internal: rm_approved=false, ape_approved=false)
         |
         ▼
RM sees it (PENDING from their EMPs)
RM approves → rm_approved=true  |  RM rejects → status=REJECTED (done)
         |
         ▼
APE sees it (rm_approved=true, ape_approved=false)
APE approves → ape_approved=true  |  APE rejects → status=REJECTED (done)
         |
         ▼
CFO sees it (rm_approved=true AND ape_approved=true) → status=APPROVED (visible to EMP)
         |
         ▼
EMP now sees status: APPROVED
```
 
**What EMP sees at each stage:**
- Before RM approves → `PENDING`
- After RM approves, before APE approves → `PENDING` (still shown as pending)
- After both approve → `APPROVED`
- If rejected at any stage → `REJECTED`
---
