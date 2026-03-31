import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Sidebar from './components/layout/Sidebar'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PendingApproval from './pages/PendingApproval'

// Intern Pages
import Dashboard from './pages/intern/Dashboard'
import LogToday from './pages/intern/LogToday'
import MyLogs from './pages/intern/MyLogs'
import MyProjects from './pages/intern/MyProjects'
import InternProfile from './pages/intern/Profile'

// Admin Pages
import AdminOverview from './pages/admin/Overview'
import AdminInterns from './pages/admin/Interns'
import AdminProjects from './pages/admin/Projects'
import AssignInterns from './pages/admin/Assign'
import ExportLogs from './pages/admin/Export'
import AdminProfile from './pages/admin/Profile'
import AdminRequests from './pages/admin/Requests'

// App shell: sidebar + scrollable main
function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/*
          pt-14 = mobile fixed navbar height (h-14 = 56px).
          We use explicit pt instead of p shorthand to avoid
          the shorthand overriding pt-14 based on CSS output order.
        */}
        <div className="pt-14 md:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Auth / landing layout — no sidebar
function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/"        element={<Landing />} />
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/pending" element={<PendingApproval />} />
          </Route>

          {/* Intern Routes */}
          <Route element={<ProtectedRoute allowedRoles={['intern']} />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/log"         element={<LogToday />} />
              <Route path="/my-logs"     element={<MyLogs />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/profile"     element={<InternProfile />} />
            </Route>
          </Route>

          {/* Admin + Staff + Dept Head Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'dept_head']} />}>
            <Route element={<Layout />}>
              <Route path="/admin"              element={<AdminOverview />} />
              <Route path="/admin/interns"      element={<AdminInterns />} />
              <Route path="/admin/projects"     element={<AdminProjects />} />
              <Route path="/admin/assign"       element={<AssignInterns />} />
              <Route path="/admin/export"       element={<ExportLogs />} />
              <Route path="/admin/profile"      element={<AdminProfile />} />
            </Route>
          </Route>

          {/* Requests — admin + dept_head ONLY (staff excluded) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'dept_head']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/requests" element={<AdminRequests />} />
            </Route>
          </Route>
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              border: '1px solid #e5e7eb',
              color: '#111827',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: '14px',
              maxWidth: '90vw',
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}
