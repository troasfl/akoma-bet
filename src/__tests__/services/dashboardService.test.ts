import { DashboardService } from '../../services/dashboardService';

jest.mock('../../utils/supabase', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      })),
      order: jest.fn(() => ({
        limit: jest.fn()
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn()
        }))
      }))
    })),
    rpc: jest.fn()
  };
  
  return {
    supabase: mockSupabase
  };
});

describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../utils/supabase').supabase;
    service = DashboardService.getInstance();
  });

  describe('fetchAccountBalance', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should return null when no credentials are stored', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock no credentials found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null
      });

      const result = await service.fetchAccountBalance();

      expect(result).toBeNull();
    });

    it('should return balance when credentials are stored', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock credentials found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'cred-123', user_id: 'user-123' }
      });

      // Mock RPC call for logging activity
      mockSupabase.rpc.mockResolvedValue({
        data: 'activity-id',
        error: null
      });

      const result = await service.fetchAccountBalance();

      expect(result).toBeDefined();
      expect(result?.currency).toBe('GHS');
      expect(result?.source).toBe('msport');
      expect(result?.amount).toBeGreaterThan(0);
    });

    it('should handle authentication errors', async () => {
      // Mock authentication error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      await expect(service.fetchAccountBalance()).rejects.toThrow('User not authenticated');
    });
  });

  describe('getAutomationStatus', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should return default status when no status exists', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock no status found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock RPC call for creating default status
      mockSupabase.rpc.mockResolvedValue({
        error: null
      });

      const result = await service.getAutomationStatus();

      expect(result.status).toBe('stopped');
      expect(result.canStart).toBe(true);
      expect(result.canPause).toBe(false);
      expect(result.canStop).toBe(false);
    });

    it('should return existing status when found', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock existing status
      const mockStatus = {
        status: 'active',
        last_changed: new Date().toISOString(),
        reason: 'Started by user',
        can_start: false,
        can_pause: true,
        can_stop: true,
        is_emergency_stopped: false
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockStatus
      });

      const result = await service.getAutomationStatus();

      expect(result.status).toBe('active');
      expect(result.canStart).toBe(false);
      expect(result.canPause).toBe(true);
      expect(result.canStop).toBe(true);
    });
  });

  describe('updateAutomationStatus', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should update automation status successfully', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock RPC calls
      mockSupabase.rpc.mockResolvedValue({
        error: null
      });

      await expect(service.updateAutomationStatus('active', 'Started by user')).resolves.not.toThrow();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_automation_status', {
        p_user_id: 'user-123',
        p_status: 'active',
        p_reason: 'Started by user'
      });
    });

    it('should handle RPC errors', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock RPC error
      mockSupabase.rpc.mockResolvedValue({
        error: new Error('Database error')
      });

      await expect(service.updateAutomationStatus('active')).rejects.toThrow('Database error');
    });
  });

  describe('emergencyStop', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should perform emergency stop successfully', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock RPC calls
      mockSupabase.rpc.mockResolvedValue({
        error: null
      });

      const request = {
        reason: 'Emergency stop',
        immediate: true,
        notifyUser: true
      };

      await expect(service.emergencyStop(request)).resolves.not.toThrow();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('emergency_stop_automation', {
        p_user_id: 'user-123',
        p_reason: 'Emergency stop',
        p_immediate: true
      });
    });
  });

  describe('getRecentActivities', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should return recent activities', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock activities
      const mockActivities = [
        {
          id: 'activity-1',
          user_id: 'user-123',
          type: 'bet_placed',
          title: 'Bet Placed',
          description: 'A bet was placed',
          amount: 100,
          currency: 'GHS',
          timestamp: new Date().toISOString(),
          status: 'completed',
          metadata: null
        }
      ];

      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockActivities
      });

      const result = await service.getRecentActivities(10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('activity-1');
      expect(result[0].type).toBe('bet_placed');
    });

    it('should apply filters correctly', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock query chain
      const mockQuery = {
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: []
        })
      };

      mockSupabase.from().select().eq.mockReturnValue(mockQuery);

      const filter = {
        type: ['bet_placed', 'bet_won'] as any,
        status: ['completed'] as any
      };

      await service.getRecentActivities(10, filter);

      expect(mockQuery.in).toHaveBeenCalledWith('type', ['bet_placed', 'bet_won']);
    });
  });

  describe('logActivity', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should log activity successfully', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock RPC call
      mockSupabase.rpc.mockResolvedValue({
        data: 'activity-id',
        error: null
      });

      const result = await service.logActivity(
        'bet_placed',
        'Bet Placed',
        'A bet was placed',
        100,
        'GHS',
        { betId: 'bet-123' }
      );

      expect(result).toBe('activity-id');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('log_activity', {
        p_user_id: 'user-123',
        p_type: 'bet_placed',
        p_title: 'Bet Placed',
        p_description: 'A bet was placed',
        p_amount: 100,
        p_currency: 'GHS',
        p_metadata: { betId: 'bet-123' }
      });
    });
  });

  describe('getDashboardStats', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should return dashboard statistics', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock activities for stats calculation
      const mockActivities = [
        { type: 'bet_placed', amount: 100 },
        { type: 'bet_placed', amount: 200 },
        { type: 'bet_won', amount: 150 },
        { type: 'bet_lost', amount: 100 }
      ];

      mockSupabase.from().select().eq().in().order.mockResolvedValue({
        data: mockActivities
      });

      const result = await service.getDashboardStats();

      expect(result.totalBets).toBe(2);
      expect(result.totalWins).toBe(1);
      expect(result.totalLosses).toBe(1);
      expect(result.winRate).toBe(50);
      expect(result.averageBetAmount).toBe(150);
    });
  });

  describe('getDashboardSettings', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should return default settings when no settings exist', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock no settings found
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await service.getDashboardSettings();

      expect(result.refreshInterval).toBe(30);
      expect(result.showNotifications).toBe(true);
      expect(result.autoRefreshBalance).toBe(true);
      expect(result.theme).toBe('system');
    });

    it('should return existing settings when found', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock existing settings
      const mockSettings = {
        refresh_interval: 60,
        show_notifications: false,
        auto_refresh_balance: false,
        theme: 'dark',
        language: 'en',
        currency: 'USD',
        timezone: 'UTC'
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockSettings
      });

      const result = await service.getDashboardSettings();

      expect(result.refreshInterval).toBe(60);
      expect(result.showNotifications).toBe(false);
      expect(result.autoRefreshBalance).toBe(false);
      expect(result.theme).toBe('dark');
    });
  });

  describe('updateDashboardSettings', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    it('should update settings successfully', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock update
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const settings = {
        refreshInterval: 60,
        theme: 'dark' as const
      };

      await expect(service.updateDashboardSettings(settings)).resolves.not.toThrow();

      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        refresh_interval: 60,
        theme: 'dark'
      });
    });
  });
});
