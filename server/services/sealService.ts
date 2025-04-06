import crypto from 'crypto';

/**
 * SealService implements the Seal security pattern from Wal.app
 * for protecting sensitive user and wallet data.
 * 
 * Reference: https://docs.wal.app/dev-guide/data-security.html
 */
export class SealService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-cbc'; // Using CBC instead of GCM for better compatibility
  private hmacKey: Buffer;
  
  constructor() {
    // In production, these should be set via environment variables
    // and stored securely
    const encryptionKeyBase64 = process.env.SEAL_ENCRYPTION_KEY || 
      'YourSecureBase64EncodedEncryptionKey=='; // Replace with actual key in production
    
    const hmacKeyBase64 = process.env.SEAL_HMAC_KEY || 
      'YourSecureBase64EncodedHmacKey=='; // Replace with actual key in production
    
    this.encryptionKey = Buffer.from(encryptionKeyBase64, 'base64');
    this.hmacKey = Buffer.from(hmacKeyBase64, 'base64');
    
    // Ensure keys have proper lengths
    if (this.encryptionKey.length !== 32) { // 256 bits
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
    
    if (this.hmacKey.length !== 64) { // 512 bits
      throw new Error('HMAC key must be 64 bytes (512 bits)');
    }
  }
  
  /**
   * Seals (encrypts) sensitive data
   * 
   * @param data - The data to encrypt
   * @returns encrypted data as a JSON string with iv and ciphertext
   */
  seal(data: any): string {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt the data
    let encrypted = cipher.update(dataString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Create the sealed object
    const sealedData = {
      iv: iv.toString('base64'),
      ciphertext: encrypted
    };
    
    return JSON.stringify(sealedData);
  }
  
  /**
   * Unseals (decrypts) data that was sealed with the seal method
   * 
   * @param sealedData - The sealed data to decrypt
   * @returns decrypted data, parsed back to original format if possible
   */
  unseal(sealedData: string): any {
    try {
      // Parse the sealed data
      const parsed = JSON.parse(sealedData);
      const { iv, ciphertext } = parsed;
      
      if (!iv || !ciphertext) {
        throw new Error('Invalid sealed data format');
      }
      
      // Convert the IV from base64 to Buffer
      const ivBuffer = Buffer.from(iv, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, ivBuffer);
      
      // Decrypt the data
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse the result as JSON if possible
      try {
        return JSON.parse(decrypted);
      } catch (e) {
        // If parsing fails, return the decrypted string as is
        return decrypted;
      }
    } catch (error) {
      console.error('Error unsealing data:', error);
      throw new Error('Failed to unseal data');
    }
  }
  
  /**
   * Hashes data using HMAC-SHA256
   * This can be used for creating wallet fingerprints that don't expose the original address
   * 
   * @param data - The data to hash
   * @returns The hashed data as a hex string
   */
  hash(data: string): string {
    return crypto
      .createHmac('sha256', this.hmacKey)
      .update(data)
      .digest('hex');
  }
  
  /**
   * Creates a wallet fingerprint from a wallet address
   * This allows you to identify a wallet without storing the actual address
   * 
   * @param walletAddress - The wallet address to generate a fingerprint for
   * @returns A secure fingerprint of the wallet address
   */
  createWalletFingerprint(walletAddress: string): string {
    // Normalize wallet address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Create the fingerprint using HMAC
    return this.hash(normalizedAddress);
  }
  
  /**
   * Verify if a wallet address matches a stored fingerprint
   * 
   * @param walletAddress - The wallet address to check
   * @param fingerprint - The stored fingerprint
   * @returns True if the wallet address matches the fingerprint
   */
  verifyWalletFingerprint(walletAddress: string, fingerprint: string): boolean {
    // Generate fingerprint from the provided wallet address
    const generatedFingerprint = this.createWalletFingerprint(walletAddress);
    
    // Compare with the stored fingerprint (using constant-time comparison to avoid timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(generatedFingerprint, 'hex'),
      Buffer.from(fingerprint, 'hex')
    );
  }
}

export const sealService = new SealService();