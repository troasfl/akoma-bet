import React from 'react'
import { Box, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuthStore } from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  requireVerification?: boolean
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireVerification = true 
}) => {
  const { session, loading } = useAuthStore()

  // Debug logging
  console.log('AuthGuard - loading:', loading)
  console.log('AuthGuard - session:', session)
  console.log('AuthGuard - email_confirmed_at:', session?.user?.email_confirmed_at)
  console.log('AuthGuard - requireVerification:', requireVerification)

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Loading...</Text>
        </VStack>
      </Box>
    )
  }

  if (!session) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">
            Authentication Required
          </Text>
          <Text>Please sign in to access this page.</Text>
          <Text fontSize="sm" color="gray.500">
            Debug: No session found
          </Text>
        </VStack>
      </Box>
    )
  }

  if (requireVerification && !session.user.email_confirmed_at) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">
            Email Verification Required
          </Text>
          <Text>Please verify your email address to access this page.</Text>
          <Text fontSize="sm" color="gray.500">
            Email: {session.user.email}
          </Text>
        </VStack>
      </Box>
    )
  }

  return <>{children}</>
}
