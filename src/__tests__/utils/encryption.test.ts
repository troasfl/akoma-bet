import { encrypt, decrypt, generateMasterKey, validateKey, deriveKey } from '../../utils/encryption';

describe('Encryption Utilities', () => {
  const testData = 'test-password-123';
  const testKey = 'test-master-key-32-chars-long-12345';

  describe('deriveKey', () => {
    it('should derive a key from password and salt', () => {
      const salt = 'test-salt';
      const derivedKey = deriveKey(testKey, salt);
      
      expect(derivedKey).toBeDefined();
      expect(typeof derivedKey).toBe('string');
      expect(derivedKey.length).toBeGreaterThan(0);
    });

    it('should produce consistent results with same inputs', () => {
      const salt = 'test-salt';
      const key1 = deriveKey(testKey, salt);
      const key2 = deriveKey(testKey, salt);
      
      expect(key1).toBe(key2);
    });

    it('should produce different results with different salts', () => {
      const salt1 = 'salt-1';
      const salt2 = 'salt-2';
      const key1 = deriveKey(testKey, salt1);
      const key2 = deriveKey(testKey, salt2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', () => {
      const result = encrypt(testData, testKey);
      
      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different encrypted data for same input', () => {
      const result1 = encrypt(testData, testKey);
      const result2 = encrypt(testData, testKey);
      
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should throw error for empty data', () => {
      expect(() => encrypt('', testKey)).toThrow();
    });

    it('should throw error for invalid key', () => {
      expect(() => encrypt(testData, 'short')).toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', () => {
      const encrypted = encrypt(testData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(testData);
    });

    it('should fail to decrypt with wrong key', () => {
      const encrypted = encrypt(testData, testKey);
      const wrongKey = 'wrong-master-key-32-chars-long-123';
      
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });

    it('should fail to decrypt with corrupted data', () => {
      const encrypted = encrypt(testData, testKey);
      const corrupted = {
        ...encrypted,
        encrypted: 'corrupted-data'
      };
      
      expect(() => decrypt(corrupted, testKey)).toThrow();
    });

    it('should throw error for invalid encrypted data', () => {
      const invalidData = {
        encrypted: '',
        iv: '',
        salt: ''
      };
      
      expect(() => decrypt(invalidData, testKey)).toThrow();
    });
  });

  describe('generateMasterKey', () => {
    it('should generate a valid master key', () => {
      const key = generateMasterKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();
      
      expect(key1).not.toBe(key2);
    });

    it('should generate keys that pass validation', () => {
      const key = generateMasterKey();
      expect(validateKey(key)).toBe(true);
    });
  });

  describe('validateKey', () => {
    it('should validate a proper key', () => {
      expect(validateKey(testKey)).toBe(true);
    });

    it('should reject short keys', () => {
      expect(validateKey('short')).toBe(false);
    });

    it('should reject empty keys', () => {
      expect(validateKey('')).toBe(false);
    });

    it('should accept keys exactly 32 characters long', () => {
      const key32 = 'a'.repeat(32);
      expect(validateKey(key32)).toBe(true);
    });

    it('should accept keys longer than 32 characters', () => {
      const key64 = 'a'.repeat(64);
      expect(validateKey(key64)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should encrypt and decrypt complex data', () => {
      const complexData = 'Complex!@#$%^&*()Password123';
      const encrypted = encrypt(complexData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(complexData);
    });

    it('should handle unicode characters', () => {
      const unicodeData = 'password with émojis 🚀 and symbols @#$%';
      const encrypted = encrypt(unicodeData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(unicodeData);
    });

    it('should handle very long data', () => {
      const longData = 'a'.repeat(1000);
      const encrypted = encrypt(longData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(longData);
    });
  });
});
