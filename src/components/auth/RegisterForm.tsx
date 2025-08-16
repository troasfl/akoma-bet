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
  Select
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import type { RegisterCredentials } from '@/types/auth'

export const RegisterForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterCredentials>()
  const { register: registerUser, loading, error, clearError } = useAuthStore()
  const toast = useToast()

  const password = watch('password')

  const onSubmit = async (data: RegisterCredentials) => {
    clearError()
    try {
      await registerUser(data)
      toast({
        title: 'Registration successful',
        description: 'Please check your email to verify your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: error || 'An error occurred during registration.',
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
            Create Account
          </Text>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel>First Name</FormLabel>
            <Input
              {...register('firstName', {
                required: 'First name is required',
                minLength: { value: 2, message: 'First name must be at least 2 characters' }
              })}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.firstName.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.lastName}>
            <FormLabel>Last Name</FormLabel>
            <Input
              {...register('lastName', {
                required: 'Last name is required',
                minLength: { value: 2, message: 'Last name must be at least 2 characters' }
              })}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.lastName.message}
              </Text>
            )}
          </FormControl>

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
                required: 'Password is required',
                minLength: { value: 12, message: 'Password must be at least 12 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
                  message: 'Password must contain uppercase, lowercase, number, and symbol'
                }
              })}
              placeholder="Enter your password"
            />
            {errors.password && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.password.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.timezone}>
            <FormLabel>Timezone</FormLabel>
            <Select
              {...register('timezone')}
              placeholder="Select timezone"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </Select>
          </FormControl>

          <FormControl isInvalid={!!errors.preferredCurrency}>
            <FormLabel>Preferred Currency</FormLabel>
            <Select
              {...register('preferredCurrency')}
              placeholder="Select currency"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </Select>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={loading}
            loadingText="Creating account..."
          >
            Create Account
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
