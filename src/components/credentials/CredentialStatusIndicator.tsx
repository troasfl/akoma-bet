import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { CredentialStatus } from '../../types/credentials';

interface CredentialStatusIndicatorProps {
  status: CredentialStatus;
  showDetails?: boolean;
}

export const CredentialStatusIndicator: React.FC<CredentialStatusIndicatorProps> = ({
  status,
  showDetails = false
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getStatusConfig = () => {
    if (!status.hasCredentials) {
      return {
        icon: InfoIcon,
        color: 'gray',
        text: 'No Credentials',
        description: 'No msport.com credentials stored',
        badgeColor: 'gray'
      };
    }

    if (!status.isValidated) {
      return {
        icon: WarningIcon,
        color: 'yellow',
        text: 'Not Validated',
        description: 'Credentials stored but not validated',
        badgeColor: 'yellow'
      };
    }

    return {
      icon: CheckCircleIcon,
      color: 'green',
      text: 'Validated',
      description: 'Credentials validated and automation enabled',
      badgeColor: 'green'
    };
  };

  const config = getStatusConfig();

  const formatLastValidation = () => {
    if (!status.lastValidationAt) return 'Never';
    return new Date(status.lastValidationAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      bg={bgColor}
      shadow="sm"
    >
      <HStack spacing={3} align="center">
        <Icon
          as={config.icon}
          color={`${config.color}.500`}
          boxSize={5}
        />
        
        <VStack align="start" spacing={1} flex={1}>
          <HStack spacing={2}>
            <Text fontSize="sm" fontWeight="medium">
              Msport.com Credentials
            </Text>
            <Badge colorScheme={config.badgeColor} variant="subtle" size="sm">
              {config.text}
            </Badge>
          </HStack>
          
          {showDetails && (
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color="gray.600">
                {config.description}
              </Text>
              
              {status.hasCredentials && (
                <Text fontSize="xs" color="gray.600">
                  Last validated: {formatLastValidation()}
                </Text>
              )}
              
              <Text fontSize="xs" color="gray.600">
                Automation: {status.isAutomationEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </VStack>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

// Compact version for use in headers or sidebars
export const CompactCredentialStatusIndicator: React.FC<CredentialStatusIndicatorProps> = ({
  status
}) => {
  const getStatusConfig = () => {
    if (!status.hasCredentials) {
      return {
        icon: InfoIcon,
        color: 'gray',
        text: 'No Credentials',
        description: 'No msport.com credentials stored',
        badgeColor: 'gray'
      };
    }

    if (!status.isValidated) {
      return {
        icon: WarningIcon,
        color: 'yellow',
        text: 'Not Validated',
        description: 'Credentials stored but not validated',
        badgeColor: 'yellow'
      };
    }

    return {
      icon: CheckCircleIcon,
      color: 'green',
      text: 'Validated',
      description: 'Credentials validated and automation enabled',
      badgeColor: 'green'
    };
  };

  const config = getStatusConfig();

  return (
    <Tooltip
      label={config.description}
      placement="top"
      hasArrow
    >
      <HStack spacing={2} cursor="pointer">
        <Icon
          as={config.icon}
          color={`${config.color}.500`}
          boxSize={4}
        />
        <Badge colorScheme={config.badgeColor} variant="subtle" size="sm">
          {config.text}
        </Badge>
      </HStack>
    </Tooltip>
  );
};
