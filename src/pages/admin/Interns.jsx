import React, { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, MessageSquare, Trash2, AlertTriangle, Loader2, Calendar, Award, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format, parseISO, differenceInCalendarDays, startOfDay, subDays, isValid } from 'date-fns'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import MoodBadge from '../../components/ui/MoodBadge'
import toast from 'react-hot-toast'

export default function AdminInterns() {
  const { role } = useAuth()
  const canDelete = ['admin', 'dept_head'].includes(role)

  const [interns, setInterns]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [expandedRow, setExpandedRow] = useState(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null)   // intern object
  const [deleting, setDeleting]         = useState(false)

  // Edit states for internship tracking
  const [editingIntern, setEditingIntern] = useState(null) // intern ID being saved
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => { fetchInterns() }, [])

  const fetchInterns = async () => {
    try {
      const [{ data: usersData, error: usersError }, { data: logsData, error: logsError }] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'intern').order('full_name'),
        supabase.from('daily_logs').select('*').order('log_date', { ascending: false }),
      ])
      if (usersError) throw usersError
      if (logsError)  throw logsError

      const processedInterns = (usersData || []).map(intern => {
        const internLogs = (logsData || []).filter(l => l.intern_id === intern.id)
        let streak = 0
        if (internLogs.length > 0) {
          const dates  = internLogs.map(d => startOfDay(parseISO(d.log_date)))
          const today  = startOfDay(new Date())
          const latest = dates[0]
          if (latest.getTime() === today.getTime() || latest.getTime() === subDays(today, 1).getTime()) {
            streak = 1
            let check = latest
            for (let i = 1; i < dates.length; i++) {
              const diff = differenceInCalendarDays(check, dates[i])
              if (diff === 1)      { streak++; check = dates[i] }
              else if (diff === 0)  continue
              else                  break
            }
          }
        }
        const avgScore   = internLogs.length > 0
          ? (internLogs.reduce((a, l) => a + Number(l.productivity_score), 0) / internLogs.length).toFixed(1) : 0
        const lastLogDate = internLogs[0]?.log_date || null
        const isActive    = lastLogDate && differenceInCalendarDays(new Date(), parseISO(lastLogDate)) <= 7
        return {
          ...intern,
          streak,
          avgScore,
          lastLogDate,
          recentLogs: internLogs.slice(0, 5),
          isActive,
          // Handle default values for new columns
          joining_date: intern.joining_date || '',
          end_date: intern.end_date || '',
          is_certified: intern.is_certified ?? false,
          internship_status: intern.internship_status || 'incomplete'
        }
      })
      setInterns(processedInterns)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // ── Hard delete — wipes logs, users row, AND auth account ──
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const tid = toast.loading(`Deleting ${deleteTarget.full_name}…`)
    try {
      // Step 1 — delete all their logs
      const { error: logsErr } = await supabase
        .from('daily_logs')
        .delete()
        .eq('intern_id', deleteTarget.id)
      if (logsErr) {
        toast.error(`Step 1 failed (logs): ${logsErr.message}`, { id: tid })
        throw logsErr
      }

      // Step 2 — delete the users row (.select() catches silent RLS blocks)
      const { data: deleted, error: userErr } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteTarget.id)
        .select()
      if (userErr) {
        toast.error(`Step 2 failed (user row): ${userErr.message}`, { id: tid })
        throw userErr
      }
      if (!deleted || deleted.length === 0) {
        toast.error('Step 2 failed: RLS blocked delete. Run DELETE policy SQL in Supabase.', { id: tid })
        throw new Error('Delete blocked by RLS')
      }

      // Step 3 — delete from auth.users via Edge Function
      const { error: fnErr, data: fnData } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteTarget.id },
      })
      if (fnErr || fnData?.error) {
        const msg = fnErr?.message || fnData?.error
        console.warn('Auth deletion warning:', msg)
        // DB is clean — show partial success
        toast.success(`${deleteTarget.full_name} removed from app. Auth error: ${msg}`, { id: tid, duration: 6000 })
      } else {
        toast.success(`${deleteTarget.full_name} permanently deleted.`, { id: tid })
      }

      setInterns(prev => prev.filter(i => i.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Delete error:', err)
      if (!err.message?.includes('RLS')) {
        toast.error(err.message || 'Delete failed.', { id: tid })
      }
    } finally {
      setDeleting(false)
    }
  }

  // ── Update internship status ──
  const handleUpdateTracking = async (internId, data) => {
    setUpdateLoading(true)
    setEditingIntern(internId)
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', internId)

      if (error) throw error

      setInterns(prev => prev.map(i => i.id === internId ? { ...i, ...data } : i))
      toast.success('Internship data updated!')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Update failed')
    } finally {
      setEditingIntern(null)
      setUpdateLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const filtered = interns.filter(i =>
    i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      <PageHeader title="Interns" description="View all interns and their recent activity" />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-800 outline-none"
        />
      </div>

      {/* Intern cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            No interns found{search && ` for "${search}"`}.
          </div>
        ) : (
          filtered.map(intern => {
            const isExpanded = expandedRow === intern.id
            return (
              <GlassCard key={intern.id} hoverLift={false}>
                {/* Intern summary row */}
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedRow(isExpanded ? null : intern.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {intern.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm truncate">{intern.full_name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${intern.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {intern.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {intern.internship_status !== 'incomplete' && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              intern.internship_status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              intern.internship_status === 'high performer' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {intern.internship_status}
                            </span>
                          )}
                          {intern.is_certified && (
                            <CheckCircle2 size={14} className="text-blue-500" title="Certified" />
                          )}
                          {intern.streak > 0 && (
                            <span className="text-orange-500 text-xs font-bold">🔥{intern.streak}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{intern.email}</p>
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                      <span>Avg: <strong className="text-gray-900">{intern.avgScore}/10</strong></span>
                      {intern.joining_date && (
                        <span>Start: <strong className="text-gray-700">{format(parseISO(intern.joining_date), 'MMM d, yy')}</strong></span>
                      )}
                      <span>Logs: <strong className="text-gray-700">{intern.recentLogs.length}+</strong></span>
                    </div>
                  </button>

                  {/* Right actions */}
                  <div className="flex items-start gap-1.5 flex-shrink-0 pt-1">
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(intern)}
                        className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedRow(isExpanded ? null : intern.id)}
                      className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded log details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Internship Tracking Section */}
                    <div className="mt-6 pt-5 border-t border-dashed border-gray-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <h4 className="flex items-center gap-2 text-xs font-black uppercase text-gray-900 tracking-widest">
                          <Award className="w-4 h-4" /> Internship Tracking
                        </h4>
                        {(intern.is_certified || intern.internship_status !== 'incomplete') && (
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            Status: <span className="uppercase text-gray-900">{intern.internship_status}</span>
                            {intern.is_certified && <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">CERTIFIED ✓</span>}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Joining Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="date"
                              defaultValue={intern.joining_date}
                              onChange={(e) => handleUpdateTracking(intern.id, { joining_date: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-800 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">End Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="date"
                              defaultValue={intern.end_date}
                              onChange={(e) => handleUpdateTracking(intern.id, { end_date: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-800 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Status</label>
                          <select
                            value={intern.internship_status}
                            onChange={(e) => handleUpdateTracking(intern.id, { internship_status: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-gray-800 outline-none"
                          >
                            <option value="incomplete">Incomplete</option>
                            <option value="completed">Completed</option>
                            <option value="high performer">High Performer</option>
                            <option value="top performer">Top Performer</option>
                          </select>
                        </div>

                        <div>
                          <button
                            onClick={() => handleUpdateTracking(intern.id, { is_certified: !intern.is_certified })}
                            className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                              intern.is_certified
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {editingIntern === intern.id && updateLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              intern.is_certified ? <CheckCircle2 size={14} /> : <Award size={14} />
                            )}
                            {intern.is_certified ? 'Certified' : 'Issue Certificate'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <h4 className="mt-8 text-xs font-black uppercase text-gray-400 tracking-widest">Recent Logs</h4>
                    {intern.recentLogs.length === 0 ? (
                      <p className="text-sm text-gray-400">No logs yet.</p>
                    ) : (
                      intern.recentLogs.map(log => (
                        <div key={log.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                              {format(parseISO(log.log_date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500">{log.hours_worked}h worked</span>
                            <span className="text-xs text-gray-900 font-bold">Score: {log.productivity_score}</span>
                            <MoodBadge mood={log.mood} />
                            {log.blockers?.trim() && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">Blocked</span>
                            )}
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Tasks</p>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {log.tasks_completed || <span className="text-gray-400 italic">No description.</span>}
                            </p>
                          </div>

                          {log.blockers?.trim() && (
                            <div className="bg-red-50 rounded-lg p-2.5 border border-red-100">
                              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Blockers</p>
                              <p className="text-xs text-red-800 whitespace-pre-wrap">{log.blockers}</p>
                            </div>
                          )}

                          {log.admin_feedback && (
                            <div className="bg-gray-100 rounded-lg p-2.5 border border-gray-200 flex gap-2">
                              <MessageSquare size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-0.5">Admin Note</p>
                                <p className="text-xs text-gray-900 font-semibold whitespace-pre-wrap">{log.admin_feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </GlassCard>
            )
          })
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">Delete Account?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              You're about to permanently delete
            </p>
            <p className="text-sm font-bold text-gray-900 text-center mb-1">{deleteTarget.full_name}</p>
            <p className="text-xs text-gray-400 text-center mb-5">
              ({deleteTarget.email})
            </p>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 text-xs text-red-700">
              ⚠️ This will permanently delete their account and all their log history. This cannot be undone.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
