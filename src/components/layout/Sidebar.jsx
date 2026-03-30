import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, PencilLine, FileText, Briefcase, User, LogOut, LayoutDashboard, Users, FileSpreadsheet, Download, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Logo from '../ui/Logo'

export default function Sidebar() {
  const { role, signOut, user } = useAuth()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false) // Mobile 

  const internLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Log Today', path: '/log', icon: PencilLine },
    { name: 'My Logs', path: '/my-logs', icon: FileText },
    { name: 'My Projects', path: '/my-projects', icon: Briefcase },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Interns', path: '/admin/interns', icon: Users },
    { name: 'Projects', path: '/admin/projects', icon: Briefcase },
    { name: 'Assign Interns', path: '/admin/assign', icon: FileSpreadsheet },
    { name: 'Export', path: '/admin/export', icon: Download },
    { name: 'Profile', path: '/admin/profile', icon: User },
  ]

  const links = role === 'admin' ? adminLinks : internLinks

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Successfully logged out")
    } catch (error) {
      toast.error('Logout failed.')
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return name.substring(0, 2).toUpperCase()
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U'
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 glass border-b border-gray-100 z-40 relative">
        <Logo size="sm" />
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 md:relative w-64 glass border-r border-white/40 flex flex-col justify-between p-4 z-40 min-h-screen`}>
        <div>
          <div className="mb-8 px-4 hidden md:block">
            <Logo size="lg" />
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-8 px-4">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/50 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
              {getInitials(user?.user_metadata?.full_name, user?.email)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              {role === 'admin' && (
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">Admin</span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  )
}
