import React, { useState, useEffect } from 'react'
import { Users, FileText, BarChart2, AlertCircle } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import StatCard from '../../components/ui/StatCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import HoursBarChart from '../../components/charts/HoursBarChart'
import SubmissionsLineChart from '../../components/charts/SubmissionsLineChart'

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalInterns: 0,
    logsToday: 0,
    avgScoreThisWeek: 0,
    blockersToday: 0
  })
  
  const [hoursData, setHoursData] = useState([])
  const [submissionsData, setSubmissionsData] = useState([])
  const [blockerAlerts, setBlockerAlerts] = useState([])

  useEffect(() => {
    fetchAdminDashboard()
  }, [])

  const fetchAdminDashboard = async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const thirtyDaysAgoStr = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

      // Fetch internally only
      const { data: internsData } = await supabase.from('users').select('*').eq('role', 'intern')
      
      const { data: weekLogsData } = await supabase
        .from('daily_logs')
        .select(`*, users (full_name), projects (name)`)
        .gte('log_date', thirtyDaysAgoStr)

      const weekLogs = weekLogsData || []

      // Stats
      const totalInterns = internsData?.length || 0
      const logsToday = weekLogs.filter(log => log.log_date === todayStr).length
      
      const logsThisWeek = weekLogs.filter(log => log.log_date >= weekStartStr && log.log_date <= weekEndStr)
      const avgScoreRaw = logsThisWeek.reduce((acc, log) => acc + (Number(log.productivity_score) || 0), 0) / (logsThisWeek.length || 1)
      const avgScoreThisWeek = logsThisWeek.length > 0 ? avgScoreRaw.toFixed(1) : 0
      
      const todayBlockers = weekLogs.filter(log => log.log_date === todayStr && log.blockers && log.blockers.trim() !== '')
      
      setStats({
        totalInterns,
        logsToday,
        avgScoreThisWeek,
        blockersToday: todayBlockers.length
      })

      setBlockerAlerts(todayBlockers.map(b => ({
        id: b.id,
        internName: b.users?.full_name || 'Unknown',
        projectName: b.projects?.name || 'Unassigned',
        blocker: b.blockers
      })))

      // Hours data grouping for bar chart (intern => hours this week)
      const internHoursMap = {}
      logsThisWeek.forEach(log => {
        const name = log.users?.full_name || 'Unknown'
        if (!internHoursMap[name]) internHoursMap[name] = 0
        internHoursMap[name] += Number(log.hours_worked) || 0
      })
      const hoursChartData = Object.keys(internHoursMap).map(key => ({
        name: key,
        hours: internHoursMap[key]
      }))
      setHoursData(hoursChartData)

      // Submissions grouping for line chart (date => count)
      const dateCountMap = {}
      weekLogs.forEach(log => {
        if (!dateCountMap[log.log_date]) dateCountMap[log.log_date] = 0
        dateCountMap[log.log_date]++
      })
      
      // Fill the last 30 days
      const subChartData = []
      for (let i = 29; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd')
        subChartData.push({
          date: dateStr,
          count: dateCountMap[dateStr] || 0
        })
      }
      setSubmissionsData(subChartData)

    } catch (error) {
      console.error('Error fetching admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-fade-in">
      <PageHeader 
        title="Admin Overview" 
        description={format(new Date(), 'EEEE, MMMM d, yyyy')} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 content-start">
        <StatCard 
          icon={Users} 
          label="Total Interns" 
          value={stats.totalInterns} 
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard 
          icon={FileText} 
          label="Logs Today" 
          value={stats.logsToday} 
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard 
          icon={BarChart2} 
          label="Avg Score This Week" 
          value={`${stats.avgScoreThisWeek} / 10.0`}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard 
          icon={AlertCircle} 
          label="Blockers Reported Today" 
          value={stats.blockersToday} 
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard hoverLift={false}>
          <div className="mb-4">
             <h3 className="text-lg font-bold font-heading text-gray-900 border-b border-gray-100 pb-2">Hours Worked This Week</h3>
          </div>
          <HoursBarChart data={hoursData} />
        </GlassCard>
        <GlassCard hoverLift={false}>
          <div className="mb-4">
             <h3 className="text-lg font-bold font-heading text-gray-900 border-b border-gray-100 pb-2">Daily Log Submissions</h3>
          </div>
          <SubmissionsLineChart data={submissionsData} />
        </GlassCard>
      </div>

      <div>
        <h3 className="text-xl font-bold font-heading text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" /> Blocker Alerts
        </h3>
        
        {blockerAlerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl flex items-center shadow-sm">
            <span className="text-xl mr-3">🎉</span>
            <p className="font-medium text-lg">No blockers reported today. Everyone is unblocked!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockerAlerts.map(alert => (
              <GlassCard key={alert.id} className="border border-red-100 bg-red-50/30" hoverLift>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{alert.internName}</h4>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">{alert.projectName}</span>
                </div>
                <p className="text-sm text-red-800 bg-white/50 p-3 rounded-lg border border-red-50 mt-3 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {alert.blocker}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
