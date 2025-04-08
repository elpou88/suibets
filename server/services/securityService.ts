/**
 * Security Service for Wal.app Integration
 * Based on documentation from:
 * - https://docs.blockberry.one/reference/sui-security-api
 * - https://docs.wal.app/usage/web-api.html
 */

import crypto from 'crypto';
import config from '../config';

class SecurityService {
  /**
   * Validate a wallet address to ensure it's a valid Sui address
   * @param address The wallet address to validate
   * @returns True if the address is valid, false otherwise
   */
  public validateWalletAddress(address: string): boolean {
    // Basic validation for Sui addresses
    // Address should start with 0x and be followed by 64 hex characters (32 bytes)
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
  
  /**
   * Generate a secure random token
   * @param byteLength The number of bytes to generate
   * @returns A hex string token
   */
  public generateSecureToken(byteLength: number = 32): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }
  
  /**
   * Generate a nonce for authentication or transaction signing
   * @returns A secure nonce string
   */
  public generateNonce(): string {
    return this.generateSecureToken(16);
  }
  
  /**
   * Hash a password using bcrypt (or Node's native crypto)
   * @param password The password to hash
   * @returns The hashed password
   */
  public hashPassword(password: string): string {
    // In a real application, use bcrypt
    // For simplicity, using a basic hash here
    const salt = config.security?.passwordSalt || 'default-salt';
    return crypto
      .createHmac('sha256', salt)
      .update(password)
      .digest('hex');
  }
  
  /**
   * Verify a password against a stored hash
   * @param password The password to verify
   * @param hashedPassword The stored password hash
   * @returns True if the password matches, false otherwise
   */
  public verifyPassword(password: string, hashedPassword: string): boolean {
    const salt = config.security?.passwordSalt || 'default-salt';
    const hash = crypto
      .createHmac('sha256', salt)
      .update(password)
      .digest('hex');
    
    return hash === hashedPassword;
  }
  
  /**
   * Create a HMAC signature for API requests
   * @param payload The payload to sign
   * @param secret The secret key
   * @returns The HMAC signature
   */
  public createHmacSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
  
  /**
   * Verify a HMAC signature for API requests
   * @param payload The payload that was signed
   * @param signature The signature to verify
   * @param secret The secret key
   * @returns True if the signature is valid, false otherwise
   */
  public verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHmacSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
  
  /**
   * Generate a JWT token for user authentication
   * @param userId The user ID
   * @param walletAddress The user's wallet address
   * @param expiresIn Expiration time in seconds
   * @returns The JWT token
   */
  public generateJwtToken(
    userId: string,
    walletAddress: string,
    expiresIn: number = 86400 // 24 hours
  ): string {
    // In a real application, use a proper JWT library
    // For simplicity, creating a mock JWT
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: userId,
      wallet: walletAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };
    
    const secret = config.security?.encryptionKey || 'default-jwt-secret';
    
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64');
    
    return `${base64Header}.${base64Payload}.${signature}`;
  }
  
  /**
   * Create a signed challenge for wallet authentication
   * Based on Wal.app documentation
   * @param walletAddress The wallet address to create a challenge for
   * @returns The challenge and expected response
   */
  public createWalletAuthChallenge(walletAddress: string): {
    challenge: string;
    expectedResponse: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = this.generateNonce();
    
    // Create the challenge message according to Wal.app specs
    const challengeMessage = `I am signing this message to authenticate with Wal.app at timestamp ${timestamp} with nonce ${nonce}`;
    
    // In a real implementation, the expected response would be the wallet's signature
    // For development, we create a mock expected response
    const mockSecret = config.security?.encryptionKey || 'default-secret';
    const expectedResponse = crypto
      .createHmac('sha256', mockSecret)
      .update(challengeMessage)
      .digest('hex');
    
    return {
      challenge: challengeMessage,
      expectedResponse
    };
  }
  
  /**
   * Encrypt sensitive data
   * @param data The data to encrypt
   * @returns The encrypted data as a hex string
   */
  public encryptData(data: string): string {
    const key = config.security?.encryptionKey || 'default-encryption-key-32-chars-long';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt sensitive data
   * @param encryptedData The encrypted data (format: iv:encryptedText)
   * @returns The decrypted data
   */
  public decryptData(encryptedData: string): string {
    const key = config.security?.encryptionKey || 'default-encryption-key-32-chars-long';
    const parts = encryptedData.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Rate limit checker
   * This is a simple implementation that would need to be expanded with Redis or similar in production
   * @param key The rate limit key (e.g. IP address or user ID)
   * @returns Whether the request should be allowed
   */
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  
  public checkRateLimit(key: string): boolean {
    const now = Date.now();
    const limit = config.security?.rateLimit?.max || 100;
    const windowMs = config.security?.rateLimit?.windowMs || 60000; // 1 minute
    
    const record = this.rateLimitMap.get(key);
    
    if (!record || record.resetTime < now) {
      // New window or expired window
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (record.count >= limit) {
      // Rate limit exceeded
      return false;
    }
    
    // Increment count
    record.count += 1;
    this.rateLimitMap.set(key, record);
    
    return true;
  }
  
  /**
   * Validate a transaction blob format
   * @param blob The transaction blob to validate
   * @returns Whether the blob is valid
   */
  public validateTransactionBlob(blob: string): boolean {
    // Basic blob validation
    // Should be a hex string with the 0x prefix
    if (!blob.startsWith('0x') || !/^0x[a-fA-F0-9]+$/.test(blob)) {
      return false;
    }
    
    // Remove 0x prefix for further validation
    const hexData = blob.slice(2);
    
    // Minimum length for valid blob data
    if (hexData.length < 64) {
      return false;
    }
    
    // Additional validation could be performed here
    
    return true;
  }
  
  /**
   * Validate a blob signature
   * @param blob The blob that was signed
   * @param signature The signature to validate
   * @param timestamp The timestamp when the signature was created
   * @param expiration The expiration time of the signature
   * @returns Whether the signature is valid and not expired
   */
  public validateBlobSignature(
    blob: string,
    signature: string,
    timestamp: number,
    expiration: number
  ): boolean {
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > expiration) {
      return false;
    }
    
    // Validate signature format
    if (!/^[a-fA-F0-9]+$/.test(signature)) {
      return false;
    }
    
    // In a real implementation, verify signature cryptographically
    // For development, accept all properly formatted signatures
    
    return true;
  }
}

// Export singleton instance
export const securityService = new SecurityService();