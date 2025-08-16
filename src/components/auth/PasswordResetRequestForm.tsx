import React from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Link
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import type { PasswordResetRequest } from '@/types/auth'

export const PasswordResetRequestForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordResetRequest>()
  const { resetPassword, loading, error, clearError } = useAuthStore()
  const toast = useToast()

  const onSubmit = async (data: PasswordResetRequest) => {
    clearError()
    try {
      await resetPassword(data.email)
      toast({
        title: 'Reset email sent',
        description: 'Please check your email for password reset instructions.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to send reset email',
        description: error || 'An error occurred while sending the reset email.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold">
            Reset Password
          </Text>

          <Text fontSize="sm" textAlign="center" color="gray.600">
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="Enter your email"
            />
            {errors.email && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.email.message}
              </Text>
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={loading}
            loadingText="Sending reset email..."
          >
            Send Reset Email
          </Button>

          <Text fontSize="sm" textAlign="center">
            Remember your password?{' '}
            <Link color="blue.500" href="/login">
              Sign in here
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  )
}
