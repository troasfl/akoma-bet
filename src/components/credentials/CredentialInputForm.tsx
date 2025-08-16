import React from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { CredentialInput } from '../../types/credentials';

interface CredentialInputFormProps {
  onSubmit: (credentials: CredentialInput) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const CredentialInputForm: React.FC<CredentialInputFormProps> = ({
  onSubmit,
  isLoading = false,
  error
}) => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<CredentialInput>({
    mode: 'onChange'
  });

  const onFormSubmit = async (data: CredentialInput) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Credentials saved successfully',
        description: 'Your msport.com credentials have been securely stored.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      reset();
    } catch (err) {
      toast({
        title: 'Failed to save credentials',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="bold" textAlign="center">
          Add Msport.com Credentials
        </Text>
        
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Enter your msport.com login credentials to enable automated betting.
          Your password will be encrypted before storage.
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.username}>
              <FormLabel htmlFor="username">Username</FormLabel>
              <Input
                id="username"
                type="text"
                placeholder="Enter your msport.com username"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Username must be less than 50 characters'
                  }
                })}
              />
              <FormErrorMessage>
                {errors.username?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                id="password"
                type="password"
                placeholder="Enter your msport.com password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              <FormErrorMessage>
                {errors.password?.message}
              </FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              isLoading={isLoading}
              loadingText="Saving credentials..."
              isDisabled={!isValid || isLoading}
            >
              Save Credentials
            </Button>
          </VStack>
        </form>

        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your credentials are encrypted using AES-256 encryption before being stored.
              We will validate your credentials by performing a test login to ensure they work correctly.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};
