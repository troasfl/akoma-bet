import { createClient } from '@supabase/supabase-js'

// Remote Supabase project for akoma-bet
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://npjqmaxuqnkonhgnhbso.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wanFtYXh1cW5rb25oZ25oYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODQ3MzksImV4cCI6MjA3MDk2MDczOX0.uEV6XZNedyDReNQdV-pkMc6Aca90uHKBK6uTsrUW6ao'

// Debug logging for development
console.log('Supabase URL:', supabaseUrl)
console.log('Environment VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)

// Ensure we have valid values
if (!supabaseUrl || supabaseUrl === 'undefined') {
  throw new Error('Supabase URL is not configured')
}

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  throw new Error('Supabase anon key is not configured')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
