import React, { useState, useEffect } from 'react'
import { User, Mail, Lock, Check, Calendar, Award, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
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
  const [internshipInfo, setInternshipInfo] = useState({
    joining_date: '',
    end_date: '',
    is_certified: false,
    internship_status: 'incomplete'
  })

  // Password change
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, joining_date, end_date, is_certified, internship_status')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setFullName(data?.full_name || '')
        setInternshipInfo({
          joining_date: data?.joining_date || '',
          end_date: data?.end_date || '',
          is_certified: data?.is_certified ?? false,
          internship_status: data?.internship_status || 'incomplete'
        })
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

        {role === 'intern' && (
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-8 animate-fade-in">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-1.5">
                <Calendar size={12} /> Internship Period
              </p>
              <p className="text-sm font-bold text-gray-900">
                {internshipInfo.joining_date ? format(parseISO(internshipInfo.joining_date), 'MMM d, yy') : 'Not set'} 
                <span className="mx-2 text-gray-300">→</span>
                {internshipInfo.end_date ? format(parseISO(internshipInfo.end_date), 'MMM d, yy') : 'Present'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-1.5">
                <Award size={12} /> Performance Status
              </p>
              <span className={`text-[10px] font-black uppercase py-0.5 px-2 rounded-full ring-1 ring-inset ${
                internshipInfo.internship_status === 'completed' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                internshipInfo.internship_status === 'high performer' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                internshipInfo.internship_status === 'top performer' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                'bg-gray-100 text-gray-600 ring-gray-400/20'
              }`}>
                {internshipInfo.internship_status}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Certification
              </p>
              {internshipInfo.is_certified ? (
                <div className="flex items-center gap-1.5 text-blue-600">
                   <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                     <Check size={12} strokeWidth={4} />
                   </div>
                   <span className="text-xs font-black uppercase tracking-wider">Certified</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-400">Review pending</span>
              )}
            </div>
          </div>
        )}

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
