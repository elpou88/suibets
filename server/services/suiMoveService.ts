import { storage } from '../storage';
import { sealService } from './sealService';
import { type InsertBet, type InsertWurlusStaking, type InsertNotification, type InsertWurlusWalletOperation } from '@shared/schema';

// Define available blockchain networks
export enum SuiNetwork {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet'
}

/**
 * SuiMoveService handles interactions with the Sui blockchain
 * and Wurlus protocol using the Move language
 */
export class SuiMoveService {
  private wurlusApiKey: string;
  private walAppApiKey: string;
  private network: SuiNetwork;
  
  constructor(network: SuiNetwork = SuiNetwork.TESTNET) {
    // In production, these should be set via environment variables
    this.wurlusApiKey = process.env.WURLUS_API_KEY || '';
    this.walAppApiKey = process.env.WAL_APP_API_KEY || '';
    this.network = network;
  }
  
  /**
   * Create a betting market on the blockchain
   * @param eventId ID of the event
   * @param marketName Name of the market
   * @param marketType Type of market (moneyline, over-under, etc.)
   * @param outcomes List of possible outcomes with odds
   * @param creatorAddress Creator's wallet address
   * @returns The created market ID or null on failure
   */
  async createMarket(
    eventId: number, 
    marketName: string, 
    marketType: string, 
    outcomes: { name: string, odds: number }[],
    creatorAddress: string
  ): Promise<string | null> {
    try {
      // In a real implementation, this would call the Sui blockchain
      // using JSON-RPC or a Sui SDK to execute the Move code
      
      // Create a wurlus blob for market creation verification
      const wurlusBlob = this.createWurlusBlob('market_creation', {
        eventId,
        marketName,
        marketType,
        outcomes,
        creatorAddress
      });
      
      // For now, simulate the creation with a mock response
      const mockWurlusMarketId = `market_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const transactionHash = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Save the market in our database
      const market = await storage.createMarket({
        eventId,
        name: marketName,
        marketType,
        wurlusMarketId: mockWurlusMarketId,
        creatorAddress,
        status: 'open',
        liquidityPool: 0,
        transactionHash
      });
      
      // Create the outcomes in our database
      for (const outcome of outcomes) {
        const mockWurlusOutcomeId = `outcome_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await storage.createOutcome({
          marketId: market.id,
          name: outcome.name,
          odds: outcome.odds,
          wurlusOutcomeId: mockWurlusOutcomeId,
          status: 'active',
          transactionHash
        });
      }
      
      return mockWurlusMarketId;
    } catch (error) {
      console.error('Error creating market on blockchain:', error);
      return null;
    }
  }
  
  /**
   * Connect a wallet to the Wurlus protocol
   * @param walletAddress User's wallet address
   * @param walletType Type of wallet (Sui, Suiet, etc.)
   * @returns true if connected successfully, false otherwise
   */
  async connectWallet(
    walletAddress: string,
    walletType: string = 'Sui'
  ): Promise<boolean> {
    try {
      // Create a wurlus blob for wallet connection verification
      const wurlusBlob = this.createWurlusBlob('wallet_connection', {
        walletAddress,
        walletType,
        network: this.network,
        timestamp: Date.now()
      });
      
      // In a real implementation, this would interact with the Wurlus protocol
      // on the Sui blockchain to register the wallet
      
      console.log(`Connected wallet ${walletAddress} to Wurlus protocol with blob verification`);
      return true;
    } catch (error) {
      console.error('Error connecting wallet to Wurlus protocol:', error);
      return false;
    }
  }
  
  /**
   * Place a bet on the blockchain using SUI tokens
   * @param walletAddress User's wallet address
   * @param eventId Event ID
   * @param marketName Market name
   * @param selectionName Selection name (outcome)
   * @param betAmount Amount to bet
   * @param odds Odds for the bet
   * @returns The transaction hash or null on failure
   */
  async placeBetWithSui(
    userId: number,
    walletAddress: string,
    eventId: number,
    marketName: string,
    selectionName: string,
    betAmount: number,
    odds: number
  ): Promise<string | null> {
    try {
      // Get the event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Calculate potential payout based on odds
      const potentialPayout = betAmount * odds;
      
      // Calculate platform and network fees
      const platformFee = betAmount * 0.05; // 5%
      const networkFee = betAmount * 0.01; // 1%
      
      // Create a wurlus blob for bet verification
      const wurlusBlob = this.createWurlusBlob('sui_bet', {
        userId,
        walletAddress,
        eventId,
        marketName,
        selectionName,
        betAmount,
        odds,
        potentialPayout,
        platformFee,
        networkFee,
        timestamp: Date.now()
      });
      
      // In a real implementation, this would call the Sui blockchain
      // using JSON-RPC or a Sui SDK to execute the Move code for placing a bet
      
      // For now, simulate the bet with a mock transaction hash
      const txHash = `sui_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const wurlusBetId = `bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Find or create market and outcome
      const market = await this.findOrCreateMarket(event.id, marketName);
      const outcome = await this.findOrCreateOutcome(market.id, selectionName, odds);
      
      // Save the bet in our database
      const betData: InsertBet = {
        userId,
        eventId: event.id,
        marketId: market.id,
        outcomeId: outcome.id,
        betAmount,
        odds,
        prediction: selectionName,
        potentialPayout,
        wurlusBetId,
        txHash,
        platformFee,
        networkFee,
        feeCurrency: 'SUI'
      };
      
      const bet = await storage.createBet(betData);
      
      // Create a notification for the user
      const notification: InsertNotification = {
        userId,
        title: 'Bet Placed with SUI',
        message: `You placed a bet of ${betAmount} SUI on ${selectionName} for ${event.homeTeam} vs ${event.awayTeam}`,
        relatedTxHash: txHash,
        notificationType: 'bet'
      };
      
      await storage.createNotification(notification);
      
      // Create a wallet operation record
      const operation: InsertWurlusWalletOperation = {
        userId,
        walletAddress,
        operationType: 'bet_sui',
        amount: betAmount,
        txHash,
        status: 'completed',
        metadata: {
          event: {
            id: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam
          },
          market: {
            id: market.id,
            name: market.name
          },
          outcome: {
            id: outcome.id,
            name: outcome.name,
            odds
          },
          wurlusBlob: wurlusBlob
        }
      };
      
      await storage.createWalletOperation(operation);
      
      return txHash;
    } catch (error) {
      console.error('Error placing SUI bet on blockchain:', error);
      return null;
    }
  }
  
  /**
   * Place a bet on the blockchain using SBETS tokens (0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS)
   * @param userId User ID
   * @param walletAddress User's wallet address
   * @param eventId Event ID
   * @param marketName Market name
   * @param selectionName Selection name (outcome)
   * @param betAmount Amount to bet
   * @param odds Odds for the bet
   * @returns The transaction hash or null on failure
   */
  async placeBetWithSbets(
    userId: number,
    walletAddress: string,
    eventId: number,
    marketName: string,
    selectionName: string,
    betAmount: number,
    odds: number
  ): Promise<string | null> {
    try {
      // Get the event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Calculate potential payout based on odds
      const potentialPayout = betAmount * odds;
      
      // Calculate platform and network fees
      const platformFee = betAmount * 0.05; // 5%
      const networkFee = betAmount * 0.01; // 1%
      
      // Create a wurlus blob for bet verification
      const wurlusBlob = this.createWurlusBlob('sbets_bet', {
        userId,
        walletAddress,
        eventId,
        marketName,
        selectionName,
        betAmount,
        odds,
        potentialPayout,
        platformFee,
        networkFee,
        tokenAddress: '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS',
        timestamp: Date.now()
      });
      
      // In a real implementation, this would call the Sui blockchain
      // using JSON-RPC or a Sui SDK to execute the Move code for placing a bet with SBETS tokens
      
      // For now, simulate the bet with a mock transaction hash
      const txHash = `sbets_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const wurlusBetId = `bet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Find or create market and outcome
      const market = await this.findOrCreateMarket(event.id, marketName);
      const outcome = await this.findOrCreateOutcome(market.id, selectionName, odds);
      
      // Save the bet in our database
      const betData: InsertBet = {
        userId,
        eventId: event.id,
        marketId: market.id,
        outcomeId: outcome.id,
        betAmount,
        odds,
        prediction: selectionName,
        potentialPayout,
        wurlusBetId,
        txHash,
        platformFee,
        networkFee,
        feeCurrency: 'SBETS'
      };
      
      const bet = await storage.createBet(betData);
      
      // Create a notification for the user
      const notification: InsertNotification = {
        userId,
        title: 'Bet Placed with SBETS',
        message: `You placed a bet of ${betAmount} SBETS on ${selectionName} for ${event.homeTeam} vs ${event.awayTeam}`,
        relatedTxHash: txHash,
        notificationType: 'bet'
      };
      
      await storage.createNotification(notification);
      
      // Create a wallet operation record
      const operation: InsertWurlusWalletOperation = {
        userId,
        walletAddress,
        operationType: 'bet_sbets',
        amount: betAmount,
        txHash,
        status: 'completed',
        metadata: {
          event: {
            id: event.id,
            homeTeam: event.homeTeam,
            awayTeam: event.awayTeam
          },
          market: {
            id: market.id,
            name: market.name
          },
          outcome: {
            id: outcome.id,
            name: outcome.name,
            odds
          },
          wurlusBlob: wurlusBlob
        }
      };
      
      await storage.createWalletOperation(operation);
      
      return txHash;
    } catch (error) {
      console.error('Error placing SBETS bet on blockchain:', error);
      return null;
    }
  }
  
  /**
   * Helper method to find or create a market
   */
  private async findOrCreateMarket(eventId: number, marketName: string) {
    let market = await storage.getMarketByNameAndEventId(marketName, eventId);
    
    if (!market) {
      const wurlusMarketId = `market_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      market = await storage.createMarket({
        eventId,
        name: marketName,
        marketType: 'moneyline', // Default type
        wurlusMarketId,
        status: 'open',
        creatorAddress: 'system',
        transactionHash: 'auto_generated'
      });
    }
    
    return market;
  }
  
  /**
   * Helper method to find or create an outcome
   */
  private async findOrCreateOutcome(marketId: number, outcomeName: string, odds: number) {
    let outcome = await storage.getOutcomeByNameAndMarketId(outcomeName, marketId);
    
    if (!outcome) {
      const wurlusOutcomeId = `outcome_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      outcome = await storage.createOutcome({
        marketId,
        name: outcomeName,
        odds,
        wurlusOutcomeId,
        status: 'active',
        transactionHash: 'auto_generated'
      });
    }
    
    return outcome;
  }
  
  /**
   * Create a wurlus blob for transaction verification
   * @param blobType Type of blob (wallet_connection, sui_bet, sbets_bet, etc.)
   * @param data Data to include in the blob
   * @returns The created blob
   */
  private createWurlusBlob(blobType: string, data: any): string {
    try {
      // Create the blob data
      const blobData = {
        type: blobType,
        data,
        network: this.network,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000),
        version: 1
      };
      
      // Seal the blob data for security
      const sealedBlob = sealService.seal(blobData);
      return sealedBlob;
    } catch (error) {
      console.error('Error creating wurlus blob:', error);
      return '';
    }
  }
  
  /**
   * Verify a wurlus blob
   * @param sealedBlob The sealed blob to verify
   * @returns true if the blob is valid, false otherwise
   */
  verifyWurlusBlob(sealedBlob: string): boolean {
    try {
      // Unseal the blob data
      const blobData = sealService.unseal(sealedBlob);
      
      // Verify the blob structure
      if (!blobData || !blobData.type || !blobData.data || !blobData.timestamp) {
        return false;
      }
      
      // Check if the blob is for this network
      if (blobData.network !== this.network) {
        return false;
      }
      
      // Check if the blob is not expired (within 1 hour)
      const now = Date.now();
      const blobTime = blobData.timestamp;
      if (now - blobTime > 60 * 60 * 1000) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying wurlus blob:', error);
      return false;
    }
  }
  
  /**
   * Stake tokens in the Wurlus protocol
   * @param userId User ID
   * @param walletAddress User's wallet address
   * @param amount Amount to stake
   * @returns The transaction hash or null on failure
   */
  async stakeTokens(
    userId: number,
    walletAddress: string,
    amount: number
  ): Promise<string | null> {
    try {
      // Create a wurlus blob for staking verification
      const wurlusBlob = this.createWurlusBlob('stake', {
        userId,
        walletAddress,
        amount,
        timestamp: Date.now()
      });
      
      // In a real implementation, this would call the Sui blockchain
      // using JSON-RPC or a Sui SDK to execute the Move code for staking
      
      // For now, simulate the staking with a mock transaction hash
      const txHash = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      // Save the staking record in our database
      const stakingData: InsertWurlusStaking = {
        userId,
        walletAddress,
        amountStaked: amount,
        stakingDate: now,
        txHash,
        lockedUntil,
        rewardRate: 0.05 // 5% annual reward rate
      };
      
      await storage.createStaking(stakingData);
      
      // Create a notification for the user
      const notification: InsertNotification = {
        userId,
        title: 'Tokens Staked',
        message: `You staked ${amount} tokens in the Wurlus protocol`,
        relatedTxHash: txHash,
        notificationType: 'stake'
      };
      
      await storage.createNotification(notification);
      
      // Create a wallet operation record
      const operation: InsertWurlusWalletOperation = {
        userId,
        walletAddress,
        operationType: 'stake',
        amount,
        txHash,
        status: 'completed',
        metadata: {
          rewardRate: 0.05,
          lockPeriod: '30 days',
          wurlusBlob
        }
      };
      
      await storage.createWalletOperation(operation);
      
      return txHash;
    } catch (error) {
      console.error('Error staking tokens on blockchain:', error);
      return null;
    }
  }
  
  /**
   * Claim winnings from a bet
   * @param walletAddress User's wallet address
   * @param betId Bet ID to claim winnings from
   * @returns The transaction hash or null on failure
   */
  async claimWinnings(
    walletAddress: string,
    betId: number
  ): Promise<string | null> {
    try {
      // Get the bet
      const bet = await storage.getBet(betId);
      if (!bet) {
        throw new Error('Bet not found');
      }
      
      // Check if bet is won and not already claimed
      if (bet.status !== 'won') {
        throw new Error('Bet is not eligible for claiming');
      }
      
      // Get the user
      const user = await storage.getUser(bet.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify the wallet address matches
      if (user.walletAddress !== walletAddress) {
        throw new Error('Wallet address does not match bet owner');
      }
      
      // Create a wurlus blob for claiming verification
      const wurlusBlob = this.createWurlusBlob('claim_winnings', {
        betId,
        walletAddress,
        userId: user.id,
        potentialPayout: bet.potentialPayout,
        feeCurrency: bet.feeCurrency,
        timestamp: Date.now()
      });
      
      // In a real implementation, this would call the Sui blockchain
      // using JSON-RPC or a Sui SDK to execute the Move code for claiming winnings
      
      // For now, simulate the claiming with a mock transaction hash
      const txHash = `claim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Update the bet status
      await storage.updateBet(betId, { status: 'paid' });
      
      // Create a notification
      const notification: InsertNotification = {
        userId: user.id,
        title: 'Winnings Claimed',
        message: `You claimed ${bet.potentialPayout} ${bet.feeCurrency} from your winning bet`,
        relatedTxHash: txHash,
        notificationType: 'win'
      };
      
      await storage.createNotification(notification);
      
      // Create a wallet operation
      const operation: InsertWurlusWalletOperation = {
        userId: user.id,
        walletAddress,
        operationType: 'claim_winnings',
        amount: bet.potentialPayout,
        txHash,
        status: 'completed',
        metadata: {
          betId,
          betAmount: bet.betAmount,
          currency: bet.feeCurrency,
          wurlusBlob
        }
      };
      
      await storage.createWalletOperation(operation);
      
      return txHash;
    } catch (error) {
      console.error('Error claiming winnings:', error);
      return null;
    }
  }
  
  /**
   * Get user dividends from the Wurlus protocol
   * @param walletAddress User's wallet address
   * @returns Dividend information
   */
  async getUserDividends(walletAddress: string): Promise<{
    totalDividends: number,
    availableDividends: number,
    claimedDividends: number,
    nextDistribution: Date
  }> {
    // In a real implementation, this would call the Sui blockchain
    // to get actual dividend information
    
    // For now, return simulated data
    return {
      totalDividends: 125.5,
      availableDividends: 25.5,
      claimedDividends: 100,
      nextDistribution: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  }
  
  /**
   * Get gas fee estimate for a transaction
   * @param operationType Type of operation (bet, stake, etc.)
   * @param amount Amount involved in the transaction
   * @returns Estimated gas fee
   */
  getGasFeeEstimate(operationType: string, amount: number): number {
    // In a real implementation, this would query the Sui blockchain
    // for the current gas price and estimate the gas usage
    
    // For now, return a simple estimate based on operation type
    switch (operationType) {
      case 'bet_sui':
      case 'bet_sbets':
        return amount * 0.001; // 0.1% of bet amount as gas fee
      case 'stake':
        return amount * 0.0005; // 0.05% of stake amount as gas fee
      case 'unstake':
        return amount * 0.0008; // 0.08% of unstake amount as gas fee
      case 'claim_winnings':
      case 'claim_reward':
        return 0.001; // Fixed gas fee for claiming
      default:
        return 0.0005; // Default gas fee
    }
  }
}

export const suiMoveService = new SuiMoveService();