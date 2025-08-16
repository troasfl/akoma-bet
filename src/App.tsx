import React, { useEffect } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { PasswordResetRequestForm } from '@/components/auth/PasswordResetRequestForm'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { EmailVerification } from '@/components/auth/EmailVerification'
import { AuthGuard } from '@/components/auth/AuthGuard'

// Placeholder dashboard component
const Dashboard: React.FC = () => (
  <Box p={8}>
    <h1>Dashboard</h1>
    <p>Welcome to Akoma Bet!</p>
  </Box>
)

function App() {
  const { initialize, user, session } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<PasswordResetRequestForm />} />
            <Route path="/reset-password" element={<PasswordResetForm />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } 
            />
            
            {/* Default redirect */}
            <Route 
              path="/" 
              element={
                user && session ? (
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
