import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Logo from '../components/ui/Logo'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error

      setShowSuccess(true)
    } catch (error) {
      setError(error.message || 'Failed to sign up')
      toast.error(error.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 py-12">
      <div className="absolute top-6 left-6">
        <Link to="/"><Logo size="sm" /></Link>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <GlassCard className="p-8 shadow-2xl relative overflow-hidden">
          {showSuccess ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
                <Mail className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 font-heading tracking-tight">Verify Your Email</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We've sent a verification link to <span className="font-semibold text-primary-700">{email}</span>. 
                Please check your inbox and click the link to activate your account.
              </p>
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-md active:scale-95"
                >
                  Back to Login
                </Link>
                <p className="text-xs text-gray-400">
                  Didn't receive the email? Check your spam folder.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2 tracking-tight">Join Intern<span className="text-primary-600">~</span>Flow</h2>
                <p className="text-gray-500">Create your intern account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... existing form fields ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 w-full rounded-xl border border-gray-200 bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 w-full rounded-xl border bg-white/50 focus:bg-white p-3 text-sm focus:ring-2 focus:border-transparent transition-all outline-none ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-primary-500'
                        }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 mt-6"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      Create Account <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm font-medium text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-800 transition-colors">
                  Log in
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
