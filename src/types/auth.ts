export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  timezone: string;
  preferredCurrency: string;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  activityAlerts: boolean;
  securityAlerts: boolean;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timezone?: string;
  preferredCurrency?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  password: string;
  confirmPassword: string;
}
