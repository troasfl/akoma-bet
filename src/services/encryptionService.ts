import { encrypt, decrypt, generateMasterKey, validateKey, EncryptedData, EncryptionError } from '../utils/encryption';

export interface CredentialEncryptionService {
  encryptCredentials(password: string, masterKey: string): EncryptedData;
  decryptCredentials(encryptedData: EncryptedData, masterKey: string): string;
  generateMasterKey(): string;
  validateMasterKey(key: string): boolean;
}

export class EncryptionService implements CredentialEncryptionService {
  private static instance: EncryptionService;
  
  private constructor() {}
  
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
  
  /**
   * Encrypt user credentials using the master key
   */
  public encryptCredentials(password: string, masterKey: string): EncryptedData {
    try {
      if (!password || password.trim().length === 0) {
        const error = new Error('Password cannot be empty') as EncryptionError;
        error.code = 'INVALID_DATA';
        throw error;
      }
      
      if (!validateKey(masterKey)) {
        const error = new Error('Invalid master key') as EncryptionError;
        error.code = 'INVALID_KEY';
        throw error;
      }
      
      return encrypt(password, masterKey);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      const encryptionError = new Error('Credential encryption failed') as EncryptionError;
      encryptionError.code = 'ENCRYPTION_FAILED';
      throw encryptionError;
    }
  }
  
  /**
   * Decrypt user credentials using the master key
   */
  public decryptCredentials(encryptedData: EncryptedData, masterKey: string): string {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.salt) {
        const error = new Error('Invalid encrypted data') as EncryptionError;
        error.code = 'INVALID_DATA';
        throw error;
      }
      
      if (!validateKey(masterKey)) {
        const error = new Error('Invalid master key') as EncryptionError;
        error.code = 'INVALID_KEY';
        throw error;
      }
      
      return decrypt(encryptedData, masterKey);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      const decryptionError = new Error('Credential decryption failed') as EncryptionError;
      decryptionError.code = 'DECRYPTION_FAILED';
      throw decryptionError;
    }
  }
  
  /**
   * Generate a new master key for credential encryption
   */
  public generateMasterKey(): string {
    return generateMasterKey();
  }
  
  /**
   * Validate that a master key meets security requirements
   */
  public validateMasterKey(key: string): boolean {
    return validateKey(key);
  }
  
  /**
   * Get a human-readable error message for encryption errors
   */
  public getErrorMessage(error: EncryptionError): string {
    switch (error.code) {
      case 'ENCRYPTION_FAILED':
        return 'Failed to encrypt credentials. Please try again.';
      case 'DECRYPTION_FAILED':
        return 'Failed to decrypt credentials. The master key may be incorrect or the data is corrupted.';
      case 'INVALID_KEY':
        return 'Invalid encryption key provided.';
      case 'INVALID_DATA':
        return 'Invalid data provided for encryption/decryption.';
      default:
        return 'An unexpected encryption error occurred.';
    }
  }
}

// Export a singleton instance
export const encryptionService = EncryptionService.getInstance();
