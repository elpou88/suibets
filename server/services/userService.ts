import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { sealService } from './sealService';
import { type User, type InsertUser } from '@shared/schema';

/**
 * UserService handles user-related operations with enhanced security
 * using the Seal pattern from Wal.app for wallet addresses.
 */
export class UserService {
  /**
   * Register a new user
   * @param userData User data to register
   * @returns The created user
   */
  async registerUser(userData: InsertUser): Promise<User> {
    // Check if username is already taken
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already taken');
    }
    
    // Hash password if provided
    let hashedPassword = userData.password;
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(userData.password, salt);
    }
    
    // Generate wallet fingerprint if wallet address provided
    let walletFingerprint = userData.walletFingerprint;
    if (userData.walletAddress && !walletFingerprint) {
      walletFingerprint = sealService.createWalletFingerprint(userData.walletAddress);
    }
    
    // Prepare user object with hashed password and fingerprint
    const userToCreate: InsertUser = {
      ...userData,
      password: hashedPassword,
      walletFingerprint
    };
    
    // Create the user in storage
    return await storage.createUser(userToCreate);
  }
  
  /**
   * Find a user by their wallet address using the fingerprint
   * @param walletAddress The wallet address to look up
   * @returns The found user or undefined
   */
  async findUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    // Generate fingerprint from wallet address
    const fingerprint = sealService.createWalletFingerprint(walletAddress);
    
    // Look up user by fingerprint
    return await storage.getUserByWalletFingerprint(fingerprint);
  }
  
  /**
   * Authenticate a user with username and password
   * @param username Username
   * @param password Plain text password
   * @returns The authenticated user or null if credentials are invalid
   */
  async authenticateUser(username: string, password: string): Promise<User | null> {
    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user || !user.password) {
      return null;
    }
    
    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }
    
    // Update last login time
    const now = new Date();
    await storage.updateUser(user.id, { lastLoginAt: now });
    
    return {
      ...user,
      lastLoginAt: now
    };
  }
  
  /**
   * Connect a wallet to a user account
   * @param userId User ID
   * @param walletAddress Wallet address to connect
   * @param walletType Type of wallet (Sui, Suiet, etc.)
   * @returns Updated user or undefined if user not found
   */
  async connectWallet(userId: number, walletAddress: string, walletType: string): Promise<User | undefined> {
    // Get user by ID
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate wallet fingerprint
    const walletFingerprint = sealService.createWalletFingerprint(walletAddress);
    
    // Check if wallet is already connected to another account
    const existingUser = await storage.getUserByWalletFingerprint(walletFingerprint);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Wallet already connected to another account');
    }
    
    // Update user with wallet info
    return await storage.updateUser(userId, {
      walletAddress,
      walletFingerprint,
      walletType
    });
  }
}

export const userService = new UserService();