import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)
  const [status, setStatus] = useState(null) // 'pending' | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAndSyncMetadata(session.user).then(() => {
          fetchProfile(session.user.id)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAndSyncMetadata(session.user).then(() => {
          fetchProfile(session.user.id)
        })
      } else {
        setRole(null)
        setStatus(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAndSyncMetadata = async (sessionUser) => {
    try {
      const { requested_role, full_name } = sessionUser.user_metadata || {}
      if (requested_role) {
        // Fire-and-forget update to ensure DB has what was requested during signup.
        // It updates only if it's currently null to prevent overriding any admin changes.
        await supabase
          .from('users')
          .update({ requested_role, full_name })
          .eq('id', sessionUser.id)
          .is('requested_role', null)
      }
    } catch (err) {
      console.error('Failed to sync metadata', err)
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, status, email')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = no row found — auth account exists but never went through signup
        if (error.code === 'PGRST116') {
          setRole(null)
          setStatus('no_profile')   // triggers Login to show "Please sign up first"
          await supabase.auth.signOut()
          return
        }
        throw error
      }

      const fetchedStatus = data?.status || 'pending'
      const fetchedRole   = data?.role   || 'intern'

      setRole(fetchedRole)
      setStatus(fetchedStatus)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setRole(null)
      setStatus('pending')
    } finally {
      setLoading(false)
    }
  }

  // Call this to manually re-check role/status (used by PendingApproval page)
  const refreshProfile = () => {
    if (user?.id) fetchProfile(user.id)
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, role, status, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
