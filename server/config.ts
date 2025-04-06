/**
 * Configuration for the Wurlus Protocol integration with the Sui blockchain
 * Based on Wal.app documentation: https://docs.wal.app/usage/setup.html
 */

import { SuiNetwork } from './services/suiMoveService';

interface AppConfig {
  // API configuration
  api: {
    // This would be provided by Wal.app when registering as a developer
    walAppApiKey?: string;
    // This would be provided by wurlus protocol team
    wurlusApiKey?: string;
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
}

// Default configuration
const config: AppConfig = {
  api: {
    // API keys would be loaded from environment variables in production
    walAppApiKey: process.env.WAL_APP_API_KEY,
    wurlusApiKey: process.env.WURLUS_API_KEY,
  },
  blockchain: {
    // Use testnet by default for development
    defaultNetwork: 'testnet',
    // Enable verbose logging in development
    verbose: process.env.NODE_ENV !== 'production',
    // Admin wallet would be securely stored in environment variables
    adminWalletAddress: process.env.ADMIN_WALLET_ADDRESS,
  }
};

export default config;