import { create } from 'zustand'
import { supabase } from '@/utils/supabase'
import type { AuthState, User, LoginCredentials, RegisterCredentials } from '@/types/auth'

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

// Improved error handling utility
const handleAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true, error: null })
      
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }
      
      if (session) {
        // User profile loading would be implemented here
      }
      
      set({ session, loading: false })
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_, session) => {
        set({ session })
        
        if (session?.user) {
          // User profile loading would be implemented here
        } else {
          set({ user: null })
        }
      })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  loadUserProfile: async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (userData) {
        const user: User = {
          id: userData.id,
          email: userData.email,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at),
          lastLoginAt: userData.last_login_at ? new Date(userData.last_login_at) : new Date(),
          profile: {
            firstName: userData.user_profiles?.first_name || '',
            lastName: userData.user_profiles?.last_name || '',
            timezone: userData.user_profiles?.timezone || 'UTC',
            preferredCurrency: userData.user_profiles?.preferred_currency || 'USD',
            notificationSettings: userData.user_profiles?.notification_settings || {
              emailEnabled: true,
              smsEnabled: false,
              pushEnabled: true,
              activityAlerts: true,
              securityAlerts: true
            }
          }
        }
        set({ user, error: null })
      }
    } catch (error) {
      set({ error: handleAuthError(error) })
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error
      
      set({ loading: false })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  register: async (credentials: RegisterCredentials) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            timezone: credentials.timezone || 'UTC',
            preferred_currency: credentials.preferredCurrency || 'USD'
          }
        }
      })

      if (error) throw error
      
      set({ loading: false })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      set({ user: null, session: null, loading: false })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      
      if (error) throw error
      
      set({ loading: false })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  updatePassword: async (password: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) throw error
      
      set({ loading: false })
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  updateProfile: async (profile: Partial<User['profile']>) => {
    try {
      set({ loading: true, error: null })
      
      const { user } = get()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          timezone: profile.timezone,
          preferred_currency: profile.preferredCurrency,
          notification_settings: profile.notificationSettings
        })
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      if (user.profile) {
        const updatedUser = {
          ...user,
          profile: { ...user.profile, ...profile }
        }
        set({ user: updatedUser, loading: false })
      }
    } catch (error) {
      set({ error: handleAuthError(error), loading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  }
}))
