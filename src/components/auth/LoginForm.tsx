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
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials } from '@/types/auth'

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>()
  const { login, loading, error, clearError } = useAuthStore()
  const toast = useToast()
  const navigate = useNavigate()

  const onSubmit = async (data: LoginCredentials) => {
    clearError()
    try {
      await login(data)
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // Navigate to dashboard after successful login
      navigate('/dashboard')
    } catch (err) {
      toast({
        title: 'Login failed',
        description: error || 'Invalid email or password.',
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
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            Sign In
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

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', {
                required: 'Password is required'
              })}
              placeholder="Enter your password"
            />
            {errors.password && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.password.message}
              </Text>
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={loading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>

          <Text fontSize="sm" textAlign="center">
            Don't have an account?{' '}
            <Link color="blue.500" href="/register">
              Sign up here
            </Link>
          </Text>

          <Text fontSize="sm" textAlign="center">
            <Link color="blue.500" href="/forgot-password">
              Forgot your password?
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  )
}
