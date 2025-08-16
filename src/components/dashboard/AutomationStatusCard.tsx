import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
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
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useToast
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { AutomationStatus } from '../../types/dashboard';

interface AutomationStatusCardProps {
  status: AutomationStatus;
  isLoading?: boolean;
  onStatusChange?: (status: 'active' | 'paused' | 'stopped', reason?: string) => Promise<void>;
  hasCredentials?: boolean;
}

export const AutomationStatusCard: React.FC<AutomationStatusCardProps> = ({
  status,
  isLoading = false,
  onStatusChange,
  hasCredentials = false
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingAction, setPendingAction] = useState<'start' | 'pause' | 'stop' | null>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getStatusConfig = () => {
    switch (status.status) {
      case 'active':
        return {
          color: 'green',
          icon: CheckCircleIcon,
          text: 'Active',
          description: 'Automation is running and placing bets'
        };
      case 'paused':
        return {
          color: 'orange',
          icon: TimeIcon,
          text: 'Paused',
          description: 'Automation is paused and not placing bets'
        };
      case 'stopped':
        return {
          color: 'red',
          icon: TimeIcon,
          text: 'Stopped',
          description: 'Automation is stopped and not placing bets'
        };
      default:
        return {
          color: 'gray',
          icon: TimeIcon,
          text: 'Unknown',
          description: 'Automation status is unknown'
        };
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'stopped') => {
    if (!onStatusChange) return;

    if (newStatus === 'stopped') {
      // For stop, always ask for reason
      setPendingAction('stop');
      onOpen();
    } else if (newStatus === 'paused') {
      // For pause, optionally ask for reason
      setPendingAction('pause');
      onOpen();
    } else {
      // For start, no reason needed
      try {
        setIsSubmitting(true);
        await onStatusChange(newStatus);
        toast({
          title: 'Automation Started',
          description: 'Your automation has been started successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Failed to Start Automation',
          description: error instanceof Error ? error.message : 'An error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction || !onStatusChange) return;

    try {
      setIsSubmitting(true);
      await onStatusChange(pendingAction === 'stop' ? 'stopped' : 'paused', reason || undefined);
      
      toast({
        title: `Automation ${pendingAction === 'stop' ? 'Stopped' : 'Paused'}`,
        description: `Your automation has been ${pendingAction === 'stop' ? 'stopped' : 'paused'} successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
      setReason('');
      setPendingAction(null);
    } catch (error) {
      toast({
        title: `Failed to ${pendingAction === 'stop' ? 'Stop' : 'Pause'} Automation`,
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = getStatusConfig();

  if (!hasCredentials) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>No Credentials</AlertTitle>
              <AlertDescription>
                Add your msport.com credentials to enable automation.
              </AlertDescription>
            </Box>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="semibold">
                  Automation Status
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme={config.color} size="lg">
                    <HStack spacing={1}>
                      <Box as={config.icon} />
                      <Text>{config.text}</Text>
                    </HStack>
                  </Badge>
                  {status.isEmergencyStopped && (
                    <Badge colorScheme="red">
                      Emergency Stop
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>

            <Text color="gray.600" fontSize="sm">
              {config.description}
            </Text>

            {status.reason && (
              <Alert status="info" size="sm">
                <AlertIcon />
                <Box>
                  <AlertTitle>Reason</AlertTitle>
                  <AlertDescription>{status.reason}</AlertDescription>
                </Box>
              </Alert>
            )}

            {status.isEmergencyStopped && status.emergencyStopReason && (
              <Alert status="error" size="sm">
                <AlertIcon />
                <Box>
                  <AlertTitle>Emergency Stop</AlertTitle>
                  <AlertDescription>
                    {status.emergencyStopReason}
                    {status.emergencyStopTimestamp && (
                      <Text fontSize="xs" mt={1}>
                        Stopped at: {status.emergencyStopTimestamp.toLocaleString()}
                      </Text>
                    )}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <HStack spacing={2} mt={2}>
              {status.canStart && (
                <Button
                  colorScheme="green"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  isLoading={isSubmitting}
                  isDisabled={isLoading}
                >
                  Start
                </Button>
              )}
              
              {status.canPause && (
                <Button
                  colorScheme="orange"
                  size="sm"
                  onClick={() => handleStatusChange('paused')}
                  isLoading={isSubmitting}
                  isDisabled={isLoading}
                >
                  Pause
                </Button>
              )}
              
              {status.canStop && (
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => handleStatusChange('stopped')}
                  isLoading={isSubmitting}
                  isDisabled={isLoading}
                >
                  Stop
                </Button>
              )}
            </HStack>

            <HStack spacing={2} fontSize="sm" color="gray.500">
              <TimeIcon />
              <Text>
                Last changed: {status.lastChanged.toLocaleString()}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Status Change Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {pendingAction === 'stop' ? 'Stop Automation' : 'Pause Automation'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Confirm Action</AlertTitle>
                  <AlertDescription>
                    Are you sure you want to {pendingAction === 'stop' ? 'stop' : 'pause'} the automation?
                    {pendingAction === 'stop' && ' This will immediately stop all betting activities.'}
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel>Reason (Optional)</FormLabel>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Enter reason for ${pendingAction === 'stop' ? 'stopping' : 'pausing'} automation...`}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme={pendingAction === 'stop' ? 'red' : 'orange'}
              onClick={handleConfirmStatusChange}
              isLoading={isSubmitting}
            >
              {pendingAction === 'stop' ? 'Stop' : 'Pause'} Automation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
