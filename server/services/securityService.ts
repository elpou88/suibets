/**
 * SecurityService for Wal.app integration
 * Based on Wal.app data security documentation: https://docs.wal.app/dev-guide/data-security.html
 * 
 * This service handles encryption, password hashing, and other security features
 * to protect user data and follow Wal.app security guidelines.
 */

import crypto from 'crypto';
import { config } from '../config';

export interface EncryptionResult {
  iv: string;
  encryptedData: string;
}

export class SecurityService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-cbc';
  private passwordSalt: string;

  constructor() {
    // Get encryption key from config, or generate one if not available
    const key = config.security?.encryptionKey || this.generateSecureRandomKey();
    this.encryptionKey = Buffer.from(key, 'hex');
    
    // Get password salt from config, or generate one if not available
    this.passwordSalt = config.security?.passwordSalt || this.generateSalt();
  }

  /**
   * Generate a cryptographically secure random key
   * @returns A hex string representing the key
   */
  private generateSecureRandomKey(): string {
    // Generate a 32-byte (256-bit) random key for AES-256
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a random salt for password hashing
   * @returns A hex string representing the salt
   */
  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   * @param data The plaintext data to encrypt
   * @returns EncryptionResult containing IV and encrypted data
   */
  public encrypt(data: string): EncryptionResult {
    try {
      // Generate a random initialization vector (IV)
      const iv = crypto.randomBytes(16);
      
      // Create cipher using the encryption key and IV
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data that was encrypted using the encrypt method
   * @param encryptedData The encrypted data
   * @param iv The initialization vector used for encryption
   * @returns The decrypted plaintext
   */
  public decrypt(encryptedData: string, iv: string): string {
    try {
      // Convert the IV from hex to Buffer
      const ivBuffer = Buffer.from(iv, 'hex');
      
      // Create decipher using the encryption key and IV
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, ivBuffer);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a password using PBKDF2 (Password-Based Key Derivation Function 2)
   * @param password The plaintext password to hash
   * @returns The password hash as a hex string
   */
  public hashPassword(password: string): string {
    try {
      // Using PBKDF2 with 10000 iterations and SHA-512 hash
      const hash = crypto.pbkdf2Sync(
        password,
        this.passwordSalt,
        10000, // Iterations
        64,    // Key length
        'sha512'
      );
      
      return hash.toString('hex');
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a stored hash
   * @param password The plaintext password to verify
   * @param storedHash The stored password hash
   * @returns True if the password matches, false otherwise
   */
  public verifyPassword(password: string, storedHash: string): boolean {
    try {
      // Hash the input password using the same method
      const hash = this.hashPassword(password);
      
      // Compare the hashes using a timing-safe comparison function
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate a secure random token for CSRF protection or session IDs
   * @param length The length of the token in bytes (default: 32)
   * @returns A secure random token as a hex string
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate the structure and format of a wallet address
   * @param walletAddress The wallet address to validate
   * @returns True if the wallet address is valid, false otherwise
   */
  public validateWalletAddress(walletAddress: string): boolean {
    // Basic format check for Sui wallet addresses
    // Sui addresses are 0x followed by 32-64 hex characters
    const walletRegex = /^0x[a-fA-F0-9]{32,64}$/;
    return walletRegex.test(walletAddress);
  }

  /**
   * Sanitize input data to prevent XSS attacks
   * @param input The input string to sanitize
   * @returns Sanitized string
   */
  public sanitizeInput(input: string): string {
    // Basic XSS prevention by replacing potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Create a SHA-256 hash of the provided data
   * @param data The data to hash
   * @returns SHA-256 hash as a hex string
   */
  public sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// Export a singleton instance of the service
export const securityService = new SecurityService();