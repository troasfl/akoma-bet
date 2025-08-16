import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { useRef } from 'react';

interface CredentialDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const CredentialDeleteDialog: React.FC<CredentialDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Failed to delete credentials:', error);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Credentials
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Are you sure you want to delete your msport.com credentials? This action cannot be undone.
              </Text>
              
              <Alert status="warning">
                <AlertIcon />
                <AlertTitle>Warning!</AlertTitle>
                <AlertDescription>
                  Deleting your credentials will immediately disable all automated betting features.
                  You will need to re-enter your credentials to re-enable automation.
                </AlertDescription>
              </Alert>

              <Text fontSize="sm" color="gray.600">
                This will:
              </Text>
              <Text fontSize="sm" color="gray.600" pl={4}>
                • Remove your encrypted credentials from our secure storage
              </Text>
              <Text fontSize="sm" color="gray.600" pl={4}>
                • Disable all automated betting activities
              </Text>
              <Text fontSize="sm" color="gray.600" pl={4}>
                • Require re-validation when you add new credentials
              </Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleConfirm}
              ml={3}
              isLoading={isLoading}
              loadingText="Deleting..."
            >
              Delete Credentials
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
