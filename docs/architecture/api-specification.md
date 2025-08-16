# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Automated Soccer Betting Scheduler API
  version: 1.0.0
  description: REST API for automated betting platform
servers:
  - url: https://api.bettingscheduler.com/v1
    description: Production API
  - url: https://api-dev.bettingscheduler.com/v1
    description: Development API

paths:
  /auth/login:
    post:
      summary: User authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 12
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

  /users/profile:
    get:
      summary: Get user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    put:
      summary: Update user profile
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserProfile'

  /credentials:
    post:
      summary: Store msport.com credentials
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '201':
          description: Credentials stored successfully
        '400':
          description: Invalid credentials or validation failed

  /schedules:
    get:
      summary: Get user's betting schedules
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of betting schedules
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BettingSchedule'
    post:
      summary: Create new betting schedule
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BettingSchedule'

  /schedules/{scheduleId}/control:
    post:
      summary: Control schedule (start/stop/pause)
      security:
        - bearerAuth: []
      parameters:
        - name: scheduleId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                action:
                  type: string
                  enum: [start, stop, pause, resume]

  /activities:
    get:
      summary: Get betting activities
      security:
        - bearerAuth: []
      parameters:
        - name: startDate
          in: query
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          schema:
            type: string
            format: date
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, won, lost, cancelled]
      responses:
        '200':
          description: List of betting activities
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BettingActivity'

  /reports/performance:
    get:
      summary: Get performance analytics
      security:
        - bearerAuth: []
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [day, week, month, year]
      responses:
        '200':
          description: Performance metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  totalProfit:
                    type: number
                  winRate:
                    type: number
                  roi:
                    type: number
                  totalBets:
                    type: integer

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        profile:
          $ref: '#/components/schemas/UserProfile'
    UserProfile:
      type: object
      properties:
        firstName:
          type: string
        lastName:
          type: string
        timezone:
          type: string
        preferredCurrency:
          type: string
    BettingSchedule:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
        dailyAmount:
          type: number
        frequency:
          type: string
          enum: [daily, weekdays, weekends, every_other_day]
        status:
          type: string
          enum: [draft, active, paused, completed, cancelled]
    BettingActivity:
      type: object
      properties:
        id:
          type: string
        matchDetails:
          type: object
        betDetails:
          type: object
        outcome:
          type: object
        timestamp:
          type: string
          format: date-time
```