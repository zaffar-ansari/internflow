import React, { useState, useEffect, useCallback } from 'react'
import { Users, FileText, BarChart2, AlertCircle, MessageSquare, Send, X, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import StatCard from '../../components/ui/StatCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import HoursBarChart from '../../components/charts/HoursBarChart'
import SubmissionsLineChart from '../../components/charts/SubmissionsLineChart'

// ── Project-Grouped Log Viewer ────────────────────────────────────────────────
function ProjectGroupedLogs({ logs, onFeedback }) {
  const [openProjects, setOpenProjects] = useState({})
  const [openLogs, setOpenLogs] = useState({})
  const [feedbackText, setFeedbackText] = useState({})
  const [sending, setSending] = useState({})

  // Group logs by project
  const grouped = logs.reduce((acc, log) => {
    const key = log.projects?.name || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(log)
    return acc
  }, {})

  const toggleProject = key => setOpenProjects(p => ({ ...p, [key]: !p[key] }))
  const toggleLog = id => setOpenLogs(l => ({ ...l, [id]: !l[id] }))

  const handleSend = async (log) => {
    const text = feedbackText[log.id]?.trim()
    if (!text) return
    setSending(s => ({ ...s, [log.id]: true }))
    try {
      // .select() after update lets us verify the row was actually written
      // If RLS blocks the write, Supabase returns data=[] with no error
      const { data, error } = await supabase
        .from('daily_logs')
        .update({ admin_feedback: text })
        .eq('id', log.id)
        .select('id, admin_feedback')

      if (error) throw error

      // Silent RLS block: update returned 0 rows
      if (!data || data.length === 0) {
        throw new Error('RLS_BLOCKED')
      }

      toast.success('Feedback sent!')
      setFeedbackText(f => ({ ...f, [log.id]: '' }))
      // Update the local object so UI reflects without re-fetch
      log.admin_feedback = text
    } catch (err) {
      if (err?.message === 'RLS_BLOCKED') {
        toast.error('Permission denied. Run the RLS fix SQL in Supabase (see console).')
        console.error(
          '%c[InternFlow] Admin feedback blocked by RLS policy.\n' +
          'Run this in Supabase SQL Editor:\n\n' +
          'ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS admin_feedback text;\n\n' +
          'CREATE POLICY "Admins can update feedback" ON daily_logs\n' +
          'FOR UPDATE USING (\n' +
          "  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','staff','dept_head'))\n" +
          ');',
          'color: #ef4444; font-weight: bold;'
        )
      } else {
        toast.error('Failed to send feedback.')
        console.error(err)
      }
    } finally {
      setSending(s => ({ ...s, [log.id]: false }))
    }
  }

  const getMoodEmoji = mood => ({ great: '😄', good: '🙂', okay: '😐', struggling: '😟' }[mood] || '🙂')

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([projectName, projectLogs]) => {
        const isOpen = openProjects[projectName]
        const hasBlockers = projectLogs.some(l => l.blockers?.trim())
        return (
          <div key={projectName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* ── Project Header ── */}
            <button
              onClick={() => toggleProject(projectName)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-indigo-600" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-gray-900 text-sm truncate">{projectName}</p>
                  <p className="text-[10px] text-gray-400">{projectLogs.length} log{projectLogs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {hasBlockers && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-lg">Blockers</span>}
                {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </div>
            </button>

            {/* ── Logs under project ── */}
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {projectLogs.map(log => {
                  const isLogOpen = openLogs[log.id]
                  return (
                    <div key={log.id}>
                      {/* Log row */}
                      <button
                        onClick={() => toggleLog(log.id)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-lg flex-shrink-0">{getMoodEmoji(log.mood)}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">{log.users?.full_name || 'Unknown'}</span>
                              <span className="text-[10px] text-gray-400">{format(new Date(log.log_date), 'MMM d, yyyy')}</span>
                              {log.blockers?.trim() && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded">Blocked</span>}
                              {log.admin_feedback && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded">Replied</span>}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{log.tasks_completed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs font-bold ${log.productivity_score >= 7 ? 'text-green-600' :
                              log.productivity_score >= 4 ? 'text-amber-600' : 'text-red-500'
                            }`}>{log.productivity_score}/10</span>
                          <span className="text-xs text-indigo-500 font-bold">{log.hours_worked}h</span>
                          {isLogOpen ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
                        </div>
                      </button>

                      {/* ── Expanded log detail ── */}
                      {isLogOpen && (
                        <div className="mx-4 mb-4 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                          {/* Tasks */}
                          <div className="p-4 border-b border-gray-100">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Tasks Completed</p>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{log.tasks_completed || 'No description.'}</p>
                          </div>

                          {/* Blockers */}
                          {log.blockers?.trim() && (
                            <div className="p-4 bg-red-50/50 border-b border-red-100">
                              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2">Blockers</p>
                              <p className="text-sm text-red-800 whitespace-pre-wrap">{log.blockers}</p>
                            </div>
                          )}

                          {/* Admin feedback (existing) */}
                          {log.admin_feedback && (
                            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
                              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2 flex items-center gap-1">
                                <MessageSquare size={10} /> Your Feedback
                              </p>
                              <p className="text-sm text-indigo-900 font-medium whitespace-pre-wrap">{log.admin_feedback}</p>
                            </div>
                          )}

                          {/* Send feedback */}
                          <div className="p-4">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Reply / Follow-up</p>
                            <div className="flex gap-2">
                              <textarea
                                rows={2}
                                value={feedbackText[log.id] || ''}
                                onChange={e => setFeedbackText(f => ({ ...f, [log.id]: e.target.value }))}
                                placeholder="Write a message for this intern..."
                                className="flex-1 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                              />
                              <button
                                onClick={() => handleSend(log)}
                                disabled={sending[log.id] || !feedbackText[log.id]?.trim()}
                                className="flex-shrink-0 self-end px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                              >
                                <Send size={13} /> {sending[log.id] ? '...' : 'Send'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalInterns: 0, logsToday: 0, avgScoreThisWeek: 0, blockersToday: 0 })
  const [hoursData, setHoursData] = useState([])
  const [submissionsData, setSubmissionsData] = useState([])
  const [blockerAlerts, setBlockerAlerts] = useState([])
  const [allRecentLogs, setAllRecentLogs] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateFilter, setDateFilter] = useState('all')
  const [customDate, setCustomDate] = useState('')
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Fetch filtered logs separately
  const fetchFilteredLogs = useCallback(async () => {
    try {
      let query = supabase.from('daily_logs').select('*, users(full_name), projects(name)')
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

      if (dateFilter === 'today') query = query.eq('log_date', todayStr)
      else if (dateFilter === 'yesterday') query = query.eq('log_date', yesterdayStr)
      else if (dateFilter === 'custom' && customDate) query = query.eq('log_date', customDate)
      else query = query.order('created_at', { ascending: false }).limit(100)

      const { data, error } = await query
      if (!error && data) {
        setAllRecentLogs([...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      }
    } catch (err) { console.error(err) }
  }, [dateFilter, customDate])

  useEffect(() => { fetchFilteredLogs() }, [fetchFilteredLogs])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const thirtyAgoStr = format(subDays(new Date(), 30), 'yyyy-MM-dd')
        const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

        const [{ data: internsData }, { data: weekLogsData }] = await Promise.all([
          supabase.from('users').select('id').eq('role', 'intern'),
          supabase.from('daily_logs').select('*, users(full_name), projects(name)').gte('log_date', thirtyAgoStr),
        ])

        const weekLogs = weekLogsData || []
        const logsThisWeek = weekLogs.filter(l => l.log_date >= weekStartStr && l.log_date <= weekEndStr)
        const avgScoreRaw = logsThisWeek.reduce((a, l) => a + (Number(l.productivity_score) || 0), 0) / (logsThisWeek.length || 1)
        const todayBlockers = weekLogs.filter(l => l.log_date === todayStr && l.blockers?.trim())

        setStats({
          totalInterns: internsData?.length || 0,
          logsToday: weekLogs.filter(l => l.log_date === todayStr).length,
          avgScoreThisWeek: logsThisWeek.length > 0 ? avgScoreRaw.toFixed(1) : 0,
          blockersToday: todayBlockers.length,
        })
        setBlockerAlerts(todayBlockers.map(b => ({
          id: b.id, internName: b.users?.full_name || 'Unknown',
          projectName: b.projects?.name || 'Unassigned', blocker: b.blockers,
        })))

        // Hours chart
        const internHoursMap = {}
        logsThisWeek.forEach(l => {
          const name = l.users?.full_name || 'Unknown'
          internHoursMap[name] = (internHoursMap[name] || 0) + (Number(l.hours_worked) || 0)
        })
        setHoursData(Object.entries(internHoursMap).map(([name, hours]) => ({ name, hours })))

        // Submissions chart
        const dateCountMap = {}
        weekLogs.forEach(l => { dateCountMap[l.log_date] = (dateCountMap[l.log_date] || 0) + 1 })
        setSubmissionsData(Array.from({ length: 30 }, (_, i) => {
          const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
          return { date: d, count: dateCountMap[d] || 0 }
        }))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const handleSendFeedback = async () => {
    if (!replyText.trim() || !selectedReport) return
    setSendingReply(true)
    try {
      const { error } = await supabase.from('daily_logs').update({ admin_feedback: replyText.trim() }).eq('id', selectedReport.id)
      if (error) { toast.error('Column missing. Run: ALTER TABLE daily_logs ADD COLUMN admin_feedback text;'); return }
      toast.success('Feedback sent!')
      const updated = { ...selectedReport, admin_feedback: replyText.trim() }
      setSelectedReport(updated)
      setAllRecentLogs(prev => prev.map(l => l.id === selectedReport.id ? updated : l))
      setReplyText('')
    } catch (err) { console.error(err); toast.error('Failed to send.') }
    finally { setSendingReply(false) }
  }

  const handleCloseModal = () => { setSelectedReport(null); setReplyText('') }

  if (loading) return <LoadingSpinner />

  const filterBtns = ['all', 'today', 'yesterday']

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <PageHeader title="Command Center" greeting>
        <p className="text-indigo-200 text-sm">
          {stats.logsToday} log{stats.logsToday !== 1 ? 's' : ''} today &nbsp;·&nbsp; {stats.totalInterns} interns
        </p>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Total Interns" value={stats.totalInterns} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard icon={FileText} label="Logs Today" value={stats.logsToday} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard icon={BarChart2} label="Avg Score This Week" value={`${stats.avgScoreThisWeek}/10`} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <StatCard icon={AlertCircle} label="Blockers Today" value={stats.blockersToday} iconColor="text-red-600" iconBg="bg-red-50" />
      </div>

      {/* Charts – explicit height on container so ResponsiveContainer works */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard hoverLift={false}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Hours Logged This Week</h3>
          <div className="h-52">
            <HoursBarChart data={hoursData} />
          </div>
        </GlassCard>
        <GlassCard hoverLift={false}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Submissions – Last 30 Days</h3>
          <div className="h-52">
            <SubmissionsLineChart data={submissionsData} />
          </div>
        </GlassCard>
      </div>

      {/* Blocker Alerts */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> Blocker Alerts
        </h3>
        {blockerAlerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <span>🎉</span> No blockers reported today!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {blockerAlerts.map(alert => (
              <GlassCard key={alert.id} className="border border-red-100 bg-red-50/30" hoverLift={false}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{alert.internName}</h4>
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold flex-shrink-0">{alert.projectName}</span>
                </div>
                <p className="text-xs text-red-800 bg-white/70 p-2.5 rounded-lg border border-red-100 whitespace-pre-wrap leading-relaxed">{alert.blocker}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Recent Log Reports — grouped by Project */}
      <div>
        <div className="flex flex-col gap-3 mb-4">
          {/* Title row */}
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Log Reports
          </h3>
          {/* Filter pills — wrap naturally on mobile */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
              {filterBtns.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { setDateFilter(f); setCustomDate('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                    dateFilter === f ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >{f}</button>
              ))}
            </div>
            {/* Date picker — stands alone on its own pill */}
            <div className={`flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
              dateFilter === 'custom' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-400'
            }`}>
              <input
                type="date"
                value={customDate}
                onChange={e => { setCustomDate(e.target.value); if (e.target.value) setDateFilter('custom'); else setDateFilter('all') }}
                className="bg-transparent outline-none cursor-pointer w-32 text-xs"
              />
            </div>
          </div>
        </div>

        {allRecentLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">No reports found.</div>
        ) : (
          <ProjectGroupedLogs
            logs={allRecentLogs}
            onFeedback={(log) => setSelectedReport(log)}
          />
        )}
      </div>
    </div>
  )
}
