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
  const { user, session, loading } = useAuthStore()

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

  if (!session || !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">
            Authentication Required
          </Text>
          <Text>Please sign in to access this page.</Text>
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
        </VStack>
      </Box>
    )
  }

  return <>{children}</>
}
