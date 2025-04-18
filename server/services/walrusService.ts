import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { BcsWriter } from '@mysten/bcs';
import config from '../config';

/**
 * Service for interacting with the Walrus protocol on Sui blockchain
 */
export class WalrusService {
  private provider: SuiClient;
  private readonly packagesConfig = {
    // Walrus protocol package ID (this would be provided in production)
    walrusPackageId: '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285',
    // SBETS token ID 
    sbetsTokenId: '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS',
    // System state object ID (required for many operations)
    systemState: '0x0000000000000000000000000000000000000000000000000000000000000005',
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
    
    console.log(`Initialized WalrusService with network: ${this.packagesConfig.network} (${nodeUrl})`);
  }

  /**
   * Register a wallet with the Walrus protocol
   */
  async registerWallet(walletAddress: string): Promise<string> {
    console.log(`Registering wallet ${walletAddress} with Walrus protocol`);
    
    try {
      // In production, this would call the actual smart contract
      // Create transaction block for registration
      const tx = new TransactionBlock();
      
      // Call the registration module on the walrus package
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::registration::register`,
        arguments: [
          tx.pure(walletAddress)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_register_${walletAddress.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error registering wallet with Walrus protocol:', error);
      throw error;
    }
  }

  /**
   * Check if a wallet is registered with the Walrus protocol
   */
  async isWalletRegistered(walletAddress: string): Promise<boolean> {
    console.log(`Checking if wallet ${walletAddress} is registered with Walrus protocol`);
    
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
   * Place a bet through the Walrus protocol
   * Implementation based on https://docs.wal.app/design/operations.html#betting
   */
  async placeBet(
    walletAddress: string, 
    eventId: string, 
    marketId: string, 
    outcomeId: string, 
    amount: number, 
    tokenType: 'SUI' | 'SBETS' = 'SUI'
  ): Promise<string> {
    console.log(`Placing bet through Walrus protocol: ${walletAddress} betting ${amount} ${tokenType} on ${outcomeId}`);
    
    try {
      // Create transaction block for betting
      const tx = new TransactionBlock();
      
      // Create a Sui transaction based on the Walrus protocol documentation
      // Following the pattern from https://docs.wal.app/design/operations.html#betting
      
      // The amount in smallest units (MIST for SUI, or smallest unit for SBETS)
      const amountInSmallestUnit = amount * 1000000; // Convert to MIST (1 SUI = 10^9 MIST)
      
      // Call the appropriate betting function based on token type
      if (tokenType === 'SUI') {
        // For SUI tokens
        tx.moveCall({
          target: `${this.packagesConfig.walrusPackageId}::betting::place_bet_with_sui`,
          arguments: [
            tx.object(this.packagesConfig.systemState), // System state object reference
            tx.pure.address(walletAddress), // Wallet address (sender)
            tx.pure.string(eventId), // Event ID
            tx.pure.string(marketId), // Market ID
            tx.pure.string(outcomeId), // Outcome ID
            tx.pure.u64(amountInSmallestUnit), // Bet amount in smallest unit
            // Include necessary fee parameters from config
            tx.pure.u64(Math.floor(amountInSmallestUnit * config.fees.networkFeeBetting)) // Network fee
          ]
          // Note: Gas budget is automatically calculated by the SDK
        });
      } else {
        // For SBETS tokens
        tx.moveCall({
          target: `${this.packagesConfig.walrusPackageId}::betting::place_bet_with_sbets`,
          arguments: [
            tx.object(this.packagesConfig.systemState), // System state object reference
            tx.pure.address(walletAddress), // Wallet address (sender)
            tx.pure.string(eventId), // Event ID
            tx.pure.string(marketId), // Market ID
            tx.pure.string(outcomeId), // Outcome ID
            tx.pure.u64(amountInSmallestUnit), // Bet amount in smallest unit
            // Token ID for SBETS 
            tx.object(this.packagesConfig.sbetsTokenId), // SBETS token type
            // Include necessary fee parameters from config
            tx.pure.u64(Math.floor(amountInSmallestUnit * config.fees.networkFeeBetting)) // Network fee
          ]
          // Note: Gas budget is automatically calculated by the SDK
        });
      }
      
      // In a real implementation, this transaction would be signed by the user's wallet and executed
      // For now, we'll return a serialized representation of the transaction
      // For TypeScript compatibility with the Sui SDK
      return tx.serialize();
    } catch (error) {
      console.error('Error placing bet through Walrus protocol:', error);
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
      
      // Call the claiming module on the walrus package
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::betting::claim_winnings`,
        arguments: [
          tx.pure(betId)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_claim_${betId.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error claiming winnings from Walrus protocol:', error);
      throw error;
    }
  }

  /**
   * Get bets placed by a wallet
   */
  async getWalletBets(walletAddress: string): Promise<any[]> {
    console.log(`Getting bets for wallet ${walletAddress} from Walrus protocol`);
    
    try {
      // In production, this would query the blockchain for bet objects owned by the wallet
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting wallet bets from Walrus protocol:', error);
      throw error;
    }
  }

  /**
   * Get available dividends for a wallet
   */
  async getWalletDividends(walletAddress: string): Promise<any[]> {
    console.log(`Getting dividends for wallet ${walletAddress} from Walrus protocol`);
    
    try {
      // In production, this would query the blockchain for dividend objects available to the wallet
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting wallet dividends from Walrus protocol:', error);
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
      
      // Call the dividend module on the walrus package
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::dividends::claim`,
        arguments: [
          tx.pure(walletAddress)
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll just return a mock transaction hash
      const mockTxHash = `${Date.now().toString(16)}_dividends_${walletAddress.substring(0, 8)}`;
      
      return mockTxHash;
    } catch (error) {
      console.error('Error claiming dividends from Walrus protocol:', error);
      throw error;
    }
  }

  /**
   * Stake tokens in the Walrus protocol using DeFi features
   * Implementation based on https://docs.wal.app/design/operations.html#defi-yield-farming
   */
  async stakeTokens(walletAddress: string, amount: number, periodDays: number): Promise<string> {
    console.log(`Staking ${amount} tokens for ${periodDays} days from wallet ${walletAddress}`);
    
    try {
      // Create transaction block for staking
      const tx = new TransactionBlock();
      
      // Call the staking module on the walrus package
      // Based on the Walrus protocol documentation, we need to:
      // 1. Get the system state object
      // 2. Get the staking pool object
      // 3. Call the stake function with these objects and the amount
      
      // Call the staking module with system state reference
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::staking::stake_tokens`,
        arguments: [
          tx.object(this.packagesConfig.systemState), // System state object
          tx.pure.u64(amount * 1000000), // Convert to smallest unit (MIST for SUI)
          tx.pure.u64(periodDays * 24 * 60 * 60) // Convert days to seconds for the contract
        ]
      });
      
      // In a real implementation, this transaction would be signed by the user's wallet
      // For now, we'll return the transaction bytes that would be sent to the blockchain
      const txBytes = await tx.build({ client: this.provider });
      return txBytes.toString('hex');
    } catch (error) {
      console.error('Error staking tokens with Walrus protocol:', error);
      throw error;
    }
  }
  
