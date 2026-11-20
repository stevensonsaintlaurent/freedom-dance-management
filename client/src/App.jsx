import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";

// ======================================================
// LAYOUTS
// ======================================================

import PublicLayouts from "./layouts/PublicLayouts";
import DashboardLayout from "./layouts/DashboardLayout";

// ======================================================
// ROUTE PROTECTION
// ======================================================

import ProtectedRoute from "./components/ProtectedRoute";

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

import Page from "./components/Page";
import CreateWeeklyClass from "./components/weeklyClasses/CreateWeeklyClass";

// ======================================================
// PUBLIC PAGES
// ======================================================

import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import Schedule from "./pages/public/Schedule";
import BookClass from "./pages/public/BookClass";
import BookingSuccess from "./pages/public/BookingSuccess";

// ======================================================
// SHARED PAGES
// ======================================================

import Unauthorized from "./pages/shared/Unauthorized";
import Profile from "./pages/shared/Profile";

// ======================================================
// DASHBOARDS AND MANAGEMENT
// ======================================================

import DancerDashboard from "./pages/dancer/DancerDashboard";
import WeeklyBookings from "./pages/dashboard/WeeklyBookings";

import StaffManagement from "./pages/manager/StaffManagement";
import CreateDanceClass from "./pages/manager/CreateDanceClass";
import ManageClasses from "./pages/manager/ManageClasses";
import ManageWeeklyClasses from "./pages/manager/ManageWeeklyClasses";

// ======================================================
// PAGE CONTENT
// ======================================================

const pages = {
  // ----------------------------------------------------
  // PUBLIC PAGES
  // ----------------------------------------------------

  landing: [
    "Welcome to Freedom Dance Studio",
    "Your place to learn, connect, and dance.",
    ["Dance Classes", "Upcoming Events", "Memberships"],
  ],

  classes: [
    "Explore Dance Classes",
    "Find Salsa, Bachata, Kizomba, Konpa, and more.",
    ["Browse Schedule", "Class Details", "Reserve a Spot"],
  ],

  independent: [
    "Independent Instructor Classes",
    "Discover classes hosted by independent instructors at Freedom Dance Studio.",
    ["Explore Instructors", "Class Schedule", "Contact Information"],
  ],

  schedule: [
    "Class Schedule & Booking",
    "Explore our weekly dance classes and choose the class you'd like to attend.",
    ["Weekly Schedule", "Choose a Class", "Reserve Your Spot"],
  ],

  rental: [
    "Rent Freedom Dance Studio",
    "A flexible space for dance classes, rehearsals, workshops, and private events.",
    ["Studio Information", "Rental Rates", "Request a Reservation"],
  ],

  events: [
    "Upcoming Events",
    "Workshops, socials, and special dance experiences.",
    ["Event Calendar", "Workshop Tickets", "Special Events"],
  ],

  checkout: [
    "Book and Pay Online",
    "Guest and member checkout will be connected to Stripe.",
    ["Select Booking", "Review Order", "Secure Payment"],
  ],

  // ----------------------------------------------------
  // SHARED DASHBOARD PAGES
  // ----------------------------------------------------

  dashboard: [
    "Your Dashboard",
    "Your personal overview of studio activities.",
    ["Upcoming Classes", "Recent Bookings", "Announcements"],
  ],

  bookings: [
    "My Bookings",
    "See upcoming reservations and booking history.",
    ["Upcoming Bookings", "Past Classes", "Booking Details"],
  ],

  membership: [
    "My Membership",
    "Track your membership, benefits, and renewal date.",
    ["Current Plan", "Benefits", "Renewal"],
  ],

  // ----------------------------------------------------
  // INSTRUCTOR PAGES
  // ----------------------------------------------------

  instructorClasses: [
    "My Classes",
    "See your assigned classes and student rosters.",
    ["Teaching Schedule", "Assigned Classes", "Student Rosters"],
  ],

  attendance: [
    "Attendance",
    "Track class check-ins and participation.",
    ["Class Roster", "Check In", "Attendance History"],
  ],

  // ----------------------------------------------------
  // MANAGER PAGES
  // ----------------------------------------------------

  manager: [
    "Manager Overview",
    "Monitor daily operations at the studio.",
    ["Today's Classes", "Bookings", "Studio Activity"],
  ],

  manageBookings: [
    "Manage Bookings",
    "Review and manage reservations.",
    ["All Bookings", "Booking Status", "Guest Bookings"],
  ],

  manageEvents: [
    "Manage Events",
    "Create and manage studio events.",
    ["Upcoming Events", "Ticket Sales", "Create Event"],
  ],

  // ----------------------------------------------------
  // ADMIN PAGES
  // ----------------------------------------------------

  admin: [
    "Admin Overview",
    "Manage the entire platform.",
    ["Staff Permissions", "System Activity", "Studio Settings"],
  ],

  // ----------------------------------------------------
  // ERROR PAGE
  // ----------------------------------------------------

  notFound: [
    "404 — Page Not Found",
    "The page you requested does not exist.",
    [],
  ],
};

// ======================================================
// SCROLL TO TOP
// ======================================================

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// ======================================================
// REUSABLE STATIC PAGE
// ======================================================

function StaticPage({ name, links = [] }) {
  const page = pages[name];

  if (!page) {
    return (
      <Page
        title="Page Not Found"
        description="The requested page could not be loaded."
        items={[]}
        links={[["Back to Home", "/"]]}
      />
    );
  }

  const [title, description, items] = page;

  return (
    <Page title={title} description={description} items={items} links={links} />
  );
}

// ======================================================
// ROLE-BASED DASHBOARD
// ======================================================

