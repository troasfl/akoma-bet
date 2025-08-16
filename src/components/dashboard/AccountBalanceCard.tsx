import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { RepeatIcon, InfoIcon } from '@chakra-ui/icons';
import { AccountBalance } from '../../types/dashboard';

interface AccountBalanceCardProps {
  balance: AccountBalance | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  hasCredentials?: boolean;
}

export const AccountBalanceCard: React.FC<AccountBalanceCardProps> = ({
  balance,
  isLoading = false,
  onRefresh,
  hasCredentials = false
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 1000) return 'green';
    if (amount > 100) return 'blue';
    return 'orange';
  };

  const getStalenessIndicator = (lastUpdated: Date) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    
    if (diffInMinutes > 60) return { color: 'red', text: 'Stale' };
    if (diffInMinutes > 30) return { color: 'orange', text: 'Old' };
    return { color: 'green', text: 'Fresh' };
  };

  if (!hasCredentials) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>No Credentials</AlertTitle>
              <AlertDescription>
                Add your msport.com credentials to view your account balance.
              </AlertDescription>
            </Box>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <Text fontSize="lg" fontWeight="semibold">
                Account Balance
              </Text>
              <IconButton
                aria-label="Refresh balance"
                icon={<RepeatIcon />}
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                isLoading={isLoading}
              />
            </HStack>
            <Text color="gray.500" fontSize="sm">
              Unable to fetch balance. Please try refreshing.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const staleness = getStalenessIndicator(balance.lastUpdated);
  const balanceColor = getBalanceColor(balance.amount);

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="semibold">
                Account Balance
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={balance.source === 'msport' ? 'blue' : 'gray'}>
                  {balance.source === 'msport' ? 'Msport.com' : 'Manual'}
                </Badge>
                <Badge colorScheme={staleness.color}>
                  {staleness.text}
                </Badge>
              </HStack>
            </VStack>
            
            <IconButton
              aria-label="Refresh balance"
              icon={<RepeatIcon />}
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              isLoading={isLoading}
            />
          </HStack>

          <Box>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color={`${balanceColor}.500`}
            >
              {formatCurrency(balance.amount, balance.currency)}
            </Text>
            
            <HStack spacing={2} mt={2}>
              <Text fontSize="sm" color="gray.500">
                Last updated:
              </Text>
              <Text fontSize="sm" color="gray.600">
                {balance.lastUpdated.toLocaleString()}
              </Text>
            </HStack>
          </Box>

          {balance.isStale && (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <Box>
                <AlertTitle>Balance may be outdated</AlertTitle>
                <AlertDescription>
                  Click refresh to get the latest balance from msport.com
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <HStack spacing={2} fontSize="sm" color="gray.500">
            <InfoIcon />
            <Text>
              Balance is automatically refreshed every 30 minutes
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};
