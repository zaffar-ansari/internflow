import React, { useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PenTool, BarChart3, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/ui/GlassCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Logo from '../components/ui/Logo'

export default function Landing() {
  const { user, role, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-10 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }}></div>

      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 sm:p-6 w-[90%] md:max-w-7xl mx-auto glass rounded-full mt-6 relative z-10 shadow-sm border border-white/50">
        <Logo size="md" />
        <div className="flex gap-4 items-center">
          <Link
            to="/login"
            className="px-5 py-2 rounded-full font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-6 py-2.5 rounded-full bg-primary-900 text-white font-medium hover:bg-primary-800 transition-all shadow-md hover:shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 max-w-6xl mx-auto animate-fade-in w-full relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 shadow-sm backdrop-blur-md">
          <Zap className="w-4 h-4 text-yellow-500 fill-current" />
          <span>The #1 productivity hub for modern interns</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-heading text-gray-900 mb-6 tracking-tight leading-[1.1]">
          Track work. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600">Grow fast.</span>
          <br className="hidden md:block"/> Succeed together.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-body leading-relaxed">
          InternFlow bridges the gap between interns and managers. Log daily accomplishments, blockages, and automate your productivity tracking in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
          <Link
            to="/signup"
            className="group px-8 py-4 bg-primary-900 text-white rounded-full font-semibold text-lg hover:bg-primary-800 transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2 shadow-xl shadow-primary-900/20"
          >
            Start for free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/80 border border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto text-center shadow-sm backdrop-blur-sm"
          >
            Book Demo
          </Link>
        </div>

        {/* Dashboard Mockup Component */}
        <div className="w-full max-w-5xl mx-auto px-4 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="relative rounded-2xl md:rounded-3xl border border-gray-200/50 bg-white/40 glass p-2 shadow-2xl backdrop-blur-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 rounded-2xl md:rounded-3xl pointer-events-none"></div>
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-[400px]">
              
              {/* Mock Sidebar */}
              <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 hidden md:flex flex-col">
                <div className="h-6 w-32 bg-gray-200 rounded-md mb-10"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-10 bg-white rounded-lg border border-gray-100 shadow-sm flex items-center px-4 gap-3">
                    <div className="w-5 h-5 bg-indigo-100 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-transparent rounded-lg flex items-center px-4 gap-3 opacity-60">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 bg-transparent rounded-lg flex items-center px-4 gap-3 opacity-60">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-12 bg-gray-200/50 rounded-lg mt-auto"></div>
              </div>

              {/* Mock Main Content */}
              <div className="flex-1 p-6 md:p-8 relative flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <div className="h-7 w-40 bg-gray-800 rounded-md mb-2"></div>
                    <div className="h-4 w-24 bg-gray-400 rounded-md"></div>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="h-28 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-indigo-200/50"></div>
                    <div className="h-4 w-1/2 bg-indigo-200 rounded"></div>
                  </div>
                  <div className="h-28 bg-purple-50/50 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-purple-200/50"></div>
                    <div className="h-4 w-2/3 bg-purple-200 rounded"></div>
                  </div>
                  <div className="h-28 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between hidden md:flex">
                    <div className="w-8 h-8 rounded-full bg-emerald-200/50"></div>
                    <div className="h-4 w-1/2 bg-emerald-200 rounded"></div>
                  </div>
                </div>
                <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
                  <div className="h-5 w-48 bg-gray-300 rounded mb-2"></div>
                  <div className="h-12 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
                  <div className="h-12 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>


      {/* Features: Interns vs Admins */}
      <section className="px-4 py-32 bg-white relative z-10 w-full" id="features">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 text-gray-900">Built for both sides of the table</h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">InternFlow provides dedicated experiences tailored to what interns need to grow, and what managers need to guide effectively.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 md:gap-24 mb-20 items-center">
            {/* Interns */}
            <div className="order-2 md:order-1">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                <PenTool className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold font-heading mb-4 text-gray-900">For Interns: Effortless Logging</h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">Stop worrying about writing huge emails on Friday. Log your daily tasks, achievements, and blockers in under two minutes.</p>
              <ul className="space-y-5">
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" /> <span className="text-lg">Pre-built templates for fast and consistent logging.</span></li>
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" /> <span className="text-lg">Automated streaks to build consistency and momentum.</span></li>
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" /> <span className="text-lg">Personal dashboard to track your weekly impact.</span></li>
              </ul>
            </div>
            
            <div className="order-1 md:order-2 bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-3xl p-8 border border-indigo-100 shadow-xl h-96 flex relative overflow-hidden">
               {/* Decorative elements */}
               <div className="absolute top-10 right-10 w-24 h-24 bg-white rounded-2xl shadow-lg rotate-12 opacity-80"></div>
               <div className="absolute bottom-10 left-10 w-32 h-32 bg-indigo-200/50 rounded-full blur-xl"></div>
               <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-white p-6 shadow-sm mt-auto h-64 z-10">
                 <div className="h-4 w-24 bg-indigo-100 rounded mb-6"></div>
                 <div className="space-y-3">
                   <div className="h-10 bg-gray-50 rounded-lg"></div>
                   <div className="h-10 bg-gray-50 rounded-lg"></div>
                   <div className="h-10 bg-gray-50 rounded-lg"></div>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
            <div className="bg-gradient-to-tr from-purple-50 to-pink-50 rounded-3xl p-8 border border-purple-100 shadow-xl h-96 flex relative overflow-hidden">
                {/* Decorative elements */}
               <div className="absolute top-10 left-10 w-48 h-48 bg-white rounded-3xl shadow-lg -rotate-6 opacity-80 p-4">
                 <div className="h-full border-2 border-dashed border-purple-200 rounded-xl"></div>
               </div>
               <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300/30 rounded-full blur-2xl"></div>
               <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-white p-6 shadow-sm mt-auto h-48 z-10 relative left-12">
                 <div className="h-4 w-32 bg-purple-100 rounded mb-6"></div>
                 <div className="flex gap-4">
                   <div className="h-16 w-16 bg-purple-50 rounded-xl"></div>
                   <div className="h-16 flex-1 bg-purple-50 rounded-xl"></div>
                 </div>
               </div>
            </div>

            {/* Managers */}
            <div>
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-3xl font-bold font-heading mb-4 text-gray-900">For Managers: Total Oversight</h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">No more micromanaging. Get high-level pulse checks and dive deep into metrics to resolve blockers instantly before they derail projects.</p>
              <ul className="space-y-5">
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-purple-500 shrink-0" /> <span className="text-lg">Centralized admin dashboard to view the whole team.</span></li>
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-purple-500 shrink-0" /> <span className="text-lg">AI-powered productivity insights and anomaly detection.</span></li>
                <li className="flex gap-4 text-gray-700 items-start"><CheckCircle2 className="w-6 h-6 text-purple-500 shrink-0" /> <span className="text-lg">Bulk data export for comprehensive performance reviews.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-gray-50 border-y border-gray-200 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6 text-gray-900">How it works</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Three simple steps to supercharge your internship program.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-indigo-200 via-purple-200 to-emerald-200 -z-10"></div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold shadow-md mx-auto mb-8 text-indigo-600 relative z-10 group-hover:scale-110 transition-transform">1</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Onboard Team</h4>
              <p className="text-gray-600 text-lg">Admins invite interns via email. Secure authentication ensures only authorized users get in.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-white border-4 border-purple-100 rounded-full flex items-center justify-center text-2xl font-bold shadow-md mx-auto mb-8 text-purple-600 relative z-10 group-hover:scale-110 transition-transform">2</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Log Daily</h4>
              <p className="text-gray-600 text-lg">Interns spend 2 minutes at the end of every day logging tasks, achievements, and blockers.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-white border-4 border-emerald-100 rounded-full flex items-center justify-center text-2xl font-bold shadow-md mx-auto mb-8 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform">3</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Analyze & Grow</h4>
              <p className="text-gray-600 text-lg">Admins review aggregated analytics. Interns review their progress over time objectively.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-4 w-full">
          <div className="bg-gradient-to-br from-gray-900 via-primary-900 to-indigo-900 rounded-[2.5rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-8 text-white relative z-10 tracking-tight">Ready to transform your internship?</h2>
            <p className="text-indigo-100/80 text-xl font-medium mb-12 max-w-2xl mx-auto relative z-10">Join forward-thinking interns and managers already using InternFlow to boost productivity and oversight.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5 relative z-10">
              <Link to="/signup" className="px-10 py-5 bg-white text-primary-900 rounded-full font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:-translate-y-1">
                Get Started for Free
              </Link>
              <Link to="/login" className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-md">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Expanded Footer */}
      <footer className="bg-gray-50 pt-24 pb-12 border-t border-gray-200 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <Logo size="sm" className="mb-6 opacity-80" />
              <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">Building the definitive toolkit for modern internship programs to measure what matters.</p>
              <div className="flex gap-4">
                {/* Visual placeholders for social links */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"><span className="text-xs font-bold">X</span></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"><span className="text-xs font-bold">in</span></div>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"><span className="text-xs font-bold">GH</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Product</h4>
              <ul className="space-y-4 text-gray-500 font-medium">
                <li><a href="#features" className="hover:text-primary-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Resources</h4>
              <ul className="space-y-4 text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Internship Playbook</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4 text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary-600 transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
            <p>&copy; {new Date().getFullYear()} InternFlow Inc. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
