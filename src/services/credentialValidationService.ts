import { chromium, Browser, Page } from 'playwright';
import { CredentialInput, CredentialValidationResult, CredentialError } from '../types/credentials';

export interface ValidationOptions {
  timeout?: number; // Timeout in milliseconds
  retries?: number; // Number of retry attempts
  headless?: boolean; // Whether to run browser in headless mode
}

export class CredentialValidationService {
  private static instance: CredentialValidationService;
  private browser: Browser | null = null;
  
  private constructor() {}
  
  public static getInstance(): CredentialValidationService {
    if (!CredentialValidationService.instance) {
      CredentialValidationService.instance = new CredentialValidationService();
    }
    return CredentialValidationService.instance;
  }
  
  /**
   * Initialize the browser instance
   */
  private async initializeBrowser(headless: boolean = true): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }
  
  /**
   * Clean up browser resources
   */
  public async cleanup(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }
  
  /**
   * Validate msport.com credentials by performing a test login
   */
  public async validateCredentials(
    credentials: CredentialInput,
    options: ValidationOptions = {}
  ): Promise<CredentialValidationResult> {
    const {
      timeout = 30000, // 30 seconds default
      retries = 3,
      headless = true
    } = options;
    
    const startTime = Date.now();
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.performLogin(credentials, { timeout, headless });
        const validationTime = Date.now() - startTime;
        
        return {
          isValid: result.success,
          error: result.error,
          validationTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown validation error';
        
        // If this is the last attempt, return the error
        if (attempt === retries) {
          const validationTime = Date.now() - startTime;
          return {
            isValid: false,
            error: lastError,
            validationTime
          };
        }
        
        // Wait before retrying (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    return {
      isValid: false,
      error: lastError || 'Validation failed after all retries',
      validationTime: Date.now() - startTime
    };
  }
  
  /**
   * Perform the actual login attempt
   */
  private async performLogin(
    credentials: CredentialInput,
    options: { timeout: number; headless: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    let page: Page | null = null;
    let context: any = null;
    
    try {
      const browser = await this.initializeBrowser(options.headless);
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });
      
      page = await context.newPage();
      
      // Navigate to msport.com login page
      await page.goto('https://msport.com/gh/web', {
        waitUntil: 'networkidle',
        timeout: options.timeout
      });
      
      // Wait for the login form to be visible
      await page.waitForSelector('input[type="text"], input[name="username"], input[placeholder*="username" i]', {
        timeout: options.timeout
      });
      
      // Find username and password fields
      const usernameField = await this.findUsernameField(page);
      const passwordField = await this.findPasswordField(page);
      
      if (!usernameField || !passwordField) {
        throw new Error('Could not find login form fields');
      }
      
      // Clear fields and enter credentials
      await usernameField.clear();
      await usernameField.fill(credentials.username);
      
      await passwordField.clear();
      await passwordField.fill(credentials.password);
      
      // Find and click login button
      const loginButton = await this.findLoginButton(page);
      if (!loginButton) {
        throw new Error('Could not find login button');
      }
      
      await loginButton.click();
      
      // Wait for navigation or error message
      const result = await this.waitForLoginResult(page, options.timeout);
      
      return result;
      
    } catch (error) {
      throw error;
    } finally {
      // Ensure proper cleanup in all scenarios
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.error('Error closing page:', closeError);
        }
      }
      
      if (context) {
        try {
          await context.close();
        } catch (closeError) {
          console.error('Error closing context:', closeError);
        }
      }
    }
  }
  
  /**
   * Find the username input field
   */
  private async findUsernameField(page: Page) {
    const selectors = [
      'input[type="text"]',
      'input[name="username"]',
      'input[name="email"]',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]',
      'input[id*="username" i]',
      'input[id*="email" i]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }
  
  /**
   * Find the password input field
   */
  private async findPasswordField(page: Page) {
    const selectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[id*="password" i]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }
  
  /**
   * Find the login button
   */
  private async findLoginButton(page: Page) {
    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button[class*="login"]',
      'button[id*="login"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return null;
  }
  
  /**
   * Wait for login result and determine success/failure
   */
  private async waitForLoginResult(page: Page, timeout: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for either successful navigation or error message
      await Promise.race([
        // Success: URL changes or dashboard appears
        page.waitForURL(url => !url.includes('login') && !url.includes('signin'), { timeout }),
        // Error: Error message appears
        page.waitForSelector('[class*="error"], [class*="alert"], .error-message, .alert-danger', { timeout })
      ]);
      
      // Check if we're on a login page (failure) or dashboard (success)
      const currentUrl = page.url();
      const pageContent = await page.content();
      
      // Check for error indicators
      const hasError = await page.evaluate(() => {
        const errorSelectors = [
          '[class*="error"]',
          '[class*="alert"]',
          '.error-message',
          '.alert-danger',
          '[data-testid*="error"]'
        ];
        
        return errorSelectors.some(selector => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).some(el => 
            el.textContent && el.textContent.toLowerCase().includes('invalid') ||
            el.textContent && el.textContent.toLowerCase().includes('incorrect') ||
            el.textContent && el.textContent.toLowerCase().includes('failed')
          );
        });
      });
      
      if (hasError) {
        const errorText = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], .error-message, .alert-danger');
          const errorTexts = Array.from(errorElements)
            .map(el => el.textContent?.trim())
            .filter(text => text && text.length > 0);
          return errorTexts.join('; ');
        });
        
        return {
          success: false,
          error: errorText || 'Login failed - invalid credentials'
        };
      }
      
      // Check if we're still on login page
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        return {
          success: false,
          error: 'Login failed - still on login page'
        };
      }
      
      // Success - we've navigated away from login page
      return { success: true };
      
    } catch (error) {
      // Timeout or other error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login validation timeout'
      };
    }
  }
  
  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get a human-readable error message for validation errors
   */
  public getErrorMessage(error: string): string {
    if (error.includes('timeout')) {
      return 'Validation timed out. Please check your internet connection and try again.';
    }
    if (error.includes('invalid') || error.includes('incorrect')) {
      return 'Invalid username or password. Please check your credentials and try again.';
    }
    if (error.includes('network')) {
      return 'Network error occurred. Please check your internet connection and try again.';
    }
    if (error.includes('Could not find login form fields')) {
      return 'Unable to access the login page. Please try again later.';
    }
    if (error.includes('Could not find login button')) {
      return 'Login page structure has changed. Please contact support.';
    }
    return `Validation failed: ${error}`;
  }
  
  /**
   * Categorize validation errors for better handling
   */
  public categorizeError(error: string): 'NETWORK' | 'CREDENTIALS' | 'PAGE_STRUCTURE' | 'TIMEOUT' | 'UNKNOWN' {
    if (error.includes('timeout') || error.includes('network')) {
      return 'NETWORK';
    }
    if (error.includes('invalid') || error.includes('incorrect') || error.includes('failed')) {
      return 'CREDENTIALS';
    }
    if (error.includes('Could not find')) {
      return 'PAGE_STRUCTURE';
    }
    if (error.includes('timeout')) {
      return 'TIMEOUT';
    }
    return 'UNKNOWN';
  }
}

// Export a singleton instance
export const credentialValidationService = CredentialValidationService.getInstance();
