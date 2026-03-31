import React, { useState, useEffect } from 'react'
import { User, Mail, Lock, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Profile() {
  const { user, role } = useAuth()

  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setFullName(data?.full_name || '')
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update users table name
      const { error: dbError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (dbError) throw dbError

      // Update auth user data
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (authError) throw authError

      // Password update if provided
      if (password) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        const { error: pwdError } = await supabase.auth.updateUser({ password })
        if (pwdError) throw pwdError
        setPassword('')
        setConfirmPassword('')
      }

      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.split(' ')
      return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
    }
    return email ? email.substring(0, 2).toUpperCase() : 'U'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-8 animate-fade-in">
      <PageHeader title="My Profile" />

      <GlassCard className="p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-gray-100 pb-8">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shrink-0 border-4 border-white shadow-xl">
            {getInitials(fullName, user?.email)}
          </div>
          <div className="text-center sm:text-left pt-2">
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-2">{fullName || 'Add your name'}</h2>
            <p className="text-gray-500 font-medium">{user?.email}</p>
            {(() => {
              const roleMap = {
                admin:     { label: 'Admin',         emoji: '🔥', bg: 'bg-red-100 text-red-800 border-red-200' },
                dept_head: { label: 'Dept Head',     emoji: '🏢', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
                staff:     { label: 'Staff',         emoji: '👔', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
                intern:    { label: 'Intern',        emoji: '✨', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
              }
              const r = roleMap[role] || { label: role, emoji: '👤', bg: 'bg-gray-100 text-gray-700 border-gray-200' }
              return (
                <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${r.bg}`}>
                  <span>{r.emoji}</span> {r.label}
                </div>
              )
            })()}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="pl-10 w-full rounded-xl border border-gray-200 bg-gray-100 text-gray-500 p-3 text-sm cursor-not-allowed outline-none"
                title="Email cannot be changed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-4">Update Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="Leave blank to keep current"
                    minLength={6}
                  />
                </div>
              </div>
              
              {password && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 hover:shadow-lg focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? 'Saving...' : <><Check className="w-5 h-5"/> Save Profile</>}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
