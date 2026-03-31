import React, { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Clock, TrendingUp, CheckCircle, Calendar, X, ChevronRight, Zap } from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/layout/PageHeader'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalLogs: 0, avgScore: 0, loggedToday: false, streak: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    try {
      const [{ data: logs, error: logsError }, { count, error: countError }] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('id, log_date, tasks_completed, hours_worked, blockers, mood, productivity_score, admin_feedback, projects(name)')
          .eq('intern_id', user.id)
          .order('log_date', { ascending: false })
          .limit(10),
        supabase
          .from('daily_logs')
          .select('*', { count: 'exact', head: true })
          .eq('intern_id', user.id),
      ])
      if (logsError) throw logsError
      if (countError) throw countError

      const allLogs = logs || []
      const loggedToday = allLogs.some(l => isToday(parseISO(l.log_date)))
      const avgScore = allLogs.length > 0
        ? (allLogs.reduce((a, l) => a + (Number(l.productivity_score) || 0), 0) / allLogs.length).toFixed(1)
        : 0

      // Simple streak calculation
      let streak = 0
      const today = new Date()
      for (let i = 0; i < allLogs.length; i++) {
        const logDate = parseISO(allLogs[i].log_date)
        const daysAgo = Math.floor((today - logDate) / 86400000)
        if (daysAgo === i) streak++
        else break
      }

      setStats({ totalLogs: count || 0, avgScore, loggedToday, streak })
      setRecentLogs(allLogs.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  if (loading) return <LoadingSpinner />

  const getMoodEmoji = mood => ({ great: '😄', good: '🙂', okay: '😐', struggling: '😟' }[mood] || '🙂')

  return (
    <div className="space-y-5 pb-10 animate-fade-in">

      {/* ── Hero Header via PageHeader ── */}
      <PageHeader title="My Dashboard" greeting>
        {stats.loggedToday ? (
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold w-fit">
            <CheckCircle size={16} className="text-green-300" />
            <span>You've logged for today!</span>
          </div>
        ) : (
          <Link
            to="/log"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm rounded-xl px-4 py-2.5 hover:bg-indigo-50 active:scale-95 transition-all"
          >
            <Plus size={16} /> Post Today's Update
          </Link>
        )}
      </PageHeader>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          label="Total Logs"
          value={stats.totalLogs}
          sublabel="All time"
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Score"
          value={`${stats.avgScore}/10`}
          sublabel="Productivity"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={Zap}
          label="Streak"
          value={`${stats.streak}d`}
          sublabel={stats.streak > 0 ? 'Keep it up!' : 'Start today'}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
        />
        <StatCard
          icon={Calendar}
          label="Today"
          value={stats.loggedToday ? 'Logged ✓' : 'Pending'}
          sublabel={stats.loggedToday ? 'Great job!' : 'Log now'}
          iconColor={stats.loggedToday ? 'text-green-600' : 'text-amber-500'}
          iconBg={stats.loggedToday ? 'bg-green-50' : 'bg-amber-50'}
        />
      </div>

      {/* ── Quick Action ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/log"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Post Update</p>
              <p className="text-xs text-gray-400">Log your work for today</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
        </Link>

        <Link
          to="/my-logs"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">View All Logs</p>
              <p className="text-xs text-gray-400">Full history & filters</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </Link>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Recent Activity</h3>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <button
                key={log.id}
                onClick={() => setSelectedReport(log)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm active:scale-[0.995] transition-all p-4"
              >
                <div className="flex items-center gap-3">
                  {/* Mood / date column */}
                  <div className="flex-shrink-0 text-center w-10">
                    <span className="text-xl">{getMoodEmoji(log.mood)}</span>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 leading-none">
                      {format(parseISO(log.log_date), 'MMM d')}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">
                        {log.projects?.name || 'General'}
                      </span>
                      {isToday(parseISO(log.log_date)) && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded">Today</span>
                      )}
                      {log.blockers?.trim() && (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded">Blocker</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{log.tasks_completed || 'No details.'}</p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-black ${Number(log.productivity_score) >= 7 ? 'text-green-600' :
                      Number(log.productivity_score) >= 4 ? 'text-amber-600' : 'text-red-500'
                      }`}>{log.productivity_score}/10</span>
                    <p className="text-[9px] text-gray-300">{log.hours_worked}h</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-400 text-sm font-semibold">No logs yet</p>
            <Link to="/log" className="inline-block mt-2 text-xs text-indigo-600 font-bold">
              Post your first update →
            </Link>
          </div>
        )}
      </div>

      {/* ── Log Detail Bottom Sheet ── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/0"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] rounded-t-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-3">
              <div>
                <p className="font-black text-gray-900 text-base">
                  {format(parseISO(selectedReport.log_date), 'EEEE, MMMM d')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedReport.projects?.name || 'No project'} · {selectedReport.hours_worked}h worked
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-4">
              {/* Meta row */}
              <div className="flex gap-2 flex-wrap">
                <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                  {getMoodEmoji(selectedReport.mood)} {selectedReport.mood}
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${Number(selectedReport.productivity_score) >= 7 ? 'bg-green-50 text-green-700' :
                  Number(selectedReport.productivity_score) >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                  Score: {selectedReport.productivity_score}/10
                </div>
                <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                  {selectedReport.hours_worked}h
                </div>
              </div>

              {/* Tasks */}
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">What I did</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.tasks_completed || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Blockers */}
              {selectedReport.blockers?.trim() && (
                <div>
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2">Blockers</p>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-sm text-red-800 whitespace-pre-wrap">{selectedReport.blockers}</p>
                  </div>
                </div>
              )}

              {/* Admin feedback */}
              {selectedReport.admin_feedback && (
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2">Admin Reply</p>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <p className="text-sm text-indigo-900 font-medium whitespace-pre-wrap">{selectedReport.admin_feedback}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
