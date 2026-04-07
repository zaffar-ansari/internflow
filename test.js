import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ljztbglauyitstrgnwdj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqenRiZ2xhdXlpdHN0cmdud2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDI2MDcsImV4cCI6MjA5MTExODYwN30.eR069zv0xtgKNAPqxzWA5z6Z3JSrPslgbqDFt78aNRk'
)

async function test() {
  const email = `test.depthead${Date.now()}@gmail.com`
  console.log('Signing up:', email)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { full_name: 'Test Dept Head' } }
  })
  
  if (authError) {
    console.error('Auth Error:', authError)
    return
  }
  
  console.log('Auth Success! User ID:', authData.user.id)
  
  const { error: dbError } = await supabase
    .from('users')
    .upsert({
      id: authData.user.id,
      email,
      full_name: 'Test Dept Head',
      role: 'intern',
      requested_role: 'dept_head',
      status: 'pending',
    })
    
  if (dbError) {
    console.error('DB Error:', dbError)
  } else {
    console.log('DB Upsert Success!')
  }
}

test()
