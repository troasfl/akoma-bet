import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Button,
  useToast,
  Spinner
} from '@chakra-ui/react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/utils/supabase'

export const EmailVerification: React.FC = () => {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuthStore()
  const toast = useToast()

  useEffect(() => {
    const handleEmailVerification = async () => {
      setVerifying(true)
      setError(null)

      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (data.session?.user.email_confirmed_at) {
          setVerified(true)
          toast({
            title: 'Email verified',
            description: 'Your email has been successfully verified.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        } else {
          setError('Email not verified. Please check your email and click the verification link.')
        }
      } catch (err) {
        setError((err as Error).message)
        toast({
          title: 'Verification failed',
          description: (err as Error).message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setVerifying(false)
      }
    }

    if (session) {
      handleEmailVerification()
    }
  }, [session, toast])

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session?.user.email || ''
      })

      if (error) throw error

      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to send verification email',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  if (verifying) {
    return (
      <Box maxW="md" mx="auto" mt={8}>
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Verifying your email...</Text>
        </VStack>
      </Box>
    )
  }

  if (verified) {
    return (
      <Box maxW="md" mx="auto" mt={8}>
        <VStack spacing={4}>
          <Alert status="success">
            <AlertIcon />
            Your email has been verified successfully!
          </Alert>
          <Text>You can now access all features of the platform.</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Email Verification Required
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Text fontSize="sm" textAlign="center" color="gray.600">
          Please check your email and click the verification link to activate your account.
        </Text>

        <Button
          onClick={handleResendVerification}
          colorScheme="blue"
          size="lg"
          width="full"
        >
          Resend Verification Email
        </Button>

        <Text fontSize="sm" textAlign="center" color="gray.500">
          Didn't receive the email? Check your spam folder or try resending.
        </Text>
      </VStack>
    </Box>
  )
}
