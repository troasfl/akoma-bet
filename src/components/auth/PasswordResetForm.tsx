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
  useToast
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/stores/authStore'
import type { PasswordReset } from '@/types/auth'

export const PasswordResetForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PasswordReset>()
  const { updatePassword, loading, error, clearError } = useAuthStore()
  const toast = useToast()

  const password = watch('password')

  const onSubmit = async (data: PasswordReset) => {
    clearError()
    try {
      await updatePassword(data.password)
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Failed to update password',
        description: error || 'An error occurred while updating your password.',
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
            Set New Password
          </Text>

          <Text fontSize="sm" textAlign="center" color="gray.600">
            Enter your new password below.
          </Text>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>New Password</FormLabel>
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
              placeholder="Enter your new password"
            />
            {errors.password && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.password.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
            isLoading={loading}
            loadingText="Updating password..."
          >
            Update Password
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
