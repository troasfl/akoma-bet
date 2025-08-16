import { supabase } from '../utils/supabase';
import { 
  AccountBalance, 
  AutomationStatus, 
  Activity, 
  ActivityFilter,
  EmergencyStopRequest,
  DashboardStats,
  DashboardSettings
} from '../types/dashboard';

export class DashboardService {
  private static instance: DashboardService;
  
  private constructor() {}
  
  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Fetch account balance from msport.com
   */
  public async fetchAccountBalance(): Promise<AccountBalance | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if user has stored credentials
      const { data: credentials } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!credentials) {
        return null; // No credentials stored
      }

      // For now, we'll simulate balance fetching
      // In production, this would use the credential validation service to log in and fetch balance
      const mockBalance: AccountBalance = {
        amount: Math.random() * 10000, // Simulated balance
        currency: 'GHS',
        lastUpdated: new Date(),
        source: 'msport',
        isStale: false
      };

      // Log balance update activity
      await this.logActivity(
        'balance_updated',
        'Balance Updated',
        `Account balance updated: ${mockBalance.currency} ${mockBalance.amount.toFixed(2)}`,
        mockBalance.amount,
        mockBalance.currency
      );

      return mockBalance;

    } catch (error) {
      console.error('Failed to fetch account balance:', error);
      throw error;
    }
  }

  /**
   * Get automation status for current user
   */
  public async getAutomationStatus(): Promise<AutomationStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('automation_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        // Create default status
        const defaultStatus: AutomationStatus = {
          status: 'stopped',
          lastChanged: new Date(),
          canStart: true,
          canPause: false,
          canStop: false,
          isEmergencyStopped: false
        };

        await this.updateAutomationStatus('stopped');
        return defaultStatus;
      }

      return {
        status: data.status as 'active' | 'paused' | 'stopped',
        lastChanged: new Date(data.last_changed),
        reason: data.reason,
        canStart: data.can_start,
        canPause: data.can_pause,
        canStop: data.can_stop,
        isEmergencyStopped: data.is_emergency_stopped,
        emergencyStopReason: data.emergency_stop_reason,
        emergencyStopTimestamp: data.emergency_stop_timestamp ? new Date(data.emergency_stop_timestamp) : undefined
      };

    } catch (error) {
      console.error('Failed to get automation status:', error);
      throw error;
    }
  }

  /**
   * Update automation status
   */
  public async updateAutomationStatus(
    status: 'active' | 'paused' | 'stopped',
    reason?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call the database function
      const { error } = await supabase.rpc('update_automation_status', {
        p_user_id: user.id,
        p_status: status,
        p_reason: reason
      });

      if (error) {
        throw error;
      }

      // Log activity
      const activityType = status === 'active' ? 'automation_started' : 
                          status === 'paused' ? 'automation_paused' : 'automation_stopped';
      
      const activityTitle = status === 'active' ? 'Automation Started' :
                           status === 'paused' ? 'Automation Paused' : 'Automation Stopped';

      await this.logActivity(
        activityType,
        activityTitle,
        reason || `Automation ${status}`,
        undefined,
        undefined,
        { reason, status }
      );

    } catch (error) {
      console.error('Failed to update automation status:', error);
      throw error;
    }
  }

  /**
   * Emergency stop automation
   */
  public async emergencyStop(request: EmergencyStopRequest): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call the database function
      const { error } = await supabase.rpc('emergency_stop_automation', {
        p_user_id: user.id,
        p_reason: request.reason,
        p_immediate: request.immediate
      });

      if (error) {
        throw error;
      }

      // Log emergency stop activity
      await this.logActivity(
        'emergency_stop',
        'Emergency Stop Activated',
        request.reason || 'Emergency stop activated',
        undefined,
        undefined,
        { immediate: request.immediate, reason: request.reason }
      );

    } catch (error) {
      console.error('Failed to emergency stop automation:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  public async getRecentActivities(
    limit: number = 10,
    filter?: ActivityFilter
  ): Promise<Activity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filter?.type && filter.type.length > 0) {
        query = query.in('type', filter.type);
      }

      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.dateRange) {
        query = query
          .gte('timestamp', filter.dateRange.start.toISOString())
          .lte('timestamp', filter.dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(activity => ({
        id: activity.id,
        type: activity.type as any,
        title: activity.title,
        description: activity.description,
        amount: activity.amount,
        currency: activity.currency,
        timestamp: new Date(activity.timestamp),
        status: activity.status as 'pending' | 'completed' | 'failed',
        metadata: activity.metadata,
        userId: activity.user_id
      }));

    } catch (error) {
      console.error('Failed to get recent activities:', error);
      throw error;
    }
  }

  /**
   * Log activity
   */
  public async logActivity(
    type: string,
    title: string,
    description?: string,
    amount?: number,
    currency?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_type: type,
        p_title: title,
        p_description: description,
        p_amount: amount,
        p_currency: currency || 'GHS',
        p_metadata: metadata
      });

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  public async getDashboardStats(): Promise<DashboardStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get activities for statistics
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['bet_placed', 'bet_won', 'bet_lost'])
        .order('timestamp', { ascending: false });

      if (error) {
        throw error;
      }

      const totalBets = activities.filter(a => a.type === 'bet_placed').length;
      const totalWins = activities.filter(a => a.type === 'bet_won').length;
      const totalLosses = activities.filter(a => a.type === 'bet_lost').length;
      const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;

      const betAmounts = activities
        .filter(a => a.amount && a.type === 'bet_placed')
        .map(a => a.amount as number);
      
      const averageBetAmount = betAmounts.length > 0 
        ? betAmounts.reduce((sum, amount) => sum + amount, 0) / betAmounts.length 
        : 0;

      const totalProfit = activities
        .filter(a => a.amount && (a.type === 'bet_won' || a.type === 'bet_lost'))
        .reduce((sum, activity) => {
          const amount = activity.amount as number;
          return sum + (activity.type === 'bet_won' ? amount : -amount);
        }, 0);

      const lastActivity = activities.length > 0 
        ? new Date(activities[0].timestamp) 
        : new Date();

      // Calculate automation uptime (simplified)
      const automationUptime = 0; // This would be calculated based on automation logs

      return {
        totalBets,
        totalWins,
        totalLosses,
        winRate,
        totalProfit,
        averageBetAmount,
        lastActivity,
        automationUptime
      };

    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get dashboard settings
   */
  public async getDashboardSettings(): Promise<DashboardSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('dashboard_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Return default settings
        return {
          refreshInterval: 30,
          showNotifications: true,
          autoRefreshBalance: true,
          theme: 'system',
          language: 'en',
          currency: 'GHS',
          timezone: 'UTC'
        };
      }

      return {
        refreshInterval: data.refresh_interval,
        showNotifications: data.show_notifications,
        autoRefreshBalance: data.auto_refresh_balance,
        theme: data.theme as 'light' | 'dark' | 'system',
        language: data.language,
        currency: data.currency,
        timezone: data.timezone
      };

    } catch (error) {
      console.error('Failed to get dashboard settings:', error);
      throw error;
    }
  }

  /**
   * Update dashboard settings
   */
  public async updateDashboardSettings(settings: Partial<DashboardSettings>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('dashboard_settings')
        .update({
          refresh_interval: settings.refreshInterval,
          show_notifications: settings.showNotifications,
          auto_refresh_balance: settings.autoRefreshBalance,
          theme: settings.theme,
          language: settings.language,
          currency: settings.currency,
          timezone: settings.timezone
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Failed to update dashboard settings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance();
