# Freedom Dance Studio — Management Platform

> **Project status:** In development  
> **Started:** November 16, 2026  
> **Developer:** Stevenson  
> **Current phase:** Phase 3 — Authentication and permissions  
> **Next task:** Verify registration creates a new `MEMBER` in PostgreSQL.

A full-stack studio management application for dancers, instructors, managers, and administrators. Build and test this application separately from the existing [Freedom Dance Studio website](https://vegasfreedomdancestudio.com/), then consider connecting it at `app.vegasfreedomdancestudio.com`.

## Project in Action

- **Live app:** Not deployed yet
- **GitHub repository:** Add repository URL when available
- **Website:** https://vegasfreedomdancestudio.com/
- **Frontend development:** http://localhost:5173
- **Backend development:** http://localhost:5000

## 1) Project Goal

- **Guests:** Browse classes and events, book and pay without a permanent account.
- **Members:** Register, sign in, book classes and private lessons, buy tickets, and manage memberships.
- **Instructors:** View assigned classes, rosters, and attendance.
- **Managers:** Manage classes, bookings, instructors, events, rentals, and payments.
- **Admins:** Manage staff permissions, settings, and studio operations.

**Important:** Public registration creates `MEMBER` accounts only. `INSTRUCTOR`, `MANAGER`, and `ADMIN` permissions require authorized administrative action. Guest checkout is not a privileged login role.

## 2) Technology Stack

| Layer                         | Technology                                             |
| ----------------------------- | ------------------------------------------------------ |
| Frontend                      | React + Vite                                           |
| Navigation                    | React Router                                           |
| Styling                       | Tailwind CSS + shadcn/ui                               |
| HTTP                          | Axios                                                  |
| Frontend authentication state | React Context (`AuthContext`)                          |
| Optional feature state        | Redux Toolkit + React Redux (planned; add when useful) |
| Forms and validation          | React Hook Form + Zod                                  |
| Backend                       | Node.js + Express                                      |
| Database                      | PostgreSQL + Prisma                                    |
| Database driver               | `pg` + `@prisma/adapter-pg`                            |
| Authentication                | Secure HttpOnly cookie-based sessions                  |
| Payments (planned)            | Stripe                                                 |
| Email (planned)               | Resend                                                 |
| SMS (planned)                 | Twilio                                                 |

> This app does **not** use the Jobster tutorial's Create React App, styled-components, bearer tokens in localStorage, or Jobster API. The Jobster document is a _formatting and learning-style reference_, not the implementation for this project.

## 3) Daily Development Workflow

1. Read **Current phase** and **Next task** at the top of this README.
2. Work on **one small feature**.
3. Run the frontend and backend; test the feature.
4. Check errors in the browser console and server terminal.
5. Update the checklist **only when verified**.
6. Add a short development-log entry.
7. Commit working changes to Git.
8. Set the next task.

---

# Phase 1 — React Setup and UI Foundation

## 4) Create the React App — Completed

From the project root:

```sh
npm create vite@latest client -- --template react
cd client
npm install
npm run dev
```

- [x] React + Vite development environment runs.
- [x] App is accessible locally.
- [x] Initial public UI and navigation created.
- [ ] Verify final page title, favicon, and all responsive layouts.

## 5) Install Frontend Dependencies — Core Setup Completed

The project uses React Router, Axios, Tailwind CSS, shadcn/ui, React Hook Form, and Zod. Install dependencies based on the actual `client/package.json` rather than reinstalling packages blindly.

For a fresh project, common packages include:

```sh
npm install react-router-dom axios lucide-react react-hook-form zod @hookform/resolvers
```

Configure Tailwind CSS and shadcn/ui using their documentation for the versions installed in the project.

- [x] React Router used for navigation.
- [x] Axios configured for backend requests.
- [x] Tailwind CSS and shadcn/ui used in the interface.
- [x] Form validation approach established.
- [ ] Review accessibility and mobile responsiveness across every page.

## 6) Project Structure

The following shows **important known folders/files**, not a claim that every planned folder already exists:

```text
freedom-dance-management/
├── README.md
├── client/
│   └── src/
│       ├── api/
│       │   └── axios.js
│       ├── auth/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Navbar.jsx
│       ├── pages/
│       │   └── Register.jsx
│       ├── App.jsx
│       └── main.jsx
└── server/
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── lib/
        │   └── session.js
        └── index.js
```

Add folders for classes, bookings, memberships, events, and payments **when implementing those features**. Avoid empty placeholder files.

## 7) Routing and Protected Pages — Core Flow Tested

Key routes:

```text
/             Public landing
/login        Login
/register     Create dancer account
/dashboard    Protected dashboard
/profile      User profile (planned/verify)
/classes      Public classes (planned)
/events       Public events (planned)
/*            Not found
```

A protected route must wait until authentication finishes loading before redirecting:

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

> Adjust import paths to match the actual file location. Frontend route protection improves UX; the **backend must independently authorize every protected API request**.

- [x] Login and dashboard navigation tested.
- [x] Protected dashboard redirects after logout.
- [x] Refreshing an authenticated dashboard retains the session.
- [ ] Verify 404 page and all remaining planned routes.

---

# Phase 2 — Express, PostgreSQL, and Prisma

## 8) Express API — Core Setup Completed

```sh
cd server
npm run dev
```

The API runs at `http://localhost:5000` in development.

### Health Check

```http
GET http://localhost:5000/api/health
```

Expected: a successful JSON response.

- [x] Express development server runs.
- [x] Health endpoint tested.
- [x] Frontend connects to backend.
- [ ] Audit error handling, security headers, rate limits, and environment-variable setup.

## 9) PostgreSQL and Prisma — Initial Models Working

Current confirmed database models:

- `User`: first name, last name, email, phone, hashed password, role, status, timestamps.
- `Session`: session token hash, expiration, revocation, user association.

Roles:

```prisma
enum Role {
  MEMBER
  INSTRUCTOR
  MANAGER
  ADMIN
}
```

Prisma 7 uses the PostgreSQL driver adapter in this project. Follow the existing Prisma configuration when adding models or migrations.

Useful commands (from `server/`):

```sh
npx prisma validate
npx prisma migrate dev
npx prisma studio
```

**Caution:** Review migration changes before applying them, especially against shared or production databases.

- [x] PostgreSQL connection tested.
- [x] `User` and `Session` models implemented.
- [x] Prisma can query users and sessions.
- [ ] Add class, booking, event, and membership models as their features are built.

---

# Phase 3 — Authentication and Permissions (Current)

## 10) Axios — Cookies Between Frontend and Backend

**File:** `client/src/api/axios.js`

```js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export default api;
```

`withCredentials: true` allows the browser to send the session cookie to the API. Production origins and cookie settings must be configured separately.

## 11) Authentication API — Tested

| Method | Endpoint                    | Purpose         | Status                                       |
| ------ | --------------------------- | --------------- | -------------------------------------------- |
| `POST` | `/api/auth/register`        | Create member   | API tested; frontend flow needs verification |
| `POST` | `/api/auth/login`           | Sign in         | Tested                                       |
| `GET`  | `/api/auth/me`              | Restore session | Tested                                       |
| `POST` | `/api/auth/logout`          | Revoke session  | Tested                                       |
| `POST` | `/api/auth/forgot-password` | Request reset   | Planned                                      |
| `POST` | `/api/auth/reset-password`  | Complete reset  | Planned                                      |

The backend creates an HttpOnly session cookie after login. Do **not** store passwords or session tokens in browser localStorage.

## 12) AuthContext — Login, Refresh, and Logout Working

**File:** `client/src/auth/AuthContext.jsx`

Main responsibilities:

1. On app load, request `GET /auth/me`.
2. Keep the current user in React state.
3. Expose `signIn(email, password)`.
4. Expose `register(userData)`.
5. Expose `signOut()`.
6. Track `isLoading` while checking authentication.

The logout action should revoke the backend session **before** clearing local user state:

```js
const signOut = async () => {
  await api.post("/auth/logout");
  setUser(null);
};
```

- [x] Login works.
- [x] Login survives page refresh.
- [x] Logout revokes the session.
- [x] Logout redirects to `/login`.
- [x] Dashboard access is blocked after logout.

## 13) Navbar Dropdown — Fixed

**Problem:** The avatar menu initially crashed because the Base UI menu label was outside its required menu group.

**Fix:** Wrap menu labels/items in the appropriate `DropdownMenuGroup`.

**Problem:** Clicking **Sign Out** did nothing.

**Fix:** Use `onClick` instead of `onSelect` for the project's Base UI dropdown item:

```jsx
<DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
```

**Verified:** Clicking Sign Out redirects to login, removes the authenticated avatar, and blocks `/dashboard` until login.

## 14) Register a New Dancer — Next Task

**Goal:** Confirm the React registration form creates a second user in PostgreSQL.

### Test steps

1. Start both development servers.
2. Visit `http://localhost:5173/register`.
3. Register with a **new email** and a valid password.
4. Confirm the UI shows success or an appropriate next step.
5. Open Prisma Studio or query the database to confirm the user exists.
6. Verify the new account has role `MEMBER`.
7. Log in using the newly registered account.
8. Test invalid inputs and duplicate emails.

- [ ] React registration completes successfully.
- [ ] User appears in PostgreSQL.
- [ ] New user has role `MEMBER`.
- [ ] New user can log in.
- [ ] Duplicate email and invalid form inputs show helpful errors.

**Do not mark this section complete until all tests pass.**

## 15) Profile Management — After Registration

Planned fields:

- First name
- Last name
- Email
- Phone number

Planned behavior:

- Load the authenticated user's profile.
- Edit allowed fields.
- Validate inputs on client and server.
- Save changes to PostgreSQL.
- Update `AuthContext` after a successful response.
- Prevent users from editing another user's profile.

- [ ] Create or verify profile page.
- [ ] Implement protected profile-update API.
- [ ] Save and reload profile changes.
- [ ] Test unauthorized updates.

## 16) Authentication Security — Before Production

- [ ] Password reset with single-use expiring tokens.
- [ ] Email verification.
- [ ] Rate-limit login and registration.
- [ ] Review CSRF defenses for cookie-authenticated mutations.
- [ ] Test session expiration and revocation.
- [ ] Enforce role permissions on backend endpoints.
- [ ] Test that one user cannot read or change another user's data.
- [ ] Review cookie settings for production HTTPS and domains.

---

# Phase 4 — Role-Based Dashboards

## 17) Dancer Dashboard

- [ ] Welcome and profile summary.
- [ ] Upcoming bookings and events.
- [ ] Membership status and remaining class benefits.
- [ ] Tickets, receipts, and payment history.
- [ ] Cancel/reschedule bookings according to studio policy.

## 18) Instructor Dashboard

- [ ] Assigned class calendar.
- [ ] Student roster for assigned classes only.
- [ ] Attendance check-in.
- [ ] Instructor availability and announcements.

## 19) Manager Dashboard

- [ ] Students and instructors overview.
- [ ] Manage classes, events, and bookings.
- [ ] Review rental requests.
- [ ] View authorized payment and membership information.

## 20) Admin Dashboard

- [ ] Staff invitations and role changes.
- [ ] Studio settings and pricing.
- [ ] Audit log for sensitive changes.
- [ ] Financial reports and reconciliation.

---

# Phase 5 — Classes, Events, and Schedules

## 21) Class Management

- [ ] Add `Class` and `ClassSession` Prisma models.
- [ ] Create, edit, archive classes.
- [ ] Store weekday, start/end time, room, capacity, level, instructor, and price.
- [ ] Use `America/Los_Angeles` for studio scheduling.
- [ ] Generate dated sessions and handle cancellations.
- [ ] Display class durations clearly in the UI.

## 22) Event Management

- [ ] Add `Event` model.
- [ ] Create workshops, socials, concerts, and intensives.
- [ ] Support event images, artists, locations, capacity, and ticket tiers.
- [ ] Support early-bird deadlines and publish/unpublish state.

---

# Phase 6 — Bookings, Tickets, and Attendance

## 23) Booking Flow

```text
Browse class or event
  -> Choose date / session / ticket
  -> Sign in, register, or continue as guest
  -> Backend checks availability and price
  -> Create pending booking
  -> Pay if required
  -> Confirm after verified payment
  -> Send confirmation
  -> Show booking in dashboard or guest email
```

- [ ] Create `Booking` model and API.
- [ ] Prevent simultaneous overbooking.
- [ ] Support guest email bookings.
- [ ] Generate unique booking references.
- [ ] Support cancellation and refund policies.
- [ ] Add attendance check-in.
- [ ] Add private lesson scheduling.

---

# Phase 7 — Payments and Memberships

## 24) Stripe Payments

- [ ] Create Stripe test configuration.
- [ ] Calculate authoritative prices on the backend.
- [ ] Create checkout sessions.
- [ ] Verify webhook signatures.
- [ ] Process webhooks idempotently.
- [ ] Record payments, refunds, and receipts.
- [ ] Test successful, failed, and canceled payments.

## 25) Memberships

- [ ] Create `MembershipPlan` and `Subscription` models.
- [ ] Support monthly plans and class credits.
- [ ] Display renewal and expiration dates.
- [ ] Apply benefits to bookings.
- [ ] Handle cancellations and failed renewals.

---

# Phase 8 — Email and SMS

## 26) Email with Resend

- [ ] Verify domain and configure credentials.
- [ ] Send booking confirmations and receipts.
- [ ] Send class reminders and cancellation notices.
- [ ] Track failures and retries.

## 27) SMS with Twilio

- [ ] Collect appropriate SMS consent.
- [ ] Send configurable reminders.
- [ ] Honor opt-outs.
- [ ] Track delivery status.

Use persistent background jobs for scheduled messages; do not rely on browser timers.

---

# Phase 9 — Studio Rentals and Reporting

## 28) Studio Rentals

- [ ] Public rental inquiry form.
- [ ] Availability calendar.
- [ ] Manager approval workflow.
- [ ] Deposit and balance tracking.
- [ ] Rental confirmations and reminders.

## 29) Reporting

- [ ] Active members.
- [ ] Bookings and attendance.
- [ ] Revenue and refunds.
- [ ] Membership retention.
- [ ] Class and instructor utilization.
- [ ] Authorized exports.

---

# Phase 10 — Testing, Deployment, and Website Integration

## 30) Testing

- [ ] Unit tests for pricing and permissions.
- [ ] API tests for auth, booking, and payments.
- [ ] End-to-end tests for guest/member booking.
- [ ] Test mobile and accessibility.
- [ ] Test session expiry, invalid inputs, and overbooking.
- [ ] Review privacy, terms, refund policy, backups, and logging.

## 31) Deployment

- [ ] Deploy frontend and API.
- [ ] Configure HTTPS, CORS, and production cookies.
- [ ] Apply database migrations safely.
- [ ] Verify production integrations.
- [ ] Configure monitoring and backups.

## 32) Connect Existing Studio Website

- [ ] Configure `app.vegasfreedomdancestudio.com` or chosen app URL.
- [ ] Add Login, Register, Dashboard, and Book Now links to marketing website.
- [ ] Connect class and event cards to the correct booking routes.
- [ ] Test desktop and mobile navigation between websites.
- [ ] Migrate records only after validation, if needed.

---

# API Reference

## Implemented / Tested Core Routes

```http
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

## Planned Routes (Not Yet Implemented)

```http
POST  /api/auth/forgot-password
POST  /api/auth/reset-password
GET   /api/classes
GET   /api/classes/:id/sessions
GET   /api/events
GET   /api/events/:id
POST  /api/bookings
GET   /api/bookings/mine
PATCH /api/bookings/:id/cancel
POST  /api/checkout/session
POST  /api/webhooks/stripe
GET   /api/memberships/mine
GET   /api/instructor/classes
POST  /api/instructor/attendance
GET   /api/manager/bookings
POST  /api/manager/events
PATCH /api/manager/events/:id
POST  /api/admin/staff/invitations
```

All protected endpoints require **backend** authorization, not just hidden frontend buttons.

---

# Troubleshooting Notes

| Issue                              | What to check                                    |
| ---------------------------------- | ------------------------------------------------ |
| Frontend not loading               | Vite terminal, port, browser console             |
| API request fails                  | Express terminal, Axios base URL, CORS           |
| Login works but refresh logs out   | `/auth/me`, cookies, `withCredentials`           |
| Protected page redirects too early | Wait for `isLoading` in `ProtectedRoute`         |
| Avatar menu crashes                | Base UI `DropdownMenuGroup` structure            |
| Logout click does nothing          | Use dropdown item's `onClick` handler            |
| 401 Unauthorized                   | Session expiration, cookie, login state          |
| 403 Forbidden                      | Role and resource permissions                    |
| Prisma connection fails            | Database URL, adapter, database availability     |
| Registration fails                 | Zod validation, duplicate email, server response |

# Git Workflow

From the project root:

```sh
git status
git add .
git commit -m "docs: update Freedom Dance Studio development guide"
```

Recommended `.gitignore` entries:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
```

Never commit passwords, secrets, private customer records, or database dumps.

---

# Development Log

## November 16, 2026 — Project Planning

- **Worked on:** Defined platform goals, roles, phases, and standalone deployment strategy.
- **Created:** Initial README roadmap.
- **Learned:** Separating the management app from the marketing website allows independent testing.

## November 18, 2026 — Authentication Progress

- **Worked on:** Reviewed the React/Express authentication flow and debugged the navbar logout action.
- **What works:** Login, session persistence on refresh, protected dashboard, avatar dropdown, logout, and redirect to login.
- **Bugs fixed:** Base UI dropdown menu-group error; logout item needed `onClick` instead of `onSelect`.
- **Still to verify:** End-to-end registration from the React form, database persistence, and a second account's login.
- **Next task:** Register a second test dancer and verify the `MEMBER` record in PostgreSQL.
- **Git commit:** Add actual commit hash after committing.

## Daily Log Template

```md
### YYYY-MM-DD

- **Worked on:**
- **Files created/changed:**
- **What works:**
- **Bugs/errors:**
- **What I learned:**
- **Next task:**
- **Git commit:**
```

---

# Definition of Done

A feature is complete only when:

1. It works in the browser and/or API.
2. Expected errors are handled.
3. Backend authorization is tested where relevant.
4. Database changes are verified when applicable.
5. README checklist and development log are updated.
6. Working code is committed.

**Project motto:** Build one feature. Test it. Understand it. Commit it. Move to the next.
