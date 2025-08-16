export interface DashboardState {
  accountBalance: AccountBalance | null;
  automationStatus: AutomationStatus;
  recentActivities: Activity[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export interface AccountBalance {
  amount: number;
  currency: string;
  lastUpdated: Date;
  source: 'msport' | 'manual';
  isStale: boolean; // Indicates if balance needs refresh
}

export interface AutomationStatus {
  status: 'active' | 'paused' | 'stopped';
  lastChanged: Date;
  reason?: string;
  canStart: boolean;
  canPause: boolean;
  canStop: boolean;
  isEmergencyStopped: boolean;
  emergencyStopReason?: string;
  emergencyStopTimestamp?: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  userId: string;
}

export type ActivityType = 
  | 'bet_placed' 
  | 'bet_won' 
  | 'bet_lost' 
  | 'automation_started' 
  | 'automation_stopped'
  | 'automation_paused'
  | 'emergency_stop'
  | 'credential_added'
  | 'credential_updated'
  | 'credential_deleted'
  | 'balance_updated';

export interface ActivityFilter {
  type?: ActivityType[];
  status?: ('pending' | 'completed' | 'failed')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
}

export interface DashboardSettings {
  refreshInterval: number; // in seconds
  showNotifications: boolean;
  autoRefreshBalance: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
}

export interface EmergencyStopRequest {
  reason?: string;
  immediate: boolean;
  notifyUser: boolean;
}

export interface AutomationControlRequest {
  action: 'start' | 'pause' | 'stop';
  reason?: string;
  scheduledTime?: Date;
}

export interface RealTimeUpdate {
  type: 'balance' | 'activity' | 'status' | 'emergency';
  data: any;
  timestamp: Date;
}

export interface DashboardStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalProfit: number;
  averageBetAmount: number;
  lastActivity: Date;
  automationUptime: number; // in minutes
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive: boolean;
  isVisible: boolean;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}
