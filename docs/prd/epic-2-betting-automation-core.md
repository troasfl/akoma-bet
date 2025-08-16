# Epic 2: Betting Automation Core

**Epic Goal:** Implement Playwright-based msport.com integration with automated login and bet placement capabilities to execute bets on behalf of users according to their schedules and preferences.

## Story 2.1: Msport.com Browser Automation Setup
As a system administrator,
I want to establish reliable browser automation for msport.com,
so that the platform can consistently log in and navigate the betting site on behalf of users.

**Acceptance Criteria:**
1. Playwright can successfully launch headless browser and navigate to msport.com/gh/web
2. System can handle msport.com login form with user credentials
3. Automation detects and handles common login errors (invalid credentials, site maintenance, etc.)
4. Browser sessions are managed securely with proper cleanup after use
5. System adapts to minor UI changes in msport.com login process
6. Automated login process completes within 30 seconds under normal conditions
7. Failed login attempts are logged with detailed error information for troubleshooting

## Story 2.2: Soccer Match Discovery and Selection
As the automation system,
I want to identify available soccer matches and their betting options,
so that I can present optimal betting opportunities to the selection algorithm.

**Acceptance Criteria:**
1. System can navigate to "Today's Matches" section on msport.com
2. All available soccer matches are extracted with team names, start times, and odds
3. For each match, both home/draw/away and over/under 2.5 goals options are captured
4. System filters matches to only include those starting within the next 24 hours
5. Match data includes current odds for all available bet types
6. System handles cases where matches are postponed, cancelled, or odds are suspended
7. Match discovery process completes within 60 seconds for typical daily match volume

## Story 2.3: Automated Bet Placement
As the automation system,
I want to place bets on selected matches with specified amounts,
so that I can execute the user's betting strategy without manual intervention.

**Acceptance Criteria:**
1. System can navigate to specific match betting interface on msport.com
2. Correct bet type (home/draw/away or over/under 2.5) is selected based on algorithm decision
3. Specified bet amount is entered accurately in the stake field
4. Bet slip is reviewed and confirmed automatically
5. System captures bet confirmation details (bet ID, odds, stake, potential return)
6. Failed bet placements are detected and logged with specific error reasons
7. System respects minimum and maximum bet limits enforced by msport.com
8. Bet placement process completes within 45 seconds to secure current odds
