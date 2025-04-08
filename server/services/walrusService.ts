import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { BcsWriter } from '@mysten/bcs';
import { SuiMoveService } from './suiMoveService';
import config from '../config';

/**
 * Integrates with the Mysten Labs Walrus protocol for sports betting
 * Based on the documentation at: https://github.com/MystenLabs/awesome-walrus
 */
export class WalrusService {
  private suiMoveService: SuiMoveService;
  private provider: SuiClient;
  private readonly walrusPackageId: string = '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e';
  private readonly sbetsTokenTypeAddress: string = '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS';
  
  constructor() {
    this.suiMoveService = new SuiMoveService();
    
    // Initialize the SuiClient with default configuration
    this.provider = new SuiClient({ url: 'https://fullnode.devnet.sui.io:443' });
  }
  
  /**
   * Create a betting blob that will be signed and passed to the blockchain
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds in integer format (e.g. 200 for 2.00 odds)
   * @param amount The bet amount in integer format
   * @param timestamp The timestamp of the bet creation
   * @returns The blob as a hex string
   */
  async createBettingBlob(
    eventId: number,
    marketId: number,
    outcomeId: number,
    odds: number,
    amount: number,
    timestamp: number
  ): Promise<string> {
    try {
      // Create a BCS writer to serialize the bet parameters
      const writer = new BcsWriter();
      
      // Write the bet parameters to the BCS writer
      writer.write64(BigInt(eventId));
      writer.write64(BigInt(marketId));
      writer.write64(BigInt(outcomeId));
      writer.write64(BigInt(Math.floor(odds * 100))); // Convert decimal odds to integer
      writer.write64(BigInt(amount));
      writer.write64(BigInt(timestamp));
      
      // Convert to hex string
      const hex = Array.from(writer.toBytes())
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (config.blockchain.verbose) {
        console.log('Created betting blob:', hex);
      }
      
      return `0x${hex}`;
    } catch (error) {
      console.error('Error creating betting blob:', error);
      throw error;
    }
  }
  
