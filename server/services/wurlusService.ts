import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { BcsWriter } from '@mysten/bcs';
import config from '../config';

/**
 * Service for interacting with the Wurlus protocol on Sui blockchain
 */
export class WurlusService {
  private provider: SuiClient;
  private readonly packagesConfig = {
    // Wurlus protocol package ID (this would be provided in production)
    wurlusPackageId: '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285',
    // SBETS token ID 
    sbetsTokenId: '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS',
    // Network to connect to
    network: config.blockchain.defaultNetwork || 'testnet'
  };

  constructor() {
    // Initialize SUI client with appropriate network
    const networks: Record<string, string> = {
      'mainnet': 'https://fullnode.mainnet.sui.io:443',
      'testnet': 'https://fullnode.testnet.sui.io:443',
      'devnet': 'https://fullnode.devnet.sui.io:443',
      'localnet': 'http://localhost:9000'
    };
    
    const nodeUrl = networks[this.packagesConfig.network];
    this.provider = new SuiClient({ url: nodeUrl });
    
    console.log(`Initialized WurlusService with network: ${this.packagesConfig.network} (${nodeUrl})`);
  }

  /**
   * Register a wallet with the Wurlus protocol
   */
  async registerWallet(walletAddress: string): Promise<string> {
    console.log(`Registering wallet ${walletAddress} with Wurlus protocol`);
    
    try {
      // In production, this would call the actual smart contract
      // Create transaction block for registration
      const tx = new TransactionBlock();
      
      // Call the registration module on the wurlus package
      tx.moveCall({
        target: `${this.packagesConfig.wurlusPackageId}::registration::register`,
        arguments: [
          tx.pure(walletAddress)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_register_${walletAddress.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error registering wallet with Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Check if a wallet is registered with the Wurlus protocol
   */
  async isWalletRegistered(walletAddress: string): Promise<boolean> {
    console.log(`Checking if wallet ${walletAddress} is registered with Wurlus protocol`);
    
    try {
      // In production, this would query the blockchain to check registration status
      // For now, we'll return true for testing purposes
      return true;
    } catch (error) {
      console.error('Error checking wallet registration status:', error);
      throw error;
    }
  }

  /**
   * Place a bet through the Wurlus protocol
   */
  async placeBet(
    walletAddress: string, 
    eventId: string, 
    marketId: string, 
    outcomeId: string, 
    amount: number, 
    tokenType: 'SUI' | 'SBETS' = 'SUI'
  ): Promise<string> {
    console.log(`Placing bet through Wurlus protocol: ${walletAddress} betting ${amount} ${tokenType} on ${outcomeId}`);
    
    try {
      // Create transaction block for betting
      const tx = new TransactionBlock();
      
      // Prepare bet data using BCS for the Sui Move call
      // Import and use Bcs from @mysten/bcs
      const { BcsWriter, bcs } = require('@mysten/bcs');
      
      // Serialize using proper BCS methods
      bcs.registerStructType('BetData', {
        eventId: 'string',
        marketId: 'string', 
        outcomeId: 'string',
        amount: 'u64'
      });
      
      // Create the bet data object
      const betDataObj = {
        eventId,
        marketId,
        outcomeId,
        amount: BigInt(amount * 1000000) // Convert to smallest unit
      };
      
      // Serialize the bet data
      const betData = bcs.ser('BetData', betDataObj).toBytes();
      
      // Call the betting module on the wurlus package with the appropriate token type
      if (tokenType === 'SUI') {
        tx.moveCall({
          target: `${this.packagesConfig.wurlusPackageId}::betting::place_bet_with_sui`,
          arguments: [
            tx.pure(betData),
            tx.pure(amount * 1000000) // Convert to smallest unit
          ]
        });
      } else {
        tx.moveCall({
          target: `${this.packagesConfig.wurlusPackageId}::betting::place_bet_with_sbets`,
          arguments: [
            tx.pure(betData),
            tx.pure(amount * 1000000) // Convert to smallest unit
          ]
        });
      }
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_bet_${outcomeId.substring(0, 6)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error placing bet through Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Claim winnings from a bet
   */
  async claimWinnings(walletAddress: string, betId: string): Promise<string> {
    console.log(`Claiming winnings for bet ${betId} to wallet ${walletAddress}`);
    
    try {
      // Create transaction block for claiming winnings
      const tx = new TransactionBlock();
      
      // Call the claiming module on the wurlus package
      tx.moveCall({
        target: `${this.packagesConfig.wurlusPackageId}::betting::claim_winnings`,
        arguments: [
          tx.pure(betId)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_claim_${betId.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error claiming winnings from Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Get bets placed by a wallet
   */
  async getWalletBets(walletAddress: string): Promise<any[]> {
    console.log(`Getting bets for wallet ${walletAddress} from Wurlus protocol`);
    
    try {
      // In production, this would query the blockchain for bet objects owned by the wallet
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting wallet bets from Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Get available dividends for a wallet
   */
  async getWalletDividends(walletAddress: string): Promise<any[]> {
    console.log(`Getting dividends for wallet ${walletAddress} from Wurlus protocol`);
    
    try {
      // In production, this would query the blockchain for dividend objects available to the wallet
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting wallet dividends from Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Claim dividends for a wallet
   */
  async claimDividends(walletAddress: string): Promise<string> {
    console.log(`Claiming dividends for wallet ${walletAddress}`);
    
    try {
      // Create transaction block for claiming dividends
      const tx = new TransactionBlock();
      
      // Call the dividend module on the wurlus package
      tx.moveCall({
        target: `${this.packagesConfig.wurlusPackageId}::dividends::claim`,
        arguments: [
          tx.pure(walletAddress)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_dividends_${walletAddress.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error claiming dividends from Wurlus protocol:', error);
      throw error;
    }
  }

  /**
   * Stake tokens in the Wurlus protocol
   */
  async stakeTokens(walletAddress: string, amount: number, periodDays: number): Promise<string> {
    console.log(`Staking ${amount} tokens for ${periodDays} days from wallet ${walletAddress}`);
    
    try {
      // Create transaction block for staking
      const tx = new TransactionBlock();
      
      // Call the staking module on the wurlus package
      tx.moveCall({
        target: `${this.packagesConfig.wurlusPackageId}::staking::stake`,
        arguments: [
          tx.pure(amount * 1000000), // Convert to smallest unit
          tx.pure(periodDays)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_stake_${amount}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error staking tokens with Wurlus protocol:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const wurlusService = new WurlusService();