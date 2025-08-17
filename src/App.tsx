import { useEffect } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { PasswordResetRequestForm } from '@/components/auth/PasswordResetRequestForm'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { EmailVerification } from '@/components/auth/EmailVerification'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

function App() {
  const { initialize, session, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Show a loading state while initializing auth
  if (loading) {
    return (
      <ChakraProvider>
        <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
          Loading...
        </Box>
      </ChakraProvider>
    )
  }

  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh">
          <Routes>
            {/* Public routes - redirect to dashboard if already authenticated */}
            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
            />
            <Route 
              path="/register" 
              element={session ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
            />
            <Route path="/forgot-password" element={<PasswordResetRequestForm />} />
            <Route path="/reset-password" element={<PasswordResetForm />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard requireVerification={false}>
                  <DashboardPage />
                </AuthGuard>
              } 
            />
            
            {/* Default redirect */}
            <Route 
              path="/" 
              element={
                session ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App
