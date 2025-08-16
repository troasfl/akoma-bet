import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  Button,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  ChevronRightIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { Activity, ActivityType } from '../../types/dashboard';

interface RecentActivitiesListProps {
  activities: Activity[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const RecentActivitiesList: React.FC<RecentActivitiesListProps> = ({
  activities,
  isLoading = false,
  onLoadMore,
  hasMore = false
}) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getActivityConfig = (type: ActivityType) => {
    switch (type) {
      case 'bet_placed':
        return {
          color: 'blue',
          icon: '🎯',
          label: 'Bet Placed'
        };
      case 'bet_won':
        return {
          color: 'green',
          icon: '✅',
          label: 'Bet Won'
        };
      case 'bet_lost':
        return {
          color: 'red',
          icon: '❌',
          label: 'Bet Lost'
        };
      case 'automation_started':
        return {
          color: 'green',
          icon: '▶️',
          label: 'Automation Started'
        };
      case 'automation_stopped':
        return {
          color: 'red',
          icon: '⏹️',
          label: 'Automation Stopped'
        };
      case 'automation_paused':
        return {
          color: 'orange',
          icon: '⏸️',
          label: 'Automation Paused'
        };
      case 'emergency_stop':
        return {
          color: 'red',
          icon: '🚨',
          label: 'Emergency Stop'
        };
      case 'credential_added':
        return {
          color: 'blue',
          icon: '🔐',
          label: 'Credentials Added'
        };
      case 'credential_updated':
        return {
          color: 'orange',
          icon: '🔧',
          label: 'Credentials Updated'
        };
      case 'credential_deleted':
        return {
          color: 'red',
          icon: '🗑️',
          label: 'Credentials Deleted'
        };
      case 'balance_updated':
        return {
          color: 'purple',
          icon: '💰',
          label: 'Balance Updated'
        };
      default:
        return {
          color: 'gray',
          icon: '📝',
          label: 'Activity'
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    onOpen();
  };

  if (activities.length === 0 && !isLoading) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Text fontSize="lg" fontWeight="semibold">
              Recent Activities
            </Text>
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>No Activities</AlertTitle>
                <AlertDescription>
                  No activities have been recorded yet. Activities will appear here as you use the platform.
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
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
              <Text fontSize="lg" fontWeight="semibold">
                Recent Activities
              </Text>
              <Text fontSize="sm" color="gray.500">
                Last {activities.length} activities
              </Text>
            </HStack>

            <VStack spacing={2} align="stretch">
              {activities.map((activity) => {
                const config = getActivityConfig(activity.type);
                const statusColor = getStatusColor(activity.status);

                return (
                  <Box
                    key={activity.id}
                    p={3}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{
                      bg: useColorModeValue('gray.50', 'gray.700')
                    }}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <HStack justify="space-between" align="start">
                      <HStack spacing={3} align="start" flex={1}>
                        <Text fontSize="lg">{config.icon}</Text>
                        
                        <VStack align="start" spacing={1} flex={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium" fontSize="sm">
                              {activity.title}
                            </Text>
                            <Badge colorScheme={config.color} size="sm">
                              {config.label}
                            </Badge>
                            <Badge colorScheme={statusColor} size="sm">
                              {activity.status}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {activity.description}
                          </Text>
                          
                          {activity.amount && (
                            <Text fontSize="sm" fontWeight="semibold" color="green.500">
                              {formatCurrency(activity.amount, activity.currency || 'GHS')}
                            </Text>
                          )}
                        </VStack>
                      </HStack>

                      <VStack align="end" spacing={1}>
                        <HStack spacing={1} fontSize="xs" color="gray.500">
                          <TimeIcon />
                          <Text>{formatTimestamp(activity.timestamp)}</Text>
                        </HStack>
                        <IconButton
                          aria-label="View details"
                          icon={<ChevronRightIcon />}
                          size="xs"
                          variant="ghost"
                        />
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>

            {hasMore && (
              <Button
                variant="outline"
                onClick={onLoadMore}
                isLoading={isLoading}
                loadingText="Loading..."
              >
                Load More Activities
              </Button>
            )}

            {isLoading && activities.length === 0 && (
              <VStack spacing={4} py={8}>
                <Spinner size="lg" />
                <Text>Loading activities...</Text>
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Activity Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text fontSize="lg">{selectedActivity?.title}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedActivity && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Badge colorScheme={getActivityConfig(selectedActivity.type).color}>
                    {getActivityConfig(selectedActivity.type).label}
                  </Badge>
                  <Badge colorScheme={getStatusColor(selectedActivity.status)}>
                    {selectedActivity.status}
                  </Badge>
                </HStack>

                <Divider />

                <VStack align="start" spacing={2}>
                  <Text fontWeight="semibold">Description:</Text>
                  <Text>{selectedActivity.description}</Text>
                </VStack>

                {selectedActivity.amount && (
                  <>
                    <Divider />
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="semibold">Amount:</Text>
                      <Text fontSize="lg" fontWeight="bold" color="green.500">
                        {formatCurrency(selectedActivity.amount, selectedActivity.currency || 'GHS')}
                      </Text>
                    </VStack>
                  </>
                )}

                <Divider />

                <VStack align="start" spacing={2}>
                  <Text fontWeight="semibold">Timestamp:</Text>
                  <Text>{selectedActivity.timestamp.toLocaleString()}</Text>
                </VStack>

                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <>
                    <Divider />
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="semibold">Additional Information:</Text>
                      <Box
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        <pre>{JSON.stringify(selectedActivity.metadata, null, 2)}</pre>
                      </Box>
                    </VStack>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
