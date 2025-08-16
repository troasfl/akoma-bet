import { supabase } from '../utils/supabase';
import { UserCredentials, CredentialStatus } from '../types/credentials';

export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface EmailNotificationOptions {
  to: string;
  template: EmailTemplate;
  variables?: Record<string, string>;
}

export interface NotificationEvent {
  type: 'credentials_added' | 'credentials_updated' | 'credentials_deleted' | 'validation_success' | 'validation_failed';
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;
  
  private constructor() {}
  
  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }
  
  /**
   * Send email notification for credential events
   */
  public async sendCredentialNotification(
    event: NotificationEvent,
    credentials?: UserCredentials,
    status?: CredentialStatus
  ): Promise<void> {
    try {
      // Get user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get user profile for email preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();
      
      // Check if email notifications are enabled
      if (!profile?.notification_settings?.emailEnabled) {
        return; // Skip if email notifications are disabled
      }
      
      // Create email template based on event type
      const template = this.createEmailTemplate(event, credentials);
      
      // Send email using Supabase Edge Functions or external service
      await this.sendEmail({
        to: user.email!,
        template,
        variables: {
          username: credentials?.username || 'N/A',
          timestamp: new Date().toLocaleString(),
          validationStatus: status?.isValidated ? 'Valid' : 'Invalid',
          lastValidation: status?.lastValidationAt?.toLocaleString() || 'Never'
        }
      });
      
    } catch (error) {
      console.error('Failed to send credential notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }
  
  /**
   * Create email template based on event type
   */
  private createEmailTemplate(
    event: NotificationEvent,
    credentials?: UserCredentials
  ): EmailTemplate {
    const baseUrl = process.env.VITE_APP_URL || 'https://akoma-bet.com';
    
    switch (event.type) {
      case 'credentials_added':
        return {
          subject: 'Msport.com Credentials Added Successfully',
          body: `Your msport.com credentials have been securely added to your account.

Username: ${credentials?.username || 'N/A'}
Added: ${new Date().toLocaleString()}

Your credentials are encrypted and stored securely. You can now enable automated betting features.

To validate your credentials, please visit: ${baseUrl}/credentials

If you did not add these credentials, please contact support immediately.`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d3748;">Msport.com Credentials Added Successfully</h2>
              <p>Your msport.com credentials have been securely added to your account.</p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Username:</strong> ${credentials?.username || 'N/A'}</p>
                <p><strong>Added:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>Your credentials are encrypted and stored securely. You can now enable automated betting features.</p>
              
              <a href="${baseUrl}/credentials" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Validate Credentials
              </a>
              
              <p style="color: #e53e3e; font-size: 14px;">
                If you did not add these credentials, please contact support immediately.
              </p>
            </div>
          `
        };
        
      case 'credentials_updated':
        return {
          subject: 'Msport.com Credentials Updated',
          body: `Your msport.com credentials have been updated.

Username: ${credentials?.username || 'N/A'}
Updated: ${new Date().toLocaleString()}

Your credentials have been re-encrypted and stored securely. Please note that validation status has been reset and you may need to re-validate your credentials.

To validate your credentials, please visit: ${baseUrl}/credentials

If you did not update these credentials, please contact support immediately.`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d3748;">Msport.com Credentials Updated</h2>
              <p>Your msport.com credentials have been updated.</p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Username:</strong> ${credentials?.username || 'N/A'}</p>
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>Your credentials have been re-encrypted and stored securely. Please note that validation status has been reset and you may need to re-validate your credentials.</p>
              
              <a href="${baseUrl}/credentials" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Validate Credentials
              </a>
              
              <p style="color: #e53e3e; font-size: 14px;">
                If you did not update these credentials, please contact support immediately.
              </p>
            </div>
          `
        };
        
      case 'credentials_deleted':
        return {
          subject: 'Msport.com Credentials Removed',
          body: `Your msport.com credentials have been removed from your account.

Removed: ${new Date().toLocaleString()}

Automated betting features have been disabled. To re-enable them, you'll need to add new credentials.

To add new credentials, please visit: ${baseUrl}/credentials

If you did not remove these credentials, please contact support immediately.`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d3748;">Msport.com Credentials Removed</h2>
              <p>Your msport.com credentials have been removed from your account.</p>
              
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Removed:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>Automated betting features have been disabled. To re-enable them, you'll need to add new credentials.</p>
              
              <a href="${baseUrl}/credentials" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Add New Credentials
              </a>
              
              <p style="color: #e53e3e; font-size: 14px;">
                If you did not remove these credentials, please contact support immediately.
              </p>
            </div>
          `
        };
        
      case 'validation_success':
        return {
          subject: 'Msport.com Credentials Validated Successfully',
          body: `Your msport.com credentials have been validated successfully!

Username: ${credentials?.username || 'N/A'}
Validated: ${new Date().toLocaleString()}
Validation Time: ${event.metadata?.validationTime || 'N/A'}ms

Your credentials are working correctly and automated betting features are now enabled.

To manage your credentials, please visit: ${baseUrl}/credentials`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #38a169;">Msport.com Credentials Validated Successfully</h2>
              <p>Your msport.com credentials have been validated successfully!</p>
              
              <div style="background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38a169;">
                <p><strong>Username:</strong> ${credentials?.username || 'N/A'}</p>
                <p><strong>Validated:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Validation Time:</strong> ${event.metadata?.validationTime || 'N/A'}ms</p>
              </div>
              
              <p>Your credentials are working correctly and automated betting features are now enabled.</p>
              
              <a href="${baseUrl}/credentials" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Manage Credentials
              </a>
            </div>
          `
        };
        
      case 'validation_failed':
        return {
          subject: 'Msport.com Credentials Validation Failed',
          body: `We were unable to validate your msport.com credentials.

Username: ${credentials?.username || 'N/A'}
Failed: ${new Date().toLocaleString()}
Error: ${event.metadata?.error || 'Unknown error'}

Please check your credentials and try again. Common issues include:
- Incorrect username or password
- Account locked or suspended
- Network connectivity issues
- Msport.com service temporarily unavailable

To update your credentials, please visit: ${baseUrl}/credentials`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e53e3e;">Msport.com Credentials Validation Failed</h2>
              <p>We were unable to validate your msport.com credentials.</p>
              
              <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
                <p><strong>Username:</strong> ${credentials?.username || 'N/A'}</p>
                <p><strong>Failed:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Error:</strong> ${event.metadata?.error || 'Unknown error'}</p>
              </div>
              
              <p>Please check your credentials and try again. Common issues include:</p>
              <ul>
                <li>Incorrect username or password</li>
                <li>Account locked or suspended</li>
                <li>Network connectivity issues</li>
                <li>Msport.com service temporarily unavailable</li>
              </ul>
              
              <a href="${baseUrl}/credentials" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                Update Credentials
              </a>
            </div>
          `
        };
        
      default:
        return {
          subject: 'Credential Update Notification',
          body: `A credential-related event has occurred in your account.

Event: ${event.type}
Timestamp: ${new Date().toLocaleString()}

Please visit ${baseUrl}/credentials to review your account status.`
        };
    }
  }
  
  /**
   * Send email using Supabase Edge Functions or external service
   */
  private async sendEmail(options: EmailNotificationOptions): Promise<void> {
    try {
      // For now, we'll use a placeholder implementation
      // In production, this would integrate with a real email service
      // like SendGrid, AWS SES, or Supabase Edge Functions
      
      console.log('Email notification would be sent:', {
        to: options.to,
        subject: options.template.subject,
        body: options.template.body
      });
      
      // TODO: Implement actual email sending
      // Example with Supabase Edge Functions:
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: {
      //     to: options.to,
      //     subject: options.template.subject,
      //     html: options.template.htmlBody || options.template.body
      //   }
      // });
      
      // if (error) throw error;
      
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
  
  /**
   * Log notification event to database
   */
  public async logNotificationEvent(event: NotificationEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('credential_audit_log')
        .insert({
          user_id: event.userId,
          action: event.type,
          metadata: event.metadata,
          ip_address: 'system', // Would be captured from request in real implementation
          user_agent: 'email-notification-service'
        });
      
      if (error) {
        console.error('Failed to log notification event:', error);
      }
    } catch (error) {
      console.error('Failed to log notification event:', error);
    }
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();
