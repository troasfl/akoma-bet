import { EncryptedData } from '../utils/encryption';

export interface UserCredentials {
  id: string;
  userId: string;
  username: string;
  encryptedPassword: string;
  iv: string; // Initialization vector for AES encryption
  salt: string; // Salt for key derivation
  isValidated: boolean;
  lastValidationAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  isValidated: boolean;
  lastValidationAt: Date | null;
  isAutomationEnabled: boolean;
}

export interface CredentialInput {
  username: string;
  password: string;
}

export interface CredentialUpdate {
  username?: string;
  password?: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  error?: string;
  validationTime?: number; // Time taken for validation in milliseconds
}

export interface CredentialEncryptedData {
  username: string;
  encryptedPassword: EncryptedData;
}

export interface CredentialError {
  code: 'VALIDATION_FAILED' | 'ENCRYPTION_FAILED' | 'DECRYPTION_FAILED' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'TIMEOUT';
  message: string;
  details?: string;
}

export interface CredentialAuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}
