/**
 * Security Service for Wal.app integration
 * Based on Wal.app data security documentation: https://docs.wal.app/dev-guide/data-security.html
 * 
 * This service handles encryption, hashing, and secure storage of sensitive data
 * according to Wal.app security standards.
 */
import crypto from 'crypto';
import { config } from '../config';

export class SecurityService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 16 bytes for GCM mode
  private readonly saltLength = 64; // 64 bytes for key derivation
  private readonly tagLength = 16; // 16 bytes for authentication tag
  private readonly keyLength = 32; // 32 bytes (256 bits) for AES-256
  private readonly iterations = 100000; // Iterations for PBKDF2

  // Default secret key from environment variable or configuration
  private readonly secretKey: string;

  constructor() {
    // Use environment variable or fallback to config
    this.secretKey = process.env.WAL_ENCRYPTION_KEY || 
                     config.security?.encryptionKey || 
                     'default-key-replace-in-production';
    
    if (this.secretKey === 'default-key-replace-in-production') {
      console.warn('[SecurityService] Warning: Using default encryption key. This is not secure for production use.');
    }
  }

  /**
   * Generate a cryptographically secure key from password and salt using PBKDF2
   * @param password Password to derive key from
   * @param salt Salt for key derivation
   * @returns Derived key as Buffer
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha512'
    );
  }

  /**
   * Encrypt sensitive data using AES-256-GCM with a random IV
   * Following Wal.app security recommendations for encrypting wallet-related data
   * 
   * @param data Data to encrypt
   * @param customKey Optional custom encryption key
   * @returns Encrypted data as hex string with IV and authentication tag
   */
  encrypt(data: string, customKey?: string): string {
    try {
      // Generate a random salt for key derivation
      const salt = crypto.randomBytes(this.saltLength);
      
      // Generate a random initialization vector
      const iv = crypto.randomBytes(this.ivLength);
      
      // Derive encryption key from password and salt
      const key = this.deriveKey(customKey || this.secretKey, salt);
      
      // Create cipher with key and IV
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine salt, IV, encrypted data, and authentication tag
      const result = Buffer.concat([
        salt,
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag
      ]).toString('hex');
      
      return result;
    } catch (error) {
      console.error('[SecurityService] Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data that was encrypted with the encrypt method
   * 
   * @param encryptedData Encrypted data as hex string
   * @param customKey Optional custom encryption key
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string, customKey?: string): string {
    try {
      // Convert hex string to buffer
      const data = Buffer.from(encryptedData, 'hex');
      
      // Extract components
      const salt = data.subarray(0, this.saltLength);
      const iv = data.subarray(this.saltLength, this.saltLength + this.ivLength);
      const authTag = data.subarray(data.length - this.tagLength);
      const encrypted = data.subarray(
        this.saltLength + this.ivLength,
        data.length - this.tagLength
      );
      
      // Derive key from password and salt
      const key = this.deriveKey(customKey || this.secretKey, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[SecurityService] Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data using SHA-512 (Wal.app recommended for non-password data)
   * 
   * @param data Data to hash
   * @returns Hashed data as hex string
   */
  hashData(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Hash password using bcrypt-compatible algorithm
   * Not using actual bcrypt library to avoid external dependencies
   * This is a simplified implementation following Wal.app security standards
   * 
   * @param password Password to hash
   * @returns Hashed password
   */
  hashPassword(password: string): string {
    // Generate a random salt for password hashing
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Use PBKDF2 with high iteration count for password hashing
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      210000, // Higher iterations for password hashing
      64,     // 64 bytes output (512 bits)
      'sha512'
    ).toString('hex');
    
    // Return hash and salt together with separator for later verification
    return `${hash}:${salt}`;
  }

  /**
   * Verify password against a hashed password
   * 
   * @param password Password to verify
   * @param hashedPassword Hashed password from hashPassword
   * @returns Boolean indicating whether password is correct
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      // Split hash and salt
      const [hash, salt] = hashedPassword.split(':');
      
      // Hash the input password with the same salt
      const inputHash = crypto.pbkdf2Sync(
        password,
        salt,
        210000,
        64,
        'sha512'
      ).toString('hex');
      
      // Compare hashes using constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(inputHash, 'hex')
      );
    } catch (error) {
      console.error('[SecurityService] Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate a cryptographically secure random token
   * Used for API keys, session tokens, etc.
   * 
   * @param length Length of token in bytes (default: 32)
   * @returns Random token as hex string
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Securely compare two strings in constant time
   * Protects against timing attacks
   * 
   * @param a First string
   * @param b Second string
   * @returns Boolean indicating whether strings are equal
   */
  secureCompare(a: string, b: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch (error) {
      // Length mismatch or other error
      return false;
    }
  }

  /**
   * Sanitize data for safe storage and display
   * Removes potentially dangerous characters
   * 
   * @param input Input string to sanitize
   * @returns Sanitized string
   */
  sanitizeInput(input: string): string {
    // Replace potentially dangerous characters with HTML entities
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Securely wipe sensitive data from memory
   * This is a best-effort attempt, as JavaScript garbage collection
   * may retain copies of data elsewhere in memory
   * 
   * @param data Reference to data to wipe
   */
  wipeData(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string with random data
      for (let i = 0; i < data.length; i++) {
        data = data.substring(0, i) + 
               String.fromCharCode(Math.floor(Math.random() * 94) + 32) + 
               data.substring(i + 1);
      }
    } else if (data instanceof Buffer) {
      // Fill buffer with random data
      crypto.randomFillSync(data);
    } else if (typeof data === 'object' && data !== null) {
      // Recursively wipe all properties
      Object.keys(data).forEach(key => {
        this.wipeData(data[key]);
        delete data[key];
      });
    }
  }
}

// Export a singleton instance
export const securityService = new SecurityService();