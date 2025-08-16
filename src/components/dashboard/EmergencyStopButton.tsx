import React, { useState } from 'react';
import {
  Box,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Textarea,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { EmergencyStopRequest } from '../../types/dashboard';

interface EmergencyStopButtonProps {
  onEmergencyStop?: (request: EmergencyStopRequest) => Promise<void>;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
}

export const EmergencyStopButton: React.FC<EmergencyStopButtonProps> = ({
  onEmergencyStop,
  isDisabled = false,
  size = 'lg',
  variant = 'solid'
}) => {
  const [reason, setReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('red.500', 'red.600');
  const hoverBgColor = useColorModeValue('red.600', 'red.700');

  const handleEmergencyStop = async () => {
    if (!onEmergencyStop) return;

    try {
      setIsSubmitting(true);
      
      const request: EmergencyStopRequest = {
        reason: reason || 'Emergency stop activated by user',
        immediate: true,
        notifyUser
      };

      await onEmergencyStop(request);

      toast({
        title: 'Emergency Stop Activated',
        description: 'All automation has been immediately stopped.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      setReason('');
      setNotifyUser(true);
    } catch (error) {
      toast({
        title: 'Emergency Stop Failed',
        description: error instanceof Error ? error.message : 'An error occurred during emergency stop',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        leftIcon={<WarningIcon />}
        colorScheme="red"
        size={size}
        variant={variant}
        onClick={onOpen}
        isDisabled={isDisabled}
        bg={variant === 'solid' ? bgColor : undefined}
        _hover={{
          bg: variant === 'solid' ? hoverBgColor : undefined
        }}
        boxShadow="lg"
        _active={{
          transform: 'scale(0.95)'
        }}
      >
        EMERGENCY STOP
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <WarningIcon color="red.500" />
              <Text>Emergency Stop</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>Warning: Emergency Stop</AlertTitle>
                  <AlertDescription>
                    This will immediately stop all automation and betting activities. 
                    This action cannot be undone and will require manual intervention to restart.
                  </AlertDescription>
                </Box>
              </Alert>

              <VStack spacing={4} align="start">
                <Text fontWeight="semibold">What will happen:</Text>
                <VStack spacing={2} align="start" fontSize="sm" color="gray.600">
                  <Text>• All active betting automation will be immediately stopped</Text>
                  <Text>• No new bets will be placed</Text>
                  <Text>• Current automation status will be set to "Stopped"</Text>
                  <Text>• An emergency stop record will be logged</Text>
                  <Text>• You will need to manually restart automation when ready</Text>
                </VStack>
              </VStack>

              <FormControl>
                <FormLabel>Reason for Emergency Stop (Optional)</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for emergency stop..."
                  rows={3}
                />
              </FormControl>

              <Checkbox
                isChecked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
              >
                Send notification about this emergency stop
              </Checkbox>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              leftIcon={<WarningIcon />}
              onClick={handleEmergencyStop}
              isLoading={isSubmitting}
            >
              Activate Emergency Stop
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
