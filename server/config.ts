/**
 * Configuration for the Wurlus Protocol integration with the Sui blockchain
 * Based on Wal.app documentation: 
 * - https://docs.wal.app/usage/setup.html
 * - https://docs.wal.app/dev-guide/data-security.html
 */

import { SuiNetwork } from './services/suiMoveService';

interface AppConfig {
  // API configuration
  api: {
    // This would be provided by Wal.app when registering as a developer
    walAppApiKey?: string;
    // This would be provided by wurlus protocol team
    wurlusApiKey?: string;
    // Base URL for Wal.app API
    walAppBaseUrl?: string;
  };
  
  // Blockchain network configuration
  blockchain: {
    // Default network to use (mainnet, testnet, devnet, localnet)
    defaultNetwork: SuiNetwork;
    // Whether to show transaction logs
    verbose: boolean;
    // Admin wallet for administrative operations
    adminWalletAddress?: string;
  };
  
  // Security configuration based on Wal.app data security documentation
  security?: {
    // Encryption key for sensitive data (should be set via environment variable in production)
    encryptionKey?: string;
    // Salt for password hashing
    passwordSalt?: string;
    // Session secret for Express sessions
    sessionSecret?: string;
    // Enable CSRF protection
    enableCsrf: boolean;
    // Rate limiting settings
    rateLimit: {
      // Max requests per window
      max: number;
      // Time window in milliseconds
      windowMs: number;
    };
    // Content Security Policy settings
    contentSecurityPolicy: boolean;
  };
  
  // Fees configuration
  fees: {
    // Platform fee for betting (0% - removed as requested)
    platformFeeBetting: number;
    // Network fee for betting (1%)
    networkFeeBetting: number;
    // Platform fee for staking (2%)
    platformFeeStaking: number;
    // Platform fee on rewards (10%)
    platformFeeRewards: number;
  };
}

// Default configuration
const config: AppConfig = {
  api: {
    // API keys would be loaded from environment variables in production
    walAppApiKey: process.env.WAL_APP_API_KEY,
    wurlusApiKey: process.env.WURLUS_API_KEY,
    walAppBaseUrl: process.env.WAL_APP_BASE_URL || 'https://api.wal.app'
  },
  blockchain: {
    // Use testnet by default for development
    defaultNetwork: SuiNetwork.TESTNET,
    // Enable verbose logging in development
    verbose: process.env.NODE_ENV !== 'production',
    // Admin wallet would be securely stored in environment variables
    adminWalletAddress: process.env.ADMIN_WALLET_ADDRESS,
  },
  security: {
    // Encryption key should be set via environment variable in production
    encryptionKey: process.env.WAL_ENCRYPTION_KEY || 'default-encryption-key-replace-in-production',
    passwordSalt: process.env.PASSWORD_SALT || 'default-password-salt-replace-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-replace-in-production',
    enableCsrf: process.env.NODE_ENV === 'production',
    rateLimit: {
      max: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  },
  fees: {
    // Updated fee structure
    platformFeeBetting: 0.00, // 0% (removed platform fee)
    networkFeeBetting: 0.01,  // 1%
    platformFeeStaking: 0.02, // 2%
    platformFeeRewards: 0.10  // 10%
  }
};

export { config, AppConfig };