# Epic 1: Foundation & User Management

**Epic Goal:** Establish secure user registration, authentication, and credential management system with basic dashboard to enable users to safely store their msport.com credentials and access the platform.

## Story 1.1: User Registration and Authentication
As a soccer betting enthusiast,
I want to create a secure account on the platform,
so that I can safely store my betting preferences and access automated betting features.

**Acceptance Criteria:**
1. User can register with email, password, and basic profile information
2. Email verification is required before account activation
3. Password requirements enforce strong security (minimum 12 characters, mixed case, numbers, symbols)
4. User can log in with email and password
5. Failed login attempts are limited with progressive lockout periods
6. Password reset functionality works via secure email links

## Story 1.2: Secure Credential Storage
As a platform user,
I want to securely store my msport.com login credentials,
so that the system can automate betting on my behalf without compromising my account security.

**Acceptance Criteria:**
1. User can enter and save msport.com username and password
2. Credentials are encrypted using AES-256 encryption before storage
3. User can view masked credentials (username visible, password hidden with asterisks)
4. User can update stored credentials at any time
5. User can delete stored credentials which immediately disables all automation
6. System validates msport.com credentials by performing test login before saving
7. User receives email confirmation when credentials are added, updated, or removed

## Story 1.3: Basic Dashboard Setup
As a platform user,
I want a central dashboard showing my account status and recent activities,
so that I can quickly understand my current betting automation status and performance.

**Acceptance Criteria:**
1. Dashboard displays current account balance from msport.com (if credentials are stored)
2. Dashboard shows automation status (active, paused, or stopped)
3. Recent betting activities are displayed in chronological order (last 10 activities)
4. Basic profile information and settings are accessible from dashboard
5. Emergency stop button is prominently displayed and immediately accessible
6. Dashboard updates in real-time when betting activities occur
7. User can navigate to all major platform features from dashboard navigation
