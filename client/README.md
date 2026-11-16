# Freedom Dance Studio — Management Platform

> **Project status:** Planning | **Started:** November 16, 2026 | **Developer:** Stevenson
>
> A separate full-stack application for Freedom Dance Studio. Build and test it independently, then connect it to [vegasfreedomdancestudio.com](https://vegasfreedomdancestudio.com/), potentially at `app.vegasfreedomdancestudio.com`.

## Project in action

- **Live app:** Not deployed yet
- **Repository:** Add GitHub URL here
- **Production website:** https://vegasfreedomdancestudio.com/
- **Current phase:** Phase 1 — Project setup
- **Next task:** Step 1 — Create project folders and React app

## Project goal

Build a studio management platform where:

- **Guests** browse classes and events, book and pay without a permanent account, and receive confirmations.
- **Members/dancers** register, log in/out, manage profiles, book classes/private lessons, buy tickets, view membership and payments, and receive reminders.
- **Instructors** view assigned classes and rosters, manage attendance, and see their teaching schedules.
- **Managers** manage students, instructors, classes, events, bookings, studio rentals, and payments.
- **Admins** control staff access, settings, and all studio operations.

**Important:** Guest checkout is not the same as a guest login. Public registration creates a `MEMBER` account only. `INSTRUCTOR`, `MANAGER`, and `ADMIN` roles are assigned through authorized admin actions.

## Technology stack (planned)

| Layer          | Technology                                                                         |
| -------------- | ---------------------------------------------------------------------------------- |
| Frontend       | React + Vite                                                                       |
| Routing        | React Router                                                                       |
| UI             | Tailwind CSS + shadcn/ui                                                           |
| State          | Redux Toolkit + React Redux                                                        |
| HTTP           | Axios                                                                              |
| Backend        | Node.js + Express                                                                  |
| Database       | PostgreSQL + Prisma                                                                |
| Authentication | Custom secure cookie-based sessions (planned; decide implementation before coding) |
| Payments       | Stripe Checkout + Billing                                                          |
| Email          | Resend                                                                             |
| SMS            | Twilio                                                                             |
| Deployment     | Choose later; frontend and API can deploy independently                            |

Keep versions current and check each library's official documentation when implementing. This guide is a roadmap, not a claim that features are already built.

## Daily workflow — read this first

1. Open this README and find **Current phase** and **Next task** above.
2. Review the checklist for that step.
3. Work on **one small feature** at a time.
4. Test manually and, where practical, add automated tests.
5. Check off the task **only after it works**.
6. Update the daily development log at the bottom.
7. Commit the working changes to Git.
8. Update **Next task** before ending the day.

**Daily template:**

```md
### YYYY-MM-DD

- Worked on:
- Files created/changed:
- What works:
- Bugs/errors:
- What I learned:
- Next task:
- Git commit:
```

## Progress tracker

- [ ] Phase 1 — Project setup and UI foundation
- [ ] Phase 2 — Backend and database
- [ ] Phase 3 — Authentication and permissions
- [ ] Phase 4 — Dancer, instructor, manager, and admin dashboards
- [ ] Phase 5 — Classes, events, and schedules
- [ ] Phase 6 — Bookings, tickets, and attendance
- [ ] Phase 7 — Payments and memberships
- [ ] Phase 8 — Email and SMS notifications
- [ ] Phase 9 — Rentals, reporting, and admin tools
- [ ] Phase 10 — Testing, security, deployment, and website integration

---

## Phase 1 — Project setup and UI foundation

### 1) Create project and React app

From a terminal in the directory where you keep projects:

```sh
mkdir freedom-dance-management
cd freedom-dance-management
npm create vite@latest client -- --template react
cd client
npm install
npm run dev
```

- [ ] Vite app runs locally (use the URL shown in the terminal; usually `http://localhost:5173`).
- [ ] Replace Vite starter content with a simple Freedom Dance Studio landing page.
- [ ] Update page title and favicon.
- [ ] Copy this `README.md` to the project root.

### 2) Install frontend dependencies

```sh
cd client
npm install react-router-dom @reduxjs/toolkit react-redux axios react-toastify lucide-react
```

Install and configure Tailwind CSS using the **current Tailwind + Vite documentation**, then add shadcn/ui using its current Vite guide. Avoid copying old Tailwind configuration from a different major version.

- [ ] Router installed.
- [ ] Redux Toolkit installed.
- [ ] Axios and toast notifications installed.
- [ ] Tailwind works.
- [ ] shadcn/ui configured.

### 3) Create initial frontend structure

```text
client/
  src/
    app/
      store.js
    assets/
    components/
      common/
      layout/
    features/
      auth/
      classes/
      events/
      bookings/
      payments/
      notifications/
    layouts/
      PublicLayout.jsx
      DashboardLayout.jsx
    pages/
      public/
      auth/
      dancer/
      instructor/
      manager/
      admin/
    services/
      api.js
    App.jsx
    main.jsx
```

- [ ] Create folders only when needed; avoid building empty files for every feature at once.
- [ ] Create reusable `Navbar`, `Sidebar`, `Logo`, `Loading`, and form components.
- [ ] Build responsive desktop/mobile navigation.

### 4) Configure Redux Toolkit

`client/src/app/store.js`:

```js
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {}, // Add feature reducers as they are built
});
```

Wrap `<App />` with `<Provider store={store}>` in `main.jsx`.

- [ ] Provider works.
- [ ] Add `authSlice` later, once authentication state is designed.
- [ ] Use the modern `extraReducers: (builder) => { builder.addCase(...) }` syntax when creating async slices.

### 5) Create routes and layouts

Planned routes (refine while building):

```text
/                     Public app landing
/login                Sign in
/register             Create dancer account
/forgot-password      Request password reset
/classes              Public class listing
/events               Public events
/checkout             Guest/member checkout entry
/dashboard            Signed-in user's home (role-aware)
/dancer/bookings      Dancer's bookings
/dancer/membership    Dancer's membership
/instructor/classes   Assigned instructor classes
/instructor/attendance Attendance
/manager              Manager overview
/manager/bookings     Manage bookings
/manager/events       Manage events
/admin                Admin overview
/admin/staff          Staff roles and invitations
/profile              Personal profile
/*                    Not found
```

- [ ] Public routes render.
- [ ] Dashboard layout renders.
- [ ] Not-found page works.
- [ ] Navigation works without refresh loops.
- [ ] No `dispatch(action())` is called directly during render; dispatch inside handlers/effects as appropriate.

---

## Phase 2 — Backend and database

### 6) Initialize Express API

From the project root:

```sh
mkdir server
cd server
npm init -y
npm install express cors helmet cookie-parser dotenv zod express-rate-limit
npm install -D nodemon
```

Configure `package.json` with `"type": "module"`, and scripts such as `"dev": "nodemon src/index.js"` and `"start": "node src/index.js"`.

Example `server/src/index.js`:

```js
import "dotenv/config";
import express from "express";
import helmet from "helmet";

const app = express();
app.use(helmet());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Freedom Dance Studio API" });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
```

- [ ] `npm run dev` starts server.
- [ ] `GET /api/health` returns JSON.
- [ ] Configure CORS with an explicit allowed frontend origin when needed.
- [ ] Add centralized error handling and input validation.
- [ ] Create `.env.example`; never commit `.env` or API keys.

### 7) Set up PostgreSQL + Prisma

```sh
cd server
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma
npx prisma init
```

Follow the installed Prisma version's current configuration and driver adapter instructions. Do not assume older Prisma tutorials use the same initialization pattern.

**Initial database entities:**

| Entity               | Purpose                                   |
| -------------------- | ----------------------------------------- |
| User                 | Dancer/staff identity, contact info, role |
| Session              | Secure login sessions                     |
| Class                | Recurring class definition                |
| ClassSession         | Specific class occurrence/date/time       |
| Event                | Workshop, social, concert                 |
| Booking              | Class/event/private lesson reservation    |
| Attendance           | Check-in records                          |
| MembershipPlan       | Membership pricing and benefits           |
| Subscription         | Member's active/expired plan              |
| Payment              | Payment provider IDs and status           |
| Notification         | Email/SMS delivery and reminder tracking  |
| StudioRental         | Rental inquiries/reservations             |
| InstructorAssignment | Assigned teacher and class/session        |

- [ ] Set up database connection.
- [ ] Define first Prisma models: `User` and `Session`.
- [ ] Create and apply first migration.
- [ ] Confirm Prisma can query database.
- [ ] Add other models incrementally.

### 8) API structure

```text
server/
  prisma/
    schema.prisma
  src/
    controllers/
    middleware/
    routes/
    services/
    jobs/
    lib/
    index.js
  .env.example
  package.json
```

- [ ] Add consistent response/error patterns.
- [ ] Validate all incoming data with Zod or equivalent.
- [ ] Use database transactions for related writes.

---

## Phase 3 — Authentication and permissions

### 9) Registration and login

**Registration fields:** first name, last name, email, phone (optional until required for notifications), password, confirm password, optional notification consent.

- [ ] `POST /api/auth/register` — creates a `MEMBER` only.
- [ ] `POST /api/auth/login`.
- [ ] `POST /api/auth/logout`.
- [ ] `GET /api/auth/me`.
- [ ] Forgot/reset password using single-use, expiring tokens.
- [ ] Verify email; optionally verify phone before SMS.
- [ ] Secure password hashing (Argon2id or a suitable maintained equivalent).
- [ ] Secure, HttpOnly, SameSite cookies and appropriate CSRF protection.
- [ ] Rate-limit authentication endpoints.
- [ ] No password or authentication token stored in browser localStorage.
- [ ] Handle session expiration gracefully.

**Roles:** `MEMBER`, `INSTRUCTOR`, `MANAGER`, `ADMIN`. A guest checkout is not a privileged role. A manager/instructor may also have dancer capabilities if permitted by policy.

### 10) Protected routes and role permissions

- [ ] Frontend redirects unauthorized visitors.
- [ ] Backend independently verifies sessions and permissions for **every protected request**.
- [ ] Instructors only see rosters for their assigned classes.
- [ ] Managers only see authorized operational/financial information.
- [ ] Admin can invite/promote/revoke staff roles.
- [ ] Test cross-user access attempts (user A cannot see user B's bookings).

---

## Phase 4 — Dashboards

### 11) Dancer dashboard

- [ ] Welcome/profile card.
- [ ] Upcoming bookings and events.
- [ ] Current membership and remaining benefits.
- [ ] Tickets/receipts/payment history.
- [ ] Cancel/reschedule according to studio rules.
- [ ] Email/SMS preferences and opt-out controls.

### 12) Instructor dashboard

- [ ] Assigned teaching calendar.
- [ ] Student rosters with limited contact visibility.
- [ ] Attendance/check-in interface.
- [ ] Class announcements where authorized.
- [ ] Personal profile and availability.

### 13) Manager dashboard

- [ ] Booking overview.
- [ ] Manage classes, sessions, events, and instructors.
- [ ] View memberships and payment statuses.
- [ ] Manage rental requests.
- [ ] Send approved operational announcements.

### 14) Admin dashboard

- [ ] Staff invites and role permissions.
- [ ] Studio settings and pricing.
- [ ] Audit log for sensitive actions.
- [ ] Financial reporting and payment reconciliation.

---

## Phase 5 — Classes, events, and schedules

### 15) Class management

- [ ] Create/update/archive classes.
- [ ] Configure weekday, start/end time, time zone (`America/Los_Angeles` for Las Vegas), instructor, room, capacity, and price.
- [ ] Generate dated sessions from recurring schedules.
- [ ] Handle cancellations, exceptions, and schedule changes.
- [ ] Public class calendar and filters by style/level.

### 16) Events

- [ ] Create workshop, social, concert, or intensive event.
- [ ] Add title, description, image, instructor/artists, location, date/time, capacity.
- [ ] Add ticket tiers, early-bird deadlines, and discounts.
- [ ] Publish/unpublish events.
- [ ] Show upcoming events on each dashboard.

---

## Phase 6 — Bookings, tickets, and attendance

### 17) Booking flow

```text
Browse class/event
  -> Choose date and ticket/plan
  -> Login / Register / Continue as guest
  -> Check availability and price on server
  -> Create pending booking
  -> Pay if required
  -> Confirm booking after verified payment
  -> Send confirmation
  -> Show booking in dashboard or guest email
```

- [ ] Prevent overbooking under simultaneous requests.
- [ ] Support member entitlements and free classes.
- [ ] Guest booking by email, with secure lookup/cancellation links.
- [ ] Unique booking reference.
- [ ] Booking cancellation/refund rules.
- [ ] Attendance check-in (manual first, QR later).
- [ ] Private lesson availability and scheduling.

---

## Phase 7 — Payments and memberships

### 18) Stripe integration

- [ ] Create Stripe test account and use test keys.
- [ ] Server creates Checkout sessions using server-calculated prices.
- [ ] Never accept client-submitted amounts as authoritative.
- [ ] Verify Stripe webhook signatures.
- [ ] Process payment/subscription events idempotently.
- [ ] Mark bookings paid only after trusted confirmation.
- [ ] Record Stripe IDs, payment statuses, refunds, and receipts.
- [ ] Test failed payments, cancellations, and duplicate webhooks.
- [ ] Switch to live keys only after end-to-end testing.

### 19) Membership plans

- [ ] Admin can create/edit membership plans and prices.
- [ ] Monthly subscription enrollment and renewal.
- [ ] Benefits/usage limits (unlimited classes or class credits).
- [ ] Proration, cancellation, expiration, and failed-payment handling.
- [ ] Dancer sees active plan and renewal date.

---

## Phase 8 — Email and SMS reminders

### 20) Email with Resend

- [ ] Verify sending domain and configure provider credentials.
- [ ] Booking confirmation.
- [ ] Receipt/payment status.
- [ ] Reminder 24 hours before class.
- [ ] Class cancellation/update notification.
- [ ] Membership renewal reminder.

### 21) SMS with Twilio

- [ ] Collect phone number and appropriate consent.
- [ ] Separate transactional and marketing preferences.
- [ ] Support opt-out and applicable messaging registration requirements.
- [ ] Reminder 2 hours before class (configurable).
- [ ] Do not text users who opted out.
- [ ] Record message delivery/failure statuses.

### 22) Reliable scheduling

- [ ] Use persistent scheduled jobs/queue, not frontend timers.
- [ ] Store notification due time and delivery state.
- [ ] Retry temporary failures without sending duplicates.
- [ ] Respect Las Vegas local time and daylight saving changes.
- [ ] Avoid reminders for canceled bookings.
- [ ] Test email/SMS using test recipients before real users.

**Example confirmation:**

> Freedom Dance Studio: Your Beginner Salsa booking for Tuesday at 6:00 PM is confirmed. Check your email for details.

---

## Phase 9 — Rentals, reports, and admin tools

### 23) Studio rentals

- [ ] Public rental inquiry form.
- [ ] Availability calendar.
- [ ] Manager approval/rejection.
- [ ] Deposit and balance tracking.
- [ ] Rental confirmation and reminders.

### 24) Reporting

- [ ] Total active members.
- [ ] Bookings by class/event.
- [ ] Attendance and no-show rate.
- [ ] Revenue and refunds by period.
- [ ] Membership retention and renewals.
- [ ] Instructor/class utilization.
- [ ] Export authorized reports.

---

## Phase 10 — Testing, deployment, and integration

### 25) Testing checklist

- [ ] Unit tests for pricing, entitlements, and permissions.
- [ ] API integration tests for authentication, booking, and payments.
- [ ] End-to-end tests: guest checkout, member checkout, instructor attendance, admin event creation.
- [ ] Test mobile layout and accessibility.
- [ ] Test expired sessions, invalid inputs, refunds, and double bookings.
- [ ] Backups, restore test, logging, and error monitoring.
- [ ] Privacy policy, terms, refund policy, and notification consent reviewed.

### 26) Deploy separately

- [ ] Deploy frontend and backend.
- [ ] Set production environment variables securely.
- [ ] Configure HTTPS, allowed origins, cookies, and database access.
- [ ] Run database migrations safely.
- [ ] Verify production webhooks and email/SMS sending.
- [ ] Add uptime/error monitoring.

### 27) Connect to existing website

**Target:** Keep the current marketing website unchanged while adding links to the new application.

- [ ] Configure `app.vegasfreedomdancestudio.com` (or selected URL).
- [ ] Add `Login`, `Register`, `My Dashboard`, and `Book Now` links to existing website.
- [ ] Link class/event cards to the correct app booking page.
- [ ] Test navigation between the two sites on desktop/mobile.
- [ ] Decide whether to migrate any existing booking records, and validate migration before switching traffic.
- [ ] Launch gradually and monitor errors.

---

## Planned API endpoints (design draft)

```text
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/classes
GET    /api/classes/:id/sessions
GET    /api/events
GET    /api/events/:id
POST   /api/bookings
GET    /api/bookings/mine
PATCH  /api/bookings/:id/cancel
POST   /api/checkout/session
POST   /api/webhooks/stripe
GET    /api/memberships/mine
GET    /api/instructor/classes
POST   /api/instructor/attendance
GET    /api/manager/bookings
POST   /api/manager/events
PATCH  /api/manager/events/:id
POST   /api/admin/staff/invitations
```

These are proposed routes, **not implemented endpoints**. Define exact validation, authorization, response shapes, and ownership rules as each endpoint is built.

## Git commands

From the project root, after initializing the repository:

```sh
git init
git status
git add .
git commit -m "chore: initialize Freedom Dance Studio management app"
```

For subsequent changes:

```sh
git status
git add .
git commit -m "feat: describe completed feature"
```

Create `.gitignore` before the first commit:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
```

Never commit passwords, API secrets, payment keys, private customer records, or production database dumps.

## Troubleshooting notes

| Problem                                      | What to check                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| Vite doesn't start                           | Node version, install logs, package scripts, port conflicts             |
| Route blank                                  | Router configuration, exports, browser console                          |
| Infinite React rerenders                     | Calling `dispatch(...)` or a state setter while rendering               |
| Redux async reducer error                    | Use `extraReducers` builder callback syntax                             |
| API 401                                      | Session cookie, login state, allowed origins, credentials               |
| API 403                                      | User role and resource-level permissions                                |
| Prisma connection error                      | Database URL, server availability, adapter/config for installed version |
| Stripe checkout succeeds but booking pending | Webhook delivery, signature verification, event processing logs         |
| Reminder not sent                            | Consent, scheduler, time zone, provider response, opt-out status        |

## Daily development log

### 2026-11-16 — Project planning

- **Worked on:** Defined goals, account types, feature phases, and separate-app integration strategy.
- **Files created:** `README.md` project roadmap.
- **What works:** Planning documentation only; application not yet built.
- **What I learned:** Separate frontend/backend development allows testing without changing the existing website.
- **Next task:** Phase 1, Step 1 — Create Vite React app.
- **Git commit:** Not yet created.

### YYYY-MM-DD

- **Worked on:**
- **Files created/changed:**
- **What works:**
- **Bugs/errors:**
- **What I learned:**
- **Next task:**
- **Git commit:**

---

## Definition of done

A task is finished only when it works, its expected errors are handled, its permissions are checked (if applicable), and the README checklist/log are updated. Do not mark a phase complete merely because the UI exists.

**Project motto:** Build one feature. Test it. Understand it. Commit it. Move to the next.
