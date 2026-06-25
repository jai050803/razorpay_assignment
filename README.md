Phase 1: Pre-Flight & Server Start
Before you fire a single API request, your environment must be pristine.

Start your PostgreSQL server: Ensure the database engine is actually running on your machine.

Run Migrations: In your terminal, run npm run db:migrate to build the tables.

Run the Seed: Run npm run db:seed-data to inject the CFO account.

Boot the App: Run npm run dev.

Checkpoint: Check your terminal console. It must say it is running on port 7002.

Phase 2: Thunder Client Setup
Thunder Client usually handles cookies automatically, but you need to be aware of them.

Base URL: Every single request will start with http://localhost:7002/rest.

Headers: For POST/PATCH requests, ensure your header is set to Content-Type: application/json.

Cookies: After you hit a login/register endpoint, look at the "Cookies" tab in Thunder Client's response section. You must see your JWT/Session cookie there. As long as it is there, Thunder Client will automatically attach it to your next requests.

Phase 3: The Complete API Testing Sequence
Follow this exact order to simulate the full lifecycle of the application.

1. Negative Testing (The Gatekeeper)
Action: POST /onboardings/register

Body: { "name": "Test", "email": "test@gmail.com", "password": "password123" }

Expected: 400 Bad Request. It must reject non-@org.com emails.

2. Staff Registration (Building your test users)
Register four separate accounts. They will all start as EMP by default.

Action: POST /onboardings/register

Bodies to send (one by one):

Employee 1: { "name": "Emp One", "email": "emp1@org.com", "password": "password123" }

Employee 2: { "name": "Emp Two", "email": "emp2@org.com", "password": "password123" }

Manager: { "name": "Manager", "email": "rm@org.com", "password": "password123" }

Exec: { "name": "Executive", "email": "ape@org.com", "password": "password123" }

Expected: 200/201 Success for all four.

3. CFO Administration (RBAC Validation)
Log in as the seed user to set up the company hierarchy.

Action: POST /onboardings/login

Body: { "email": "cfo@org.com", "password": "CFO#ORG@April2026" }

Action: POST /roles/assign

Set rm@org.com's userId to "RM"

Set ape@org.com's userId to "APE"

Action: POST /employees/assign

Assign emp1@org.com's userId to rm@org.com's userId.

Assign emp2@org.com's userId to rm@org.com's userId.