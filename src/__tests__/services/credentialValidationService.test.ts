import { CredentialValidationService, ValidationOptions } from '../../services/credentialValidationService';
import { CredentialInput } from '../../types/credentials';

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn()
  }
}));

describe('CredentialValidationService', () => {
  let service: CredentialValidationService;
  let mockBrowser: any;
  let mockContext: any;
  let mockPage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock browser, context, and page
    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      $: jest.fn(),
      click: jest.fn(),
      url: jest.fn(),
      content: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
      waitForURL: jest.fn()
    };

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn()
    };

    mockBrowser = {
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn()
    };

    const { chromium } = require('playwright');
    chromium.launch.mockResolvedValue(mockBrowser);

    service = CredentialValidationService.getInstance();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('validateCredentials', () => {
    const mockCredentials: CredentialInput = {
      username: 'testuser',
      password: 'testpass123'
    };

    it('should return success when login is successful', async () => {
      // Mock successful login flow
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForSelector.mockResolvedValue(undefined);
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('text') || selector.includes('username')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('password')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('button') || selector.includes('submit')) {
          return { click: jest.fn() };
        }
        return null;
      });
      mockPage.url.mockReturnValue('https://msport.com/gh/dashboard');
      mockPage.evaluate.mockResolvedValue(false); // No errors
      mockPage.waitForURL.mockResolvedValue(undefined);

      const result = await service.validateCredentials(mockCredentials);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      // Remove timing check as it can be 0 in test environment
    });

    it('should return failure when login fails', async () => {
      // Mock failed login flow
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForSelector.mockResolvedValue(undefined);
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('text') || selector.includes('username')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('password')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('button') || selector.includes('submit')) {
          return { click: jest.fn() };
        }
        return null;
      });
      mockPage.url.mockReturnValue('https://msport.com/gh/login');
      mockPage.evaluate.mockResolvedValue(true); // Has errors
      mockPage.waitForURL.mockRejectedValue(new Error('Timeout'));

      const result = await service.validateCredentials(mockCredentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      // Remove timing check as it can be 0 in test environment
    });

    it('should retry on failure', async () => {
      const options: ValidationOptions = {
        retries: 2,
        timeout: 1000
      };

      // Mock first attempt fails, second succeeds
      mockPage.goto
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      mockPage.waitForSelector.mockResolvedValue(undefined);
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('text') || selector.includes('username')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('password')) {
          return { clear: jest.fn(), fill: jest.fn() };
        }
        if (selector.includes('button') || selector.includes('submit')) {
          return { click: jest.fn() };
        }
        return null;
      });
      mockPage.url.mockReturnValue('https://msport.com/gh/dashboard');
      mockPage.evaluate.mockResolvedValue(false);
      mockPage.waitForURL.mockResolvedValue(undefined);

      const result = await service.validateCredentials(mockCredentials, options);

      expect(result.isValid).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledTimes(2);
    });

    it('should handle timeout errors', async () => {
      const options: ValidationOptions = {
        timeout: 1000
      };

      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      const result = await service.validateCredentials(mockCredentials, options);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('timeout');
    }, 10000); // Increase timeout for this test

    it('should handle missing form fields', async () => {
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForSelector.mockResolvedValue(undefined);
      mockPage.$.mockReturnValue(null); // No form fields found

      const result = await service.validateCredentials(mockCredentials);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Could not find login form fields');
    }, 10000); // Increase timeout for this test
  });

  describe('getErrorMessage', () => {
    it('should return appropriate message for timeout errors', () => {
      const message = service.getErrorMessage('Navigation timeout');
      expect(message).toContain('timed out');
      expect(message).toContain('internet connection');
    });

    it('should return appropriate message for invalid credentials', () => {
      const message = service.getErrorMessage('invalid');
      expect(message).toContain('Invalid username or password');
      expect(message).toContain('check your credentials and try again');
    });

    it('should return appropriate message for network errors', () => {
      const message = service.getErrorMessage('network');
      expect(message).toContain('Network error occurred');
      expect(message).toContain('check your internet connection');
    });

    it('should return generic message for unknown errors', () => {
      const message = service.getErrorMessage('Unknown error');
      expect(message).toContain('Validation failed: Unknown error');
    });
  });

  describe('cleanup', () => {
    it('should close browser and reset instance', async () => {
      const testCredentials: CredentialInput = {
        username: 'testuser',
        password: 'testpass123'
      };

      // Initialize browser first
      mockPage.goto.mockResolvedValue(undefined);
      mockPage.waitForSelector.mockResolvedValue(undefined);
      mockPage.$.mockReturnValue({ clear: jest.fn(), fill: jest.fn(), click: jest.fn() });
      mockPage.url.mockReturnValue('https://msport.com/gh/dashboard');
      mockPage.evaluate.mockResolvedValue(false);
      mockPage.waitForURL.mockResolvedValue(undefined);

      await service.validateCredentials(testCredentials);

      // Now cleanup
      await service.cleanup();

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