  /**
   * Place a bet using the SUI token
   * @param senderAddress The sender wallet address
   * @param amount The bet amount
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds
   * @returns Transaction hash
   */
  async placeBetWithSui(
    senderAddress: string,
    amount: number,
    eventId: number,
    marketId: number,
    outcomeId: number,
    odds: number
  ): Promise<string> {
    try {
      // Create a timestamp for the bet
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a betting blob
      const bettingBlob = await this.createBettingBlob(
        eventId,
        marketId,
        outcomeId,
        odds,
        amount,
        timestamp
      );
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the place_bet_with_sui function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::place_bet_with_sui`,
        arguments: [
          tx.pure(eventId.toString()),
          tx.pure(marketId.toString()),
          tx.pure(outcomeId.toString()),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation
          tx.pure(amount.toString()),
          tx.pure(bettingBlob)
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Bet placed with SUI:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error placing bet with SUI:', error);
      throw error;
    }
  }
  
  /**
   * Place a bet using the SBETS token
   * @param senderAddress The sender wallet address
   * @param amount The bet amount
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds
   * @returns Transaction hash
   */
  async placeBetWithSbets(
    senderAddress: string,
    amount: number,
    eventId: number,
    marketId: number,
    outcomeId: number,
    odds: number
  ): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.suiMoveService.getCoinsOfType(
        senderAddress, 
        this.sbetsTokenTypeAddress
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => Number(coin.balance) >= amount);
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Create a timestamp for the bet
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a betting blob
      const bettingBlob = await this.createBettingBlob(
        eventId,
        marketId,
        outcomeId,
        odds,
        amount,
        timestamp
      );
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the place_bet_with_sbets function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::place_bet_with_sbets`,
        arguments: [
          tx.object(coinWithSufficientBalance.coinObjectId),
          tx.pure(eventId.toString()),
          tx.pure(marketId.toString()),
          tx.pure(outcomeId.toString()),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation
          tx.pure(amount.toString()),
          tx.pure(bettingBlob)
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Bet placed with SBETS:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error placing bet with SBETS:', error);
      throw error;
    }
  }
  
  /**
   * Place a parlay bet using SUI tokens
   * @param senderAddress The sender wallet address
   * @param amount The bet amount
   * @param bets Array of bet objects containing eventId, marketId, outcomeId, odds
   * @returns Transaction hash
   */
  async placeParlayWithSui(
    senderAddress: string,
    amount: number,
    bets: Array<{ eventId: number, marketId: number, outcomeId: number, odds: number }>
  ): Promise<string> {
    try {
      // Create a timestamp for the bet
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Serialize bet information for each selection
      const betSelections = bets.map(bet => {
        return {
          eventId: bet.eventId.toString(),
          marketId: bet.marketId.toString(),
          outcomeId: bet.outcomeId.toString(),
          odds: Math.round(bet.odds * 100).toString()
        };
      });
      
      // Call the place_parlay_with_sui function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::place_parlay_with_sui`,
        arguments: [
          tx.pure(JSON.stringify(betSelections)),
          tx.pure(amount.toString()),
          tx.pure(timestamp.toString())
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Parlay placed with SUI:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error placing parlay with SUI:', error);
      throw error;
    }
  }
  
  /**
   * Place a parlay bet using SBETS tokens
   * @param senderAddress The sender wallet address
   * @param amount The bet amount
   * @param bets Array of bet objects containing eventId, marketId, outcomeId, odds
   * @returns Transaction hash
   */
  async placeParlayWithSbets(
    senderAddress: string,
    amount: number,
    bets: Array<{ eventId: number, marketId: number, outcomeId: number, odds: number }>
  ): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.suiMoveService.getCoinsOfType(
        senderAddress, 
        this.sbetsTokenTypeAddress
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => Number(coin.balance) >= amount);
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Create a timestamp for the bet
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Serialize bet information for each selection
      const betSelections = bets.map(bet => {
        return {
          eventId: bet.eventId.toString(),
          marketId: bet.marketId.toString(),
          outcomeId: bet.outcomeId.toString(),
          odds: Math.round(bet.odds * 100).toString()
        };
      });
      
      // Call the place_parlay_with_sbets function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::place_parlay_with_sbets`,
        arguments: [
          tx.object(coinWithSufficientBalance.coinObjectId),
          tx.pure(JSON.stringify(betSelections)),
          tx.pure(amount.toString()),
          tx.pure(timestamp.toString())
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Parlay placed with SBETS:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error placing parlay with SBETS:', error);
      throw error;
    }
  }
  
  /**
   * Claim winnings for a bet
   * @param senderAddress The sender wallet address
   * @param betId The bet ID
   * @returns Transaction hash
   */
  async claimWinnings(senderAddress: string, betId: string): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the claim_winnings function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::claim_winnings`,
        arguments: [
          tx.pure(betId)
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Winnings claimed:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error claiming winnings:', error);
      throw error;
    }
  }
  
  /**
   * Cash out a bet early
   * @param senderAddress The sender wallet address
   * @param betId The bet ID
   * @param cashoutAmount The amount to cash out
   * @returns Transaction hash
   */
  async cashoutBet(senderAddress: string, betId: string, cashoutAmount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the cashout_bet function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::cashout_bet`,
        arguments: [
          tx.pure(betId),
          tx.pure(cashoutAmount.toString())
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Bet cashed out:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error cashing out bet:', error);
      throw error;
    }
  }
  
