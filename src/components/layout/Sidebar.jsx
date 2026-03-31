import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, PencilLine, FileText, Briefcase, User, LogOut,
  LayoutDashboard, Users, FileSpreadsheet, Download, Menu, X, Bell
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Logo from '../ui/Logo'

export default function Sidebar() {
  const { role, signOut, user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const isAdmin = ['admin', 'staff', 'dept_head'].includes(role)
  const canApprove = ['admin', 'dept_head'].includes(role)  // staff cannot approve

  // Only admin + dept_head see pending count
  useEffect(() => {
    if (!canApprove) return
    const fetchPending = async () => {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingCount(count || 0)
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000)
    return () => clearInterval(interval)
  }, [canApprove])

  const internLinks = [
    { name: 'Dashboard',   path: '/dashboard',    icon: Home },
    { name: 'Log Today',   path: '/log',          icon: PencilLine },
    { name: 'My Logs',     path: '/my-logs',      icon: FileText },
    { name: 'My Projects', path: '/my-projects',  icon: Briefcase },
    { name: 'Profile',     path: '/profile',      icon: User },
  ]

  // Build admin nav — Requests only for admin + dept_head
  const adminLinks = [
    { name: 'Overview',  path: '/admin',           icon: LayoutDashboard },
    { name: 'Interns',   path: '/admin/interns',   icon: Users },
    { name: 'Projects',  path: '/admin/projects',  icon: Briefcase },
    { name: 'Assign',    path: '/admin/assign',    icon: FileSpreadsheet },
    { name: 'Export',    path: '/admin/export',    icon: Download },
    ...(canApprove ? [{ name: 'Requests', path: '/admin/requests', icon: Bell, badge: pendingCount }] : []),
    { name: 'Profile',   path: '/admin/profile',   icon: User },
  ]

  const links = isAdmin ? adminLinks : internLinks

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out')
    } catch {
      toast.error('Logout failed.')
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ')
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U'
  }

  const close = () => setIsOpen(false)

  // Role label + color per role
  const roleConfig = {
    admin:     { label: 'Admin',          color: 'text-red-600' },
    dept_head: { label: 'Dept Head',      color: 'text-purple-600' },
    staff:     { label: 'Staff',          color: 'text-blue-600' },
    intern:    { label: 'Intern',         color: 'text-indigo-600' },
  }
  const { label: roleLabel, color: roleColor } = roleConfig[role] || { label: role, color: 'text-gray-500' }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
        <Logo size="lg" />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ name, path, icon: Icon, badge }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={name}
              to={path}
              onClick={close}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} size={18} />
              <span className="flex-1 truncate">{name}</span>
              {/* Pending badge */}
              {badge > 0 && (
                <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
            {getInitials(user?.user_metadata?.full_name, user?.email)}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </p>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>{roleLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile top bar (fixed) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          {/* Pending badge on mobile top bar */}
          {isAdmin && pendingCount > 0 && (
            <Link to="/admin/requests" className="relative p-2">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={close}>
          <div className="absolute inset-0 bg-gray-900/40" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl"
            style={{ animation: 'slideInLeft 0.25s ease-out both' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 flex-shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  )
}
