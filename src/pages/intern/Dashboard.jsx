import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Clock, BarChart2, FileText, ArrowRight } from 'lucide-react'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useStreak } from '../../hooks/useStreak'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import StatCard from '../../components/ui/StatCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import HeatmapGrid from '../../components/charts/HeatmapGrid'
import MoodTrendChart from '../../components/charts/MoodTrendChart'
import MoodBadge from '../../components/ui/MoodBadge'

export default function Dashboard() {
  const { user } = useAuth()
  const { streak, loading: streakLoading } = useStreak(user?.id)

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [loggedToday, setLoggedToday] = useState(false)
  const [stats, setStats] = useState({
    hoursThisWeek: 0,
    avgScoreThisWeek: 0,
    totalLogs: 0
  })

  // Determine greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

        // Fetch all logs
        const { data: allLogs, error: logError } = await supabase
          .from('daily_logs')
          .select('*, projects(name)')
          .eq('intern_id', user.id)
          .order('log_date', { ascending: false })

        if (logError) throw logError

        setLogs(allLogs || [])

        // Calculate stats
        let weekHours = 0
        let weekScoreTotal = 0
        let weekLogCount = 0

        const isLoggedToday = allLogs.some(log => log.log_date === todayStr)
        setLoggedToday(isLoggedToday)

        allLogs.forEach(log => {
          if (log.log_date >= weekStart && log.log_date <= weekEnd) {
            weekHours += Number(log.hours_worked) || 0
            
            if (log.productivity_score != null) {
              weekScoreTotal += Number(log.productivity_score)
              weekLogCount++
            }
          }
        })

        const avgScore = weekLogCount > 0 ? (weekScoreTotal / weekLogCount).toFixed(1) : 0

        setStats({
          hoursThisWeek: weekHours,
          avgScoreThisWeek: avgScore,
          totalLogs: allLogs.length
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  if (loading || streakLoading) return <LoadingSpinner />

  const recentLogs = logs.slice(0, 5) // Last 5
  // Get logs from last 14 days for mood trend
  const fourteenDaysAgoStr = format(new Date(new Date().setDate(new Date().getDate() - 14)), 'yyyy-MM-dd')
  const moodData = logs.filter(log => log.log_date >= fourteenDaysAgoStr)

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title={`${greeting}, ${user?.user_metadata?.full_name?.split(' ')[0] || 'Intern'} 👋`}
        description="Here's what your productivity looks like today."
      >
        <Link 
          to="/log"
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium shadow-md hover:bg-primary-700 hover:shadow-lg transition-all text-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Log Current Work
        </Link>
      </PageHeader>

      {/* Banner */}
      {loggedToday ? (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full shrink-0">
              ✅
            </div>
            <p className="font-medium text-sm sm:text-base">You've logged your work today. Keep it up!</p>
          </div>
          <Link to="/log" className="text-sm font-semibold text-green-700 hover:underline shrink-0">View / Edit Today's Log</Link>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-full shrink-0">
              ⚠️
            </div>
            <p className="font-medium text-sm sm:text-base">Don't forget to log your work today before you sign off.</p>
          </div>
          <Link to="/log" className="text-sm font-semibold text-yellow-700 hover:underline shrink-0">Log Now &rarr;</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 content-start">
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={streak > 0 ? `${streak} Days` : '0 Days'} 
          sublabel={streak > 0 ? "You're on fire!" : "Start your streak today!"}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard 
          icon={Clock} 
          label="Hours This Week" 
          value={`${stats.hoursThisWeek}h`}
          sublabel="Mon - Sun"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard 
          icon={BarChart2} 
          label="Avg Score This Week" 
          value={`${stats.avgScoreThisWeek} / 10.0`}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard 
          icon={FileText} 
          label="Total Logs" 
          value={stats.totalLogs}
          sublabel="All time"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Grid */}
        <GlassCard className="lg:col-span-1 border border-primary-100 min-h-[300px] flex flex-col justify-between" hoverLift={false}>
          <div>
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-1">Consistency Tracker</h3>
            <p className="text-sm text-gray-500 mb-6">Last 5 weeks activity</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
             <HeatmapGrid logs={logs} />
          </div>
        </GlassCard>

        {/* Mood Trend */}
        <GlassCard className="lg:col-span-2 border border-primary-100 min-h-[300px] flex flex-col justify-between" hoverLift={false}>
          <div>
            <h3 className="text-lg font-bold font-heading text-gray-900 mb-1">Mood Trend</h3>
            <p className="text-sm text-gray-500 mb-4">Last 14 days</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-end">
            <MoodTrendChart data={moodData} />
          </div>
        </GlassCard>
      </div>

      {/* Recent Logs Table */}
      <GlassCard className="overflow-hidden p-0 border border-primary-100" hoverLift={false}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold font-heading text-gray-900">Recent Logs</h3>
          <Link to="/my-logs" className="text-sm font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Tasks</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Mood</th>
                <th className="px-6 py-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLogs.length > 0 ? (
                recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {format(parseISO(log.log_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {log.projects?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="truncate max-w-[200px]">
                        {log.tasks_completed}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                      {log.hours_worked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MoodBadge mood={log.mood} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-primary-700 font-semibold">
                      {log.productivity_score}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No logs found. Start logging today!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
