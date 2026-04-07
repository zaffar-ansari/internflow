import React, { useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PenTool, BarChart3, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Logo from '../components/ui/Logo'

export default function Landing() {
  const { user, role, loading } = useAuth()
  // Removed IntersectionObserver because it ran during LoadingSpinner when DOM was empty

  if (loading) return <LoadingSpinner />

  if (user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10 w-full overflow-hidden">

      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 sm:p-6 w-[90%] md:max-w-7xl mx-auto glass rounded-full mt-6">
        <Logo size="md" />
        <div>
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-full border border-primary-600 text-primary-600 font-medium hover:bg-primary-50 transition-colors bg-white/50 backdrop-blur-md"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 max-w-5xl mx-auto animate-fade-in w-full">
        <h1 className="text-5xl md:text-7xl font-bold font-heading text-gray-900 mb-6 tracking-tight leading-tight">
          Track. <span className="bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">Grow.</span> Succeed.
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl font-body">
          The productivity hub built for interns and the admins who guide them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            to="/signup"
            className="px-8 py-3.5 bg-primary-600 text-white rounded-full font-semibold text-lg hover:bg-primary-700 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center"
          >
            Get Started &rarr;
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 bg-white/40 border border-gray-200 backdrop-blur-md text-gray-800 rounded-full font-semibold text-lg hover:bg-white/60 hover:shadow-sm hover:-translate-y-0.5 transition-all w-full sm:w-auto text-center"
          >
            Login
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-4 py-20 bg-white/30 backdrop-blur-lg border-t border-white/40">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="feature-card animate-slide-up" hoverLift>
              <div className="w-14 h-14 bg-primary-100/80 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-primary-600">
                <PenTool className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">📝 Daily Logging</h3>
              <p className="text-gray-600">Log your work, accomplishments, and current blockers in under 2 minutes every day.</p>
            </GlassCard>

            <GlassCard className="feature-card animate-slide-up" style={{ animationDelay: '100ms' }} hoverLift>
              <div className="w-14 h-14 bg-indigo-100/80 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-indigo-600">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">📊 Smart Insights</h3>
              <p className="text-gray-600">Automated productivity scores, logging streaks, and mood trends built natively.</p>
            </GlassCard>

            <GlassCard className="feature-card animate-slide-up" style={{ animationDelay: '200ms' }} hoverLift>
              <div className="w-14 h-14 bg-purple-100/80 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-purple-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold font-heading mb-3 text-gray-900">🛡️ Admin Oversight</h3>
              <p className="text-gray-600">Full visibility for team leads to assign projects, unblock interns, and export daily logs.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 flex flex-col items-center gap-3 text-center text-gray-500 text-sm font-medium border-t border-white/20 bg-white/20 backdrop-blur-md">
        <Logo size="sm" className="opacity-70 grayscale hover:grayscale-0 transition-all duration-300" />
        <p>Intern~Flow v1.0</p>
      </footer>
    </div>
  )
}
