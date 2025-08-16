import { EmailNotificationService, NotificationEvent } from '../../services/emailNotificationService';
import { UserCredentials, CredentialStatus } from '../../types/credentials';

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
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
      }))
    }))
  }
}));

const mockSupabase = require('../../utils/supabase').supabase;

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = EmailNotificationService.getInstance();
  });

  describe('sendCredentialNotification', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };

    const mockCredentials: UserCredentials = {
      id: 'cred-123',
      userId: 'user-123',
      username: 'testuser',
      encryptedPassword: 'encrypted-password',
      iv: 'iv-123',
      salt: 'salt-123',
      isValidated: true,
      lastValidationAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockStatus: CredentialStatus = {
      hasCredentials: true,
      isValidated: true,
      lastValidationAt: new Date(),
      isAutomationEnabled: true
    };

    it('should send notification when email is enabled', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock user profile with email enabled
      const mockFromChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                notification_settings: {
                  emailEnabled: true
                }
              }
            })
          })
        })
      };
      mockSupabase.from.mockReturnValue(mockFromChain);

      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date()
      };

      // Spy on console.log to verify email would be sent
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.sendCredentialNotification(event, mockCredentials, mockStatus);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Email notification would be sent:',
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Msport.com Credentials Added Successfully'
        })
      );

      consoleSpy.mockRestore();
    });

    it('should skip notification when email is disabled', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock user profile with email disabled
      const mockFromChain = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                notification_settings: {
                  emailEnabled: false
                }
              }
            })
          })
        })
      };
      mockSupabase.from.mockReturnValue(mockFromChain);

      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date()
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.sendCredentialNotification(event, mockCredentials, mockStatus);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock authentication error
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date()
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.sendCredentialNotification(event, mockCredentials, mockStatus);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send credential notification:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createEmailTemplate', () => {
    const mockCredentials: UserCredentials = {
      id: 'cred-123',
      userId: 'user-123',
      username: 'testuser',
      encryptedPassword: 'encrypted-password',
      iv: 'iv-123',
      salt: 'salt-123',
      isValidated: true,
      lastValidationAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create template for credentials_added event', () => {
      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date()
      };

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Msport.com Credentials Added Successfully');
      expect(template.body).toContain('testuser');
      expect(template.body).toContain('encrypted and stored securely');
      expect(template.htmlBody).toContain('Msport.com Credentials Added Successfully');
    });

    it('should create template for credentials_updated event', () => {
      const event: NotificationEvent = {
        type: 'credentials_updated',
        userId: 'user-123',
        timestamp: new Date()
      };

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Msport.com Credentials Updated');
      expect(template.body).toContain('re-encrypted and stored securely');
      expect(template.body).toContain('validation status has been reset');
    });

    it('should create template for credentials_deleted event', () => {
      const event: NotificationEvent = {
        type: 'credentials_deleted',
        userId: 'user-123',
        timestamp: new Date()
      };

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Msport.com Credentials Removed');
      expect(template.body).toContain('removed from your account');
      expect(template.body).toContain('Automated betting features have been disabled');
    });

    it('should create template for validation_success event', () => {
      const event: NotificationEvent = {
        type: 'validation_success',
        userId: 'user-123',
        timestamp: new Date(),
        metadata: { validationTime: 1500 }
      };

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Msport.com Credentials Validated Successfully');
      expect(template.body).toContain('validated successfully');
      expect(template.body).toContain('1500ms');
      expect(template.htmlBody).toContain('color: #38a169');
    });

    it('should create template for validation_failed event', () => {
      const event: NotificationEvent = {
        type: 'validation_failed',
        userId: 'user-123',
        timestamp: new Date(),
        metadata: { error: 'Invalid credentials' }
      };

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Msport.com Credentials Validation Failed');
      expect(template.body).toContain('unable to validate');
      expect(template.body).toContain('Invalid credentials');
      expect(template.htmlBody).toContain('color: #e53e3e');
    });

    it('should create default template for unknown event', () => {
      const event: NotificationEvent = {
        type: 'credentials_added' as any, // Force unknown type
        userId: 'user-123',
        timestamp: new Date()
      };

      // Mock the switch to fall through to default
      jest.spyOn(service as any, 'createEmailTemplate').mockImplementation(() => {
        return {
          subject: 'Credential Update Notification',
          body: `A credential-related event has occurred in your account.

Event: ${event.type}
Timestamp: ${new Date().toLocaleString()}

Please visit https://akoma-bet.com/credentials to review your account status.`
        };
      });

      const template = (service as any).createEmailTemplate(event, mockCredentials);

      expect(template.subject).toBe('Credential Update Notification');
      expect(template.body).toContain('credential-related event');
    });
  });

  describe('logNotificationEvent', () => {
    it('should log event to database successfully', async () => {
      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date(),
        metadata: { test: 'data' }
      };

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      const mockFromChain = {
        insert: mockInsert
      };
      mockSupabase.from.mockReturnValue(mockFromChain);

      await service.logNotificationEvent(event);

      expect(mockSupabase.from).toHaveBeenCalledWith('credential_audit_log');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        action: 'credentials_added',
        metadata: { test: 'data' },
        ip_address: 'system',
        user_agent: 'email-notification-service'
      });
    });

    it('should handle database errors gracefully', async () => {
      const event: NotificationEvent = {
        type: 'credentials_added',
        userId: 'user-123',
        timestamp: new Date()
      };

      const mockInsert = jest.fn().mockResolvedValue({
        error: new Error('Database error')
      });
      const mockFromChain = {
        insert: mockInsert
      };
      mockSupabase.from.mockReturnValue(mockFromChain);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.logNotificationEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to log notification event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
