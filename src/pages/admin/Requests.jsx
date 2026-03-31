import React, { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, User, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/layout/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const ROLE_LABELS = {
  intern:    { label: 'Intern',           color: 'bg-blue-50 text-blue-700 border-blue-100',    icon: '🎓' },
  staff:     { label: 'Staff',            color: 'bg-purple-50 text-purple-700 border-purple-100', icon: '👔' },
  dept_head: { label: 'Department Head',  color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: '🏢' },
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState({}) // { [userId]: true }

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, requested_role, role, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleApprove = async (user) => {
    setActing(a => ({ ...a, [user.id]: true }))
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role:   user.requested_role,  // grant the requested role
          status: 'approved',
        })
        .eq('id', user.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Update blocked by RLS.')

      toast.success(`✅ ${user.full_name} approved as ${user.requested_role}`)
      setRequests(prev => prev.filter(r => r.id !== user.id))
    } catch (err) {
      toast.error('Failed to approve: ' + err.message)
    } finally {
      setActing(a => ({ ...a, [user.id]: false }))
    }
  }

  const handleReject = async (user) => {
    setActing(a => ({ ...a, [user.id]: 'reject' }))
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', user.id)
        .select('id')

      if (error) throw error
      if (!data || data.length === 0) throw new Error('Update blocked by RLS.')

      toast.success(`Rejected: ${user.full_name}`)
      setRequests(prev => prev.filter(r => r.id !== user.id))
    } catch (err) {
      toast.error('Failed to reject: ' + err.message)
    } finally {
      setActing(a => ({ ...a, [user.id]: false }))
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      <PageHeader title="Access Requests" description="Approve or reject new user role requests">
        <button
          type="button"
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </PageHeader>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <p className="font-bold text-gray-900 text-sm">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No pending role requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const roleInfo = ROLE_LABELS[req.requested_role] || { label: req.requested_role, color: 'bg-gray-50 text-gray-700 border-gray-100', icon: '👤' }
            const isActing = acting[req.id]

            return (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center flex-shrink-0">
                    {req.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{req.full_name}</p>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${roleInfo.color}`}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase border border-amber-100">
                        <Clock size={9} /> Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{req.email}</p>
                    {req.created_at && (
                      <p className="text-[10px] text-gray-300 mt-1">
                        Requested {format(parseISO(req.created_at), 'MMM d, yyyy · h:mm a')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => handleApprove(req)}
                    disabled={!!isActing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle size={15} />
                    {isActing && isActing !== 'reject' ? 'Approving...' : `Approve as ${roleInfo.label}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(req)}
                    disabled={!!isActing}
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <XCircle size={15} />
                    {isActing === 'reject' ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
