import React, { useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { AddIcon, SettingsIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useCredentialStore } from '../../stores/credentialStore';
import { CredentialInputForm } from '../credentials/CredentialInputForm';
import { CredentialDisplay } from '../credentials/CredentialDisplay';
import { CredentialDeleteDialog } from '../credentials/CredentialDeleteDialog';
import { CredentialStatusIndicator } from '../credentials/CredentialStatusIndicator';
import { CredentialInput } from '../../types/credentials';

interface CredentialDashboardProps {
  onCredentialChange?: (hasCredentials: boolean) => void;
}

export const CredentialDashboard: React.FC<CredentialDashboardProps> = ({
  onCredentialChange
}) => {
  const toast = useToast();
  const {
    credentials,
    status,
    loading,
    error,
    isValidating,
    addCredentials,

    deleteCredentials,
    loadCredentials,
    validateCredentials,
    clearError
  } = useCredentialStore();

  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose
  } = useDisclosure();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose
  } = useDisclosure();



  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  useEffect(() => {
    if (onCredentialChange) {
      onCredentialChange(status.hasCredentials);
    }
  }, [status.hasCredentials, onCredentialChange]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleAddCredentials = async (input: CredentialInput) => {
    try {
      // In a real implementation, you would get the master key from user input
      // For now, we'll use a placeholder
      const tempMasterKey = 'temp-master-key-32-chars-long-12345';
      
      await addCredentials(input, tempMasterKey);
      
      toast({
        title: 'Credentials Added',
        description: 'Your credentials have been securely stored.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onAddModalClose();
    } catch (error) {
      toast({
        title: 'Failed to Add Credentials',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };



  const handleDeleteCredentials = async () => {
    try {
      await deleteCredentials();
      
      toast({
        title: 'Credentials Removed',
        description: 'Your credentials have been removed from your account.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteModalClose();
    } catch (error) {
      toast({
        title: 'Failed to Remove Credentials',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleValidateCredentials = async () => {
    try {
      const tempMasterKey = 'temp-master-key-32-chars-long-12345';
      const result = await validateCredentials(tempMasterKey);
      
      if (result.isValid) {
        toast({
          title: 'Validation Successful',
          description: 'Your credentials are working correctly.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: result.error || 'Unable to validate credentials',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'An error occurred during validation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = () => {
    if (!status.hasCredentials) return 'gray';
    if (status.isValidated) return 'green';
    return 'orange';
  };

  const getStatusText = () => {
    if (!status.hasCredentials) return 'No Credentials';
    if (status.isValidated) return 'Validated';
    return 'Needs Validation';
  };

  const getStatusIcon = () => {
    if (!status.hasCredentials) return WarningIcon;
    if (status.isValidated) return CheckCircleIcon;
    return WarningIcon;
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Loading credentials...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Credential Management</Heading>
            <Text color="gray.600">
              Manage your msport.com credentials for automated betting
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <CredentialStatusIndicator status={status} showDetails={false} />
            {!status.hasCredentials && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={onAddModalOpen}
              >
                Add Credentials
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Status Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="full"
                  bg={`${getStatusColor()}.100`}
                  color={`${getStatusColor()}.600`}
                >
                  <Box as={getStatusIcon()} boxSize={6} />
                </Box>
                <Text fontWeight="semibold">Status</Text>
                <Text fontSize="sm" color="gray.600">
                  {getStatusText()}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="full"
                  bg={status.isAutomationEnabled ? 'green.100' : 'gray.100'}
                  color={status.isAutomationEnabled ? 'green.600' : 'gray.600'}
                >
                  <Box as={status.isAutomationEnabled ? CheckCircleIcon : WarningIcon} boxSize={6} />
                </Box>
                <Text fontWeight="semibold">Automation</Text>
                <Text fontSize="sm" color="gray.600">
                  {status.isAutomationEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="full"
                  bg="blue.100"
                  color="blue.600"
                >
                  <Box as={SettingsIcon} boxSize={6} />
                </Box>
                <Text fontWeight="semibold">Last Validation</Text>
                <Text fontSize="sm" color="gray.600">
                  {status.lastValidationAt 
                    ? status.lastValidationAt.toLocaleDateString()
                    : 'Never'
                  }
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Credential Display or Add Prompt */}
        {status.hasCredentials && credentials ? (
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Your Credentials</Heading>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleValidateCredentials}
                    isLoading={isValidating}
                    loadingText="Validating"
                  >
                    Validate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {}}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={onDeleteModalOpen}
                  >
                    Remove
                  </Button>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <CredentialDisplay
                credentials={credentials}
                status={status}
                onEdit={() => {}}
                onDelete={onDeleteModalOpen}
                onValidate={handleValidateCredentials}
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <VStack spacing={4} textAlign="center" py={8}>
                <Box
                  p={4}
                  borderRadius="full"
                  bg="gray.100"
                  color="gray.600"
                >
                  <Box as={WarningIcon} boxSize={8} />
                </Box>
                <VStack spacing={2}>
                  <Heading size="md">No Credentials Added</Heading>
                  <Text color="gray.600" maxW="md">
                    Add your msport.com credentials to enable automated betting features. 
                    Your credentials will be encrypted and stored securely.
                  </Text>
                </VStack>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={onAddModalOpen}
                >
                  Add Credentials
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Security Notice */}
        <Alert status="info" borderRadius="md">
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

      {/* Add Credentials Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Msport.com Credentials</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <CredentialInputForm
              onSubmit={handleAddCredentials}
              isLoading={loading}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CredentialDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={handleDeleteCredentials}
        isLoading={loading}
      />
    </Box>
  );
};