function RoleDashboard() {
  const { user } = useAuth();

  const role = String(user?.role || "").toLowerCase();

  if (role === "dancer") {
    return <DancerDashboard />;
  }

  const dashboardByRole = {
    instructor: "instructorClasses",
    manager: "manager",
    admin: "admin",
  };

  const pageName = dashboardByRole[role] || "dashboard";

  return <StaticPage name={pageName} />;
}

// ======================================================
// APPLICATION ROUTES
// ======================================================

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ============================================
            PUBLIC ROUTES
        ============================================ */}

        <Route element={<PublicLayouts />}>
          {/* HOME */}

          <Route
            path="/"
            element={
              <StaticPage
                name="landing"
                links={[
                  ["Explore Classes", "/classes"],
                  ["View Schedule", "/schedule"],
                  ["Upcoming Events", "/events"],
                ]}
              />
            }
          />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/schedule/book" element={<BookClass />} />
          <Route path="/booking-success" element={<BookingSuccess />} />

          <Route
            path="/manager/bookings"
            element={<WeeklyBookings role="MANAGER" />}
          />

          <Route
            path="/instructor/bookings"
            element={<WeeklyBookings role="INSTRUCTOR" />}
          />

          <Route
            path="/admin/bookings"
            element={<WeeklyBookings role="ADMIN" />}
          />

          {/* FREEDOM CLASSES */}

          <Route
            path="/classes"
            element={
              <StaticPage
                name="classes"
                links={[
                  ["Book a Class", "/schedule"],
                  ["Independent Classes", "/independent"],
                  ["View Events", "/events"],
                ]}
              />
            }
          />

          {/* INDEPENDENT INSTRUCTORS */}

          <Route
            path="/independent"
            element={
              <StaticPage
                name="independent"
                links={[
                  ["Freedom Classes", "/classes"],
                  ["View Schedule", "/schedule"],
                ]}
              />
            }
          />

          {/* PUBLIC CLASS SCHEDULE */}

          <Route
            path="/schedule"
            element={
              <StaticPage
                name="schedule"
                links={[
                  ["Explore Classes", "/classes"],
                  ["Studio Rental", "/rental"],
                ]}
              />
            }
          />

          {/* STUDIO RENTAL */}

          <Route
            path="/rental"
            element={
              <StaticPage
                name="rental"
                links={[
                  ["View Schedule", "/schedule"],
                  ["Explore Classes", "/classes"],
                ]}
              />
            }
          />

          {/* EVENTS */}

          <Route
            path="/events"
            element={
              <StaticPage
                name="events"
                links={[
                  ["View Schedule", "/schedule"],
                  ["Book an Event", "/checkout"],
                ]}
              />
            }
          />

          {/* CHECKOUT */}

          <Route path="/checkout" element={<StaticPage name="checkout" />} />

          {/* AUTHENTICATION */}

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ACCESS DENIED */}

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* PAGE NOT FOUND */}

          <Route
            path="*"
            element={
              <StaticPage
                name="notFound"
                links={[
                  ["Back to Home", "/"],
                  ["Dashboard", "/dashboard"],
                ]}
              />
            }
          />
        </Route>

        {/* ============================================
            AUTHENTICATED ROUTES
        ============================================ */}

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* SHARED DASHBOARD */}

            <Route path="/dashboard" element={<RoleDashboard />} />

            {/* PROFILE */}

            <Route path="/profile" element={<Profile />} />

            {/* ========================================
                DANCER ROUTES
            ======================================== */}

            <Route element={<ProtectedRoute roles={["dancer"]} />}>
              <Route
                path="/dancer/bookings"
                element={<StaticPage name="bookings" />}
              />

              <Route
                path="/dancer/membership"
                element={<StaticPage name="membership" />}
              />
            </Route>

            {/* ========================================
                INSTRUCTOR ROUTES
            ======================================== */}

            <Route element={<ProtectedRoute roles={["instructor"]} />}>
              <Route
                path="/instructor/classes"
                element={<StaticPage name="instructorClasses" />}
              />

              <Route
                path="/instructor/attendance"
                element={<StaticPage name="attendance" />}
              />
            </Route>

            {/* ========================================
                MANAGER + ADMIN ROUTES
            ======================================== */}

            <Route element={<ProtectedRoute roles={["manager", "admin"]} />}>
              {/* STAFF MANAGEMENT */}

              <Route path="/manager/staff" element={<StaffManagement />} />

              {/* MANAGE WEEKLY CLASSES */}

              <Route
                path="/manager/weekly-classes"
                element={<ManageWeeklyClasses />}
              />

              {/* CREATE WEEKLY CLASS */}

              <Route
                path="/manager/weekly-classes/new"
                element={<CreateWeeklyClass />}
              />

              {/* CREATE DANCE CLASS */}

              <Route
                path="/manager/classes/new"
                element={<CreateDanceClass />}
              />

              {/* MANAGE DANCE CLASSES */}

              <Route path="/manager/classes" element={<ManageClasses />} />

              {/* MANAGE BOOKINGS */}

              <Route
                path="/manager/bookings"
                element={<StaticPage name="manageBookings" />}
              />

              {/* MANAGE EVENTS */}

              <Route
                path="/manager/events"
                element={<StaticPage name="manageEvents" />}
              />
            </Route>

            {/* ========================================
                ADMIN ROUTES
            ======================================== */}

            <Route element={<ProtectedRoute roles={["admin"]} />}>
              {/* ADMIN DASHBOARD */}

              <Route path="/admin" element={<StaticPage name="admin" />} />

              {/* ADMIN STAFF MANAGEMENT */}

              <Route path="/admin/staff" element={<StaffManagement />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

// ======================================================
// MAIN APP
// ======================================================

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