  /**
   * Unstake tokens from the Walrus protocol
   * Implementation based on https://docs.wal.app/design/operations.html#defi-yield-farming
   */
  async unstakeTokens(walletAddress: string, stakeId: string): Promise<string> {
    console.log(`Unstaking tokens with ID ${stakeId} for wallet ${walletAddress}`);
    
    try {
      // Create transaction block for unstaking
      const tx = new TransactionBlock();
      
      // Call the unstake function on the staking module
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::staking::unstake_tokens`,
        arguments: [
          tx.object(this.packagesConfig.systemState), // System state object
          tx.object(stakeId) // The stake ID object to unstake
        ]
      });
      
      // Return the transaction bytes that would be sent to the blockchain
      const txBytes = await tx.build({ client: this.provider });
      return txBytes.toString('hex');
    } catch (error) {
      console.error('Error unstaking tokens from Walrus protocol:', error);
      throw error;
    }
  }
  
  /**
   * Harvest yield from a staked position
   * Implementation based on https://docs.wal.app/design/operations.html#defi-yield-farming
   */
  async harvestYield(walletAddress: string, stakeId: string): Promise<string> {
    console.log(`Harvesting yield from stake ${stakeId} for wallet ${walletAddress}`);
    
    try {
      // Create transaction block for harvesting yield
      const tx = new TransactionBlock();
      
      // Call the harvest function on the staking module
      tx.moveCall({
        target: `${this.packagesConfig.walrusPackageId}::staking::harvest_yield`,
        arguments: [
          tx.object(this.packagesConfig.systemState), // System state object
          tx.object(stakeId) // The stake ID object to harvest yield from
        ]
      });
      
      // Return the transaction bytes that would be sent to the blockchain
      const txBytes = await tx.build({ client: this.provider });
      return txBytes.toString('hex');
    } catch (error) {
      console.error('Error harvesting yield from Walrus protocol:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const walrusService = new WalrusService();