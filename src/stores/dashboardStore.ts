import { create } from 'zustand';
import { dashboardService } from '../services/dashboardService';
import { 
  DashboardState, 
  ActivityFilter,
  EmergencyStopRequest
} from '../types/dashboard';

interface DashboardStore extends DashboardState {
  // Actions
  loadDashboard: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  updateAutomationStatus: (status: 'active' | 'paused' | 'stopped', reason?: string) => Promise<void>;
  emergencyStop: (request: EmergencyStopRequest) => Promise<void>;
  loadActivities: (limit?: number, filter?: ActivityFilter) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

// Error handling utility
const handleDashboardError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  accountBalance: null,
  automationStatus: {
    status: 'stopped',
    lastChanged: new Date(),
    canStart: true,
    canPause: false,
    canStop: false,
    isEmergencyStopped: false
  },
  recentActivities: [],
  isLoading: false,
  error: null,
  lastUpdated: new Date(),

  loadDashboard: async () => {
    try {
      set({ isLoading: true, error: null });

      // Load all dashboard data in parallel
      const [balance, status, activities] = await Promise.all([
        dashboardService.fetchAccountBalance(),
        dashboardService.getAutomationStatus(),
        dashboardService.getRecentActivities(10)
      ]);

      set({
        accountBalance: balance,
        automationStatus: status,
        recentActivities: activities,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },

  refreshBalance: async () => {
    try {
      set({ isLoading: true, error: null });

      const balance = await dashboardService.fetchAccountBalance();

      set({
        accountBalance: balance,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },

  updateAutomationStatus: async (status: 'active' | 'paused' | 'stopped', reason?: string) => {
    try {
      set({ isLoading: true, error: null });

      await dashboardService.updateAutomationStatus(status, reason);

      // Refresh automation status
      const updatedStatus = await dashboardService.getAutomationStatus();

      set({
        automationStatus: updatedStatus,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },

  emergencyStop: async (request: EmergencyStopRequest) => {
    try {
      set({ isLoading: true, error: null });

      await dashboardService.emergencyStop(request);

      // Refresh automation status after emergency stop
      const updatedStatus = await dashboardService.getAutomationStatus();

      set({
        automationStatus: updatedStatus,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },

  loadActivities: async (limit: number = 10, filter?: ActivityFilter) => {
    try {
      set({ isLoading: true, error: null });

      const activities = await dashboardService.getRecentActivities(limit, filter);

      set({
        recentActivities: activities,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },



  updateSettings: async (settings: any) => {
    try {
      set({ isLoading: true, error: null });

      await dashboardService.updateDashboardSettings(settings);

      set({
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      set({ 
        error: handleDashboardError(error), 
        isLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      accountBalance: null,
      automationStatus: {
        status: 'stopped',
        lastChanged: new Date(),
        canStart: true,
        canPause: false,
        canStop: false,
        isEmergencyStopped: false
      },
      recentActivities: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date()
    });
  }
}));
