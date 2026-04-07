import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateAdmin() {
  console.log('Updating samadshaikh1825@gmail.com to admin + approved...')
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin', status: 'approved' })
    .eq('email', 'samadshaikh1825@gmail.com')
    .select()
    
  if (error) {
    console.error('Error updating user:', error)
  } else {
    console.log('User updated successfully:', data)
  }
}

updateAdmin()
