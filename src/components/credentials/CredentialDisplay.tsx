import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { UserCredentials, CredentialStatus } from '../../types/credentials';

interface CredentialDisplayProps {
  credentials: UserCredentials;
  status: CredentialStatus;
  onEdit: () => void;
  onDelete: () => void;
  onValidate: () => Promise<void>;
}

export const CredentialDisplay: React.FC<CredentialDisplayProps> = ({
  credentials,
  status,
  onEdit,
  onDelete,
  onValidate
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const toast = useToast();

  const maskPassword = (password: string) => {
    return '*'.repeat(Math.min(password.length, 8));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await onValidate();
      toast({
        title: 'Credentials validated successfully',
        description: 'Your msport.com credentials are working correctly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: error instanceof Error ? error.message : 'Failed to validate credentials.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusColor = () => {
    if (!status.hasCredentials) return 'gray';
    if (!status.isValidated) return 'yellow';
    return 'green';
  };

  const getStatusText = () => {
    if (!status.hasCredentials) return 'No credentials';
    if (!status.isValidated) return 'Not validated';
    return 'Validated';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box maxW="md" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">
            Msport.com Credentials
          </Text>
          <Badge colorScheme={getStatusColor()} variant="subtle">
            {getStatusText()}
          </Badge>
        </HStack>

        <Box borderWidth={1} borderRadius="lg" p={4}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>
                Username
              </Text>
              <Text fontSize="md" fontWeight="medium">
                {credentials.username}
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>
                Password
              </Text>
              <HStack>
                <Text fontSize="md" fontWeight="medium" fontFamily="mono">
                  {showPassword ? '••••••••' : maskPassword('password')}
                </Text>
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </HStack>
            </Box>

            {status.lastValidationAt && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Last Validated
                </Text>
                <Text fontSize="sm">
                  {formatDate(status.lastValidationAt)}
                </Text>
              </Box>
            )}

            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>
                Created
              </Text>
              <Text fontSize="sm">
                {formatDate(credentials.createdAt)}
              </Text>
            </Box>
          </VStack>
        </Box>

        <VStack spacing={3}>
          <Button
            leftIcon={<EditIcon />}
            colorScheme="blue"
            variant="outline"
            size="md"
            width="full"
            onClick={onEdit}
          >
            Edit Credentials
          </Button>

          <Button
            colorScheme="green"
            variant="outline"
            size="md"
            width="full"
            isLoading={isValidating}
            loadingText="Validating..."
            onClick={handleValidate}
            isDisabled={!status.hasCredentials}
          >
            Validate Credentials
          </Button>

          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            size="md"
            width="full"
            onClick={onDelete}
          >
            Delete Credentials
          </Button>
        </VStack>

        {!status.isValidated && status.hasCredentials && (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Credentials not validated</AlertTitle>
            <AlertDescription>
              Your credentials have not been validated yet. Click "Validate Credentials" to test your login.
            </AlertDescription>
          </Alert>
        )}

        {status.isValidated && (
          <Alert status="success">
            <AlertIcon />
            <AlertTitle>Credentials validated</AlertTitle>
            <AlertDescription>
              Your credentials are working correctly and automation is enabled.
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};
