# Data Models

Define the core data models/entities that will be shared between frontend and backend.

## User

**Purpose:** Represents platform users who want automated betting services

**Key Attributes:**
- id: string (UUID) - Unique user identifier
- email: string - User's email address for authentication
- profile: UserProfile - User preferences and settings
- createdAt: Date - Account creation timestamp
- lastLoginAt: Date - Most recent login time

### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  timezone: string;
  preferredCurrency: string;
  notificationSettings: NotificationSettings;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  activityAlerts: boolean;
  securityAlerts: boolean;
}
```

### Relationships
- Has many BettingSchedules
- Has many BettingActivities
- Has one CredentialVault (encrypted)

## BettingSchedule

**Purpose:** Defines automated betting schedules configured by users

**Key Attributes:**
- id: string (UUID) - Unique schedule identifier
- userId: string - Reference to owning user
- name: string - User-defined schedule name
- startDate: Date - When automation begins
- endDate: Date - When automation ends
- dailyAmount: number - Amount to bet per day
- frequency: ScheduleFrequency - How often to bet
- status: ScheduleStatus - Current schedule state

### TypeScript Interface

```typescript
interface BettingSchedule {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  dailyAmount: number;
  frequency: ScheduleFrequency;
  preferredBetTypes: BetType[];
  riskControls: RiskControls;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  EVERY_OTHER_DAY = 'every_other_day'
}

enum ScheduleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface RiskControls {
  dailyLossLimit: number;
  weeklyLossLimit: number;
  maxSingleBet: number;
  monthlySpendingCap: number;
}
```

### Relationships
- Belongs to User
- Has many BettingActivities

## BettingActivity

**Purpose:** Records all betting actions and outcomes for transparency and reporting

**Key Attributes:**
- id: string (UUID) - Unique activity identifier
- userId: string - Reference to user
- scheduleId: string - Reference to originating schedule
- matchDetails: MatchInfo - Information about the soccer match
- betDetails: BetInfo - Bet type, amount, odds
- outcome: BetOutcome - Result of the bet
- timestamp: Date - When the bet was placed

### TypeScript Interface

```typescript
interface BettingActivity {
  id: string;
  userId: string;
  scheduleId: string;
  matchDetails: MatchInfo;
  betDetails: BetInfo;
  outcome: BetOutcome;
  selectionReasoning: string;
  timestamp: Date;
  settledAt?: Date;
}

interface MatchInfo {
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: Date;
  msportMatchId: string;
}

interface BetInfo {
  type: BetType;
  selection: string;
  stake: number;
  odds: number;
  potentialReturn: number;
  betId?: string; // msport bet reference
}

enum BetType {
  HOME_DRAW_AWAY = 'home_draw_away',
  OVER_UNDER_2_5 = 'over_under_2_5'
}

interface BetOutcome {
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  actualReturn?: number;
  settledAt?: Date;
}
```

### Relationships
- Belongs to User
- Belongs to BettingSchedule

## CredentialVault

**Purpose:** Securely stores encrypted msport.com login credentials

**Key Attributes:**
- userId: string - Reference to owning user
- encryptedCredentials: string - AES-256 encrypted credentials
- kmsKeyId: string - AWS KMS key reference
- lastValidated: Date - When credentials were last verified
- validationStatus: CredentialStatus - Current credential validity

### TypeScript Interface

```typescript
interface CredentialVault {
  userId: string;
  encryptedCredentials: string;
  kmsKeyId: string;
  lastValidated: Date;
  validationStatus: CredentialStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum CredentialStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  NEEDS_VERIFICATION = 'needs_verification'
}
```

### Relationships
- Belongs to User (one-to-one)