  /**
   * Stake SBETS tokens
   * @param senderAddress The sender wallet address
   * @param amount The amount to stake
   * @returns Transaction hash
   */
  async stakeTokens(senderAddress: string, amount: number): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.suiMoveService.getCoinsOfType(
        senderAddress, 
        this.sbetsTokenTypeAddress
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => Number(coin.balance) >= amount);
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the stake_tokens function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::stake_tokens`,
        arguments: [
          tx.object(coinWithSufficientBalance.coinObjectId),
          tx.pure(amount.toString())
        ],
        typeArguments: []
      });
      
      // Apply platform fee
      const platformFee = amount * config.fees.platformFeeStaking;
      if (platformFee > 0) {
        tx.moveCall({
          target: `${this.walrusPackageId}::walrus::add_platform_fee`,
          arguments: [
            tx.pure(platformFee.toString())
          ],
          typeArguments: []
        });
      }
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Tokens staked:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  }
  
  /**
   * Unstake SBETS tokens
   * @param senderAddress The sender wallet address
   * @param amount The amount to unstake
   * @returns Transaction hash
   */
  async unstakeTokens(senderAddress: string, amount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the unstake_tokens function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::unstake_tokens`,
        arguments: [
          tx.pure(amount.toString())
        ],
        typeArguments: []
      });
      
      // Apply platform and network fees
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Tokens unstaked:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      throw error;
    }
  }
  
  /**
   * Claim dividends from staking
   * @param senderAddress The sender wallet address
   * @returns Transaction hash
   */
  async claimDividends(senderAddress: string): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the claim_dividends function from the Walrus package
      tx.moveCall({
        target: `${this.walrusPackageId}::walrus::claim_dividends`,
        arguments: [],
        typeArguments: []
      });
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Dividends claimed:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error claiming dividends:', error);
      throw error;
    }
  }
  
  /**
   * Transfer SUI tokens to another address
   * @param senderAddress The sender wallet address
   * @param recipientAddress The recipient wallet address
   * @param amount The amount to transfer
   * @returns Transaction hash
   */
  async transferSui(senderAddress: string, recipientAddress: string, amount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));
      
      // Split the SUI coin and transfer to recipient
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(amountInMist.toString())]);
      tx.transferObjects([coin], tx.pure(recipientAddress));
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('SUI transferred:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error transferring SUI:', error);
      throw error;
    }
  }
  
  /**
   * Transfer SBETS tokens to another address
   * @param senderAddress The sender wallet address
   * @param recipientAddress The recipient wallet address
   * @param amount The amount to transfer
   * @returns Transaction hash
   */
  async transferSbets(senderAddress: string, recipientAddress: string, amount: number): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.suiMoveService.getCoinsOfType(
        senderAddress, 
        this.sbetsTokenTypeAddress
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => BigInt(coin.balance) >= BigInt(amount));
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Split the SBETS coin and transfer to recipient
      const [coin] = tx.splitCoins(
        tx.object(coinWithSufficientBalance.coinObjectId), 
        [tx.pure(amount.toString())]
      );
      tx.transferObjects([coin], tx.pure(recipientAddress));
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Execute the transaction
      const result = await this.suiMoveService.executeSignedTransaction(senderAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('SBETS transferred:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error transferring SBETS:', error);
      throw error;
    }
  }
  
  /**
   * Get user's betting history
   * @param walletAddress The wallet address
   * @returns Array of bet objects
   */
  async getUserBets(walletAddress: string): Promise<any[]> {
    try {
      // In a real implementation, this would query the blockchain for user bets
      // For now, return mock data for testing UI
      return this.getMockBets(walletAddress);
    } catch (error) {
      console.error('Error getting user bets:', error);
      return [];
    }
  }
  
  /**
   * Get user's dividends information
   * @param walletAddress The wallet address
   * @returns Dividends information
   */
  async getUserDividends(walletAddress: string): Promise<any> {
    try {
      // In a real implementation, this would query the blockchain for user dividends
      // For now, return mock data for testing UI
      return {
        stakingAmount: 100.0,
        stakingStartTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        stakingEndTime: Date.now() + 23 * 24 * 60 * 60 * 1000, // 23 days from now
        availableDividends: 2.5,
        claimedDividends: 1.2,
        totalRewards: 3.7,
        platformFees: 0.37, // 10% of total rewards
        apr: 12.5 // 12.5% APR
      };
    } catch (error) {
      console.error('Error getting user dividends:', error);
      return {
        stakingAmount: 0,
        stakingStartTime: Date.now(),
        stakingEndTime: Date.now(),
        availableDividends: 0,
        claimedDividends: 0,
        totalRewards: 0,
        platformFees: 0,
        apr: 0
      };
    }
  }
  
  /**
   * Get mock bets for testing
   * @param walletAddress The wallet address
   * @returns Array of mock bets
   */
  private getMockBets(walletAddress: string): any[] {
    const mockBets = [];
    
    // Generate some mock bets with different statuses
    const statuses = ['pending', 'won', 'lost', 'void', 'cash_out'];
    const sports = ['Football', 'Basketball', 'Tennis', 'Hockey', 'Baseball'];
    const markets = ['Match result', 'Total goals', 'Handicap', 'First to score', 'Both teams to score'];
    
    for (let i = 0; i < 10; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const amount = Math.floor(Math.random() * 100) + 10;
      const odds = (Math.floor(Math.random() * 400) + 100) / 100; // 1.00 to 5.00
      const potential_payout = Math.round(amount * odds);
      
      mockBets.push({
        id: `0x${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`,
        user_id: walletAddress,
        event_id: `${Math.floor(Math.random() * 1000) + 1}`,
        sport: sports[Math.floor(Math.random() * sports.length)],
        market: markets[Math.floor(Math.random() * markets.length)],
        prediction: Math.random() > 0.5 ? 'Home win' : 'Away win',
        odds: Math.round(odds * 100), // Store odds as integer (e.g., 250 for 2.50)
        amount: (amount * 1e9).toString(), // Store amount in MIST
        potential_payout: (potential_payout * 1e9).toString(), // Store payout in MIST
        platform_fee: '0', // 0% platform fee as requested
        network_fee: Math.round(amount * 0.01 * 1e9).toString(), // 1% network fee
        status,
        currency: Math.random() > 0.5 ? 'SUI' : 'SBETS',
        placed_at: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Up to 7 days ago
        settled_at: status !== 'pending' ? Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000) : null // Up to 1 day ago if settled
      });
    }
    
    return mockBets;
  }
}