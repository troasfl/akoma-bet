import * as CryptoJS from 'crypto-js';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface EncryptionError extends Error {
  code: 'ENCRYPTION_FAILED' | 'DECRYPTION_FAILED' | 'INVALID_KEY' | 'INVALID_DATA' | 'VALIDATION_FAILED';
}

/**
 * Generate a secure encryption key using PBKDF2
 */
export function deriveKey(password: string, salt: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (!salt || typeof salt !== 'string') {
    throw new Error('Salt must be a non-empty string');
  }
  
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256 bits = 32 bytes
    iterations: 10000
  }).toString();
}

/**
 * Validate input data for encryption
 */
function validateEncryptionInput(data: string, key: string): void {
  if (!data || typeof data !== 'string' || data.trim().length === 0) {
    const error = new Error('Data cannot be empty and must be a string') as EncryptionError;
    error.code = 'INVALID_DATA';
    throw error;
  }
  
  if (!validateKey(key)) {
    const error = new Error('Invalid encryption key - must be at least 32 characters') as EncryptionError;
    error.code = 'INVALID_KEY';
    throw error;
  }
}

/**
 * Encrypt data using AES-256-CBC
 */
export function encrypt(data: string, key: string): EncryptedData {
  try {
    // Validate input
    validateEncryptionInput(data, key);
    
    // Generate a random salt for key derivation
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    
    // Derive the encryption key
    const derivedKey = deriveKey(key, salt);
    
    // Generate a random initialization vector
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    
    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(data, derivedKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
      salt: salt
    };
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    const encryptionError = new Error('Encryption failed') as EncryptionError;
    encryptionError.code = 'ENCRYPTION_FAILED';
    throw encryptionError;
  }
}

/**
 * Validate encrypted data structure
 */
function validateEncryptedData(encryptedData: EncryptedData): void {
  if (!encryptedData || typeof encryptedData !== 'object') {
    const error = new Error('Invalid encrypted data structure') as EncryptionError;
    error.code = 'INVALID_DATA';
    throw error;
  }
  
  if (!encryptedData.encrypted || typeof encryptedData.encrypted !== 'string') {
    const error = new Error('Invalid encrypted field') as EncryptionError;
    error.code = 'INVALID_DATA';
    throw error;
  }
  
  if (!encryptedData.iv || typeof encryptedData.iv !== 'string') {
    const error = new Error('Invalid initialization vector') as EncryptionError;
    error.code = 'INVALID_DATA';
    throw error;
  }
  
  if (!encryptedData.salt || typeof encryptedData.salt !== 'string') {
    const error = new Error('Invalid salt') as EncryptionError;
    error.code = 'INVALID_DATA';
    throw error;
  }
}

/**
 * Decrypt data using AES-256-CBC
 */
export function decrypt(encryptedData: EncryptedData, key: string): string {
  try {
    // Validate inputs
    validateEncryptedData(encryptedData);
    validateEncryptionInput('dummy', key); // Reuse validation for key
    
    // Derive the encryption key using the stored salt
    const derivedKey = deriveKey(key, encryptedData.salt);
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, derivedKey, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!result) {
      const decryptionError = new Error('Decryption failed - invalid key or corrupted data') as EncryptionError;
      decryptionError.code = 'DECRYPTION_FAILED';
      throw decryptionError;
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    const decryptionError = new Error('Decryption failed') as EncryptionError;
    decryptionError.code = 'DECRYPTION_FAILED';
    throw decryptionError;
  }
}

/**
 * Generate a secure master key for credential encryption
 * This should be stored securely and not in the database
 */
export function generateMasterKey(): string {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

/**
 * Validate that a key meets security requirements
 */
export function validateKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Minimum 256 bits (32 characters) for security
  return key.length >= 32;
}

/**
 * Get a human-readable error message for encryption errors
 */
export function getEncryptionErrorMessage(error: EncryptionError): string {
  switch (error.code) {
    case 'ENCRYPTION_FAILED':
      return 'Failed to encrypt data. Please try again.';
    case 'DECRYPTION_FAILED':
      return 'Failed to decrypt data. The key may be incorrect or the data is corrupted.';
    case 'INVALID_KEY':
      return 'Invalid encryption key provided.';
    case 'INVALID_DATA':
      return 'Invalid data provided for encryption/decryption.';
    case 'VALIDATION_FAILED':
      return 'Data validation failed.';
    default:
      return 'An unexpected encryption error occurred.';
  }
}
