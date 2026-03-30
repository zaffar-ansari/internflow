import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useProductivityScore } from '../../hooks/useProductivityScore'
import { calculateScore } from '../../utils/calculateScore'
import { format } from 'date-fns'
import PageHeader from '../../components/layout/PageHeader'
import GlassCard from '../../components/ui/GlassCard'
import ScoreBar from '../../components/ui/ScoreBar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function LogToday() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [existingLog, setExistingLog] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [projects, setProjects] = useState([])
  
  const [formData, setFormData] = useState({
    project_id: '',
    tasks_completed: '',
    hours_worked: 4.0,
    blockers: '',
    mood: 'good'
  })

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd')

        // Fetch assigned projects
        const { data: assignments, error: projError } = await supabase
          .from('project_assignments')
          .select('project_id, projects(name)')
          .eq('intern_id', user.id)

        if (projError) throw projError
        setProjects(assignments || [])

        // If projects exist, select first one by default
        if (assignments && assignments.length > 0) {
          setFormData(prev => ({ ...prev, project_id: assignments[0].project_id }))
        }

        // Fetch today's log
        const { data: log, error: logError } = await supabase
          .from('daily_logs')
          .select('*, projects(name)')
          .eq('intern_id', user.id)
          .eq('log_date', todayStr)
          .single()

        if (log && !logError) {
          setExistingLog(log)
          setFormData({
            project_id: log.project_id || '',
            tasks_completed: log.tasks_completed,
            hours_worked: log.hours_worked,
            blockers: log.blockers || '',
            mood: log.mood
          })
        }
      } catch (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is no rows, normal for missing log
          console.error('Error fetching data:', error)
          toast.error('Failed to load data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const previewScore = useProductivityScore(formData.hours_worked, formData.mood)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const score = calculateScore(formData.hours_worked, formData.mood)

      const payload = {
        intern_id: user.id,
        project_id: formData.project_id || null, // Optional if no projects assigned
        log_date: todayStr,
        tasks_completed: formData.tasks_completed,
        hours_worked: formData.hours_worked,
        blockers: formData.blockers,
        mood: formData.mood,
        productivity_score: score
      }

      if (existingLog) {
        // Update
        const { error } = await supabase
          .from('daily_logs')
          .update(payload)
          .eq('id', existingLog.id)

        if (error) throw error
        toast.success("Log updated successfully!")
      } else {
        // Insert
        const { error } = await supabase
          .from('daily_logs')
          .insert([payload])

        if (error) throw error
        toast.success("Log submitted successfully!")
      }

      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || "Failed to submit log")
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const moodOptions = [
    { value: 'great', emoji: '😄', label: 'Great' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'struggling', emoji: '😟', label: 'Struggling' },
  ]

  if (existingLog && !isEditing) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
        <PageHeader 
          title="Log Today" 
          description={format(new Date(), 'EEEE, MMMM d, yyyy')} 
        />
        
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <p className="font-semibold text-lg hover:underline">Already logged today</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-white text-green-700 font-medium rounded-xl hover:bg-green-100 transition-colors shadow-sm"
          >
            Edit Log
          </button>
        </div>

        <GlassCard className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div>
               <p className="text-sm text-gray-500 font-medium">Project</p>
               <p className="text-gray-900 font-semibold">{existingLog.projects?.name || 'Unassigned'}</p>
             </div>
             <div>
               <p className="text-sm text-gray-500 font-medium">Score</p>
               <p className="text-primary-700 font-semibold text-xl">{existingLog.productivity_score} / 10.0</p>
             </div>
           </div>
           
           <div>
             <p className="text-sm text-gray-500 font-medium mb-1">Tasks Completed</p>
             <div className="bg-gray-50 p-4 rounded-xl text-gray-800 whitespace-pre-wrap">
               {existingLog.tasks_completed}
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Hours Worked</p>
               <p className="text-gray-900 font-semibold">{existingLog.hours_worked}h</p>
             </div>
             <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Mood</p>
               <div className="flex items-center gap-2">
                 <span className="text-2xl">{moodOptions.find(m => m.value === existingLog.mood)?.emoji}</span>
                 <span className="font-medium text-gray-900 capitalize">{existingLog.mood}</span>
               </div>
             </div>
           </div>

           {existingLog.blockers && (
             <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Blockers</p>
               <div className="bg-red-50 text-red-800 p-4 rounded-xl whitespace-pre-wrap">
                 {existingLog.blockers}
               </div>
             </div>
           )}
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title={isEditing ? "Edit Today's Log" : "Log Today"} 
        description={format(new Date(), 'EEEE, MMMM d, yyyy')} 
      />

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
            >
              <option value="">No Project Selected</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.projects?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tasks Completed</label>
            <textarea
              required
              rows={4}
              value={formData.tasks_completed}
              onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
              className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm placeholder-gray-400"
              placeholder="What did you accomplish today? Be specific."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
               <label className="text-sm font-semibold text-gray-700">Hours Worked</label>
               <span className="text-primary-600 font-bold bg-primary-50 px-3 py-1 rounded-full">{formData.hours_worked} hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12"
              step="0.5"
              value={formData.hours_worked}
              onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>0.5h</span>
              <span>12h</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Blockers (Optional)</label>
            <textarea
              rows={2}
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              className="w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-red-300 focus:border-transparent outline-none transition-all shadow-sm placeholder-gray-400"
              placeholder="Any issues blocking your progress?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">How was your mood today?</label>
            <div className="grid grid-cols-4 gap-3">
              {moodOptions.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: value })}
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-200 ${
                    formData.mood === value 
                      ? 'bg-primary-50 border-primary-500 shadow-md ring-2 ring-primary-200 scale-105' 
                      : 'bg-white/50 border-gray-200 hover:bg-gray-50 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl mb-2">{emoji}</span>
                  <span className={`text-xs font-semibold ${formData.mood === value ? 'text-primary-700' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100 backdrop-blur-sm shadow-sm mt-8">
            <ScoreBar score={previewScore} />
            <p className="text-xs text-gray-500 mt-3 text-center">Score is calculated based on hours worked and your mood.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-70 flex-1 md:flex-none"
            >
              {submitting ? 'Submitting...' : isEditing ? 'Update Log →' : 'Submit Log →'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
