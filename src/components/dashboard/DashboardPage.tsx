import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  SimpleGrid,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useInterval
} from '@chakra-ui/react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AccountBalanceCard } from './AccountBalanceCard';
import { AutomationStatusCard } from './AutomationStatusCard';
import { EmergencyStopButton } from './EmergencyStopButton';
import { RecentActivitiesList } from './RecentActivitiesList';
import { useDashboardStore } from '../../stores/dashboardStore';
import { useCredentialStore } from '../../stores/credentialStore';
import { dashboardService } from '../../services/dashboardService';

export const DashboardPage: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  
  const {
    accountBalance,
    automationStatus,
    recentActivities,
    isLoading,
    error,
    lastUpdated,
    loadDashboard,
    refreshBalance,
    updateAutomationStatus,
    emergencyStop,
    loadActivities
  } = useDashboardStore();

  const { status: credentialStatus } = useCredentialStore();

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboard();
    loadStats();
  }, [loadDashboard]);

  // Auto-refresh balance every 30 seconds if auto-refresh is enabled
  useInterval(() => {
    if (credentialStatus.hasCredentials && credentialStatus.isValidated) {
      refreshBalance();
    }
  }, 30000); // 30 seconds

  const loadStats = async () => {
    try {
      const dashboardStats = await dashboardService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
      toast({
        title: 'Balance Refreshed',
        description: 'Your account balance has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to Refresh Balance',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAutomationStatusChange = async (
    status: 'active' | 'paused' | 'stopped',
    reason?: string
  ) => {
    try {
      await updateAutomationStatus(status, reason);
    } catch (error) {
      toast({
        title: 'Failed to Update Automation Status',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEmergencyStop = async (request: any) => {
    try {
      await emergencyStop(request);
      toast({
        title: 'Emergency Stop Activated',
        description: 'All automation has been immediately stopped.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Emergency Stop Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLoadMoreActivities = async () => {
    try {
      await loadActivities(20); // Load 20 more activities
    } catch (error) {
      toast({
        title: 'Failed to Load Activities',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading && !accountBalance && recentActivities.length === 0) {
    return (
      <DashboardLayout title="Dashboard">
        <VStack spacing={8} py={12}>
          <Spinner size="xl" />
          <Text>Loading dashboard...</Text>
        </VStack>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <VStack spacing={6} align="stretch">
        {/* Emergency Stop Button - Prominently displayed */}
        <Box textAlign="center" py={4}>
          <EmergencyStopButton
            onEmergencyStop={handleEmergencyStop}
            isDisabled={automationStatus.status === 'stopped'}
            size="lg"
            variant="solid"
          />
        </Box>

        {/* Main Dashboard Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Left Column */}
          <VStack spacing={6} align="stretch">
            {/* Account Balance */}
            <AccountBalanceCard
              balance={accountBalance}
              isLoading={isLoading}
              onRefresh={handleRefreshBalance}
              hasCredentials={credentialStatus.hasCredentials}
            />

            {/* Automation Status */}
            <AutomationStatusCard
              status={automationStatus}
              isLoading={isLoading}
              onStatusChange={handleAutomationStatusChange}
              hasCredentials={credentialStatus.hasCredentials}
            />
          </VStack>

          {/* Right Column */}
          <VStack spacing={6} align="stretch">
            {/* Dashboard Stats */}
            {stats && (
              <Box
                p={6}
                bg="white"
                border="1px"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="sm"
              >
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Performance Overview</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {stats.totalBets}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Total Bets</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {stats.winRate.toFixed(1)}%
                      </Text>
                      <Text fontSize="sm" color="gray.600">Win Rate</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                        {new Intl.NumberFormat('en-GH', {
                          style: 'currency',
                          currency: 'GHS',
                          minimumFractionDigits: 2
                        }).format(stats.totalProfit)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Total Profit</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                        {new Intl.NumberFormat('en-GH', {
                          style: 'currency',
                          currency: 'GHS',
                          minimumFractionDigits: 2
                        }).format(stats.averageBetAmount)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Avg Bet</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Box>
            )}

            {/* Recent Activities */}
            <RecentActivitiesList
              activities={recentActivities}
              isLoading={isLoading}
              onLoadMore={handleLoadMoreActivities}
              hasMore={recentActivities.length >= 10}
            />
          </VStack>
        </SimpleGrid>

        {/* Last Updated Info */}
        <Box textAlign="center" py={4}>
          <Text fontSize="sm" color="gray.500">
            Last updated: {lastUpdated.toLocaleString()}
          </Text>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </DashboardLayout>
  );
};
