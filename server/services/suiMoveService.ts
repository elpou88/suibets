import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import config from '../config';

/**
 * Service for Sui Move interactions like wallet connection and transactions
 */
export class SuiMoveService {
  private provider: SuiClient;

  constructor() {
    // Initialize the SuiClient with default configuration
    this.provider = new SuiClient({ url: 'https://fullnode.devnet.sui.io:443' });
  }

  /**
   * Connect to a wallet and verify its validity
   * @param walletAddress The wallet address to connect
   * @returns Boolean indicating if the wallet is valid
   */
  async connectWallet(walletAddress: string): Promise<boolean> {
    try {
      // Verify the wallet exists by querying its balance
      const balance = await this.provider.getBalance({
        owner: walletAddress
      });
      
      if (config.blockchain.verbose) {
        console.log(`Connected wallet ${walletAddress} with balance:`, balance);
      }
      
      return balance !== null;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  }
  
  /**
   * Get the balance of a wallet
   * @param walletAddress The wallet address
   * @returns The wallet balance in SUI
   */
  async getWalletBalance(walletAddress: string): Promise<{ 
    sui: number; 
    sbets: number;
  }> {
    try {
      // Get SUI balance
      const suiBalance = await this.provider.getBalance({
        owner: walletAddress
      });
      
      // Get SBETS balance
      const sbetsCoins = await this.getCoinsOfType(
        walletAddress, 
        '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS'
      );
      
      const sbetsBalance = sbetsCoins.reduce((total, coin) => {
        return total + Number(coin.balance);
      }, 0);
      
      return {
        sui: Number(suiBalance.totalBalance) / 1_000_000_000, // Convert from MIST to SUI
        sbets: sbetsBalance
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return { sui: 0, sbets: 0 };
    }
  }
  
  /**
   * Get all coins of a specific type owned by a wallet
   * @param walletAddress The wallet address
   * @param coinType The coin type
   * @returns Array of coins
   */
  async getCoinsOfType(walletAddress: string, coinType: string): Promise<any[]> {
    try {
      const coins = await this.provider.getCoins({
        owner: walletAddress,
        coinType
      });
      
      return coins.data;
    } catch (error) {
      console.error(`Error getting coins of type ${coinType}:`, error);
      return [];
    }
  }
  
  /**
   * Execute a signed transaction
   * @param senderAddress The sender wallet address
   * @param tx The transaction block
   * @returns Transaction response
   */
  async executeSignedTransaction(senderAddress: string, tx: TransactionBlock): Promise<any> {
    try {
      // This is a placeholder since we don't have the wallet adapter here
      // In a real implementation, this would use wallet-standard to sign and execute
      // For now, we'll just simulate a successful transaction
      if (config.blockchain.verbose) {
        console.log(`Executing transaction from ${senderAddress}`);
      }
      
      // For testing, we're returning a simulated digest
      return {
        digest: `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`
      };
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }
  
  /**
   * Get user registration status with the Walrus protocol
   * @param walletAddress The wallet address
   * @returns Boolean indicating if the user is registered
   */
  async getUserRegistrationStatus(walletAddress: string): Promise<boolean> {
    try {
      // In a real implementation, this would query the Walrus protocol
      // For now, we'll just assume the user is registered
      return true;
    } catch (error) {
      console.error('Error checking user registration status:', error);
      return false;
    }
  }
  
  /**
   * Transfer SUI tokens to another wallet
   * @param senderAddress The sender wallet address
   * @param recipientAddress The recipient wallet address
   * @param amount The amount to transfer
   * @returns Transaction hash
   */
  async transferSui(senderAddress: string, recipientAddress: string, amount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Split the SUI coin and transfer to recipient
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
      tx.transferObjects([coin], tx.pure(recipientAddress));
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(senderAddress, tx);
      
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
   * Transfer SBETS tokens to another wallet
   * @param senderAddress The sender wallet address
   * @param recipientAddress The recipient wallet address
   * @param amount The amount to transfer
   * @returns Transaction hash
   */
  async transferSbets(senderAddress: string, recipientAddress: string, amount: number): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.getCoinsOfType(
        senderAddress, 
        '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS'
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => BigInt(coin.balance) >= BigInt(amount));
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Split the SBETS coin and transfer to recipient
      const [coin] = tx.splitCoins(tx.object(coinWithSufficientBalance.coinObjectId), [tx.pure(amount)]);
      tx.transferObjects([coin], tx.pure(recipientAddress));
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(senderAddress, tx);
      
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
   * Create a market for betting
   * @param adminAddress The admin wallet address
   * @param eventId The event ID
   * @param marketName The market name
   * @param outcomes Array of outcome names
   * @param startTime The start time of the market
   * @param endTime The end time of the market
   * @returns Transaction hash
   */
  async createMarket(
    adminAddress: string,
    eventId: number,
    marketName: string,
    outcomes: string[],
    startTime: number,
    endTime: number
  ): Promise<string> {
    try {
      // Verify admin rights
      if (adminAddress !== config.blockchain.adminWalletAddress) {
        throw new Error('Only admin can create markets');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the create_market function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::create_market',
        arguments: [
          tx.pure(eventId.toString()),
          tx.pure(marketName),
          tx.pure(JSON.stringify(outcomes)),
          tx.pure(startTime.toString()),
          tx.pure(endTime.toString())
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(adminAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Market created:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error creating market:', error);
      throw error;
    }
  }
  
  /**
   * Create an outcome for a market
   * @param adminAddress The admin wallet address
   * @param marketId The market ID
   * @param outcomeName The outcome name
   * @param odds The odds for the outcome
   * @returns Transaction hash
   */
  async createOutcome(
    adminAddress: string,
    marketId: number,
    outcomeName: string,
    odds: number
  ): Promise<string> {
    try {
      // Verify admin rights
      if (adminAddress !== config.blockchain.adminWalletAddress) {
        throw new Error('Only admin can create outcomes');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the create_outcome function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::create_outcome',
        arguments: [
          tx.pure(marketId.toString()),
          tx.pure(outcomeName),
          tx.pure(Math.round(odds * 100).toString()) // Convert to integer representation
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(adminAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Outcome created:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error creating outcome:', error);
      throw error;
    }
  }
  
  /**
   * Settle a market with the winning outcome
   * @param adminAddress The admin wallet address
   * @param marketId The market ID
   * @param outcomeId The winning outcome ID
   * @returns Transaction hash
   */
  async settleMarket(
    adminAddress: string,
    marketId: number,
    outcomeId: number
  ): Promise<string> {
    try {
      // Verify admin rights
      if (adminAddress !== config.blockchain.adminWalletAddress) {
        throw new Error('Only admin can settle markets');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the settle_market function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::settle_market',
        arguments: [
          tx.pure(marketId.toString()),
          tx.pure(outcomeId.toString())
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(adminAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Market settled:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error settling market:', error);
      throw error;
    }
  }

  /**
   * Place a bet with SUI tokens
   * @param userId The user ID
   * @param walletAddress The wallet address
   * @param eventId The event ID
   * @param marketName The market name
   * @param prediction The prediction (outcome)
   * @param amount The bet amount
   * @param odds The odds
   * @returns Transaction hash
   */
  async placeBetWithSui(
    userId: number,
    walletAddress: string,
    eventId: number,
    marketName: string,
    prediction: string,
    amount: number,
    odds: number
  ): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));
      
      // Split the SUI coin for the bet
      const [betCoin] = tx.splitCoins(tx.gas, [tx.pure(amountInMist.toString())]);
      
      // Calculate platform fee (0%) and network fee (1%)
      const platformFee = 0; // No platform fee as requested
      const networkFee = Math.round(amount * 0.01 * 1_000_000_000); // 1% network fee
      
      // Calculate potential payout
      const potentialPayout = Math.round(amount * odds * 1_000_000_000);
      
      // Call the place_bet function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::place_bet',
        arguments: [
          betCoin,
          tx.pure(eventId.toString()),
          tx.pure(marketName),
          tx.pure(prediction),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation (e.g., 2.5 -> 250)
          tx.pure(potentialPayout.toString()),
          tx.pure(platformFee.toString()),
          tx.pure(networkFee.toString()),
          tx.pure(userId.toString()),
          tx.pure('SUI')
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
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
   * Place a bet with SBETS tokens
   * @param userId The user ID
   * @param walletAddress The wallet address
   * @param eventId The event ID
   * @param marketName The market name
   * @param prediction The prediction (outcome)
   * @param amount The bet amount
   * @param odds The odds
   * @returns Transaction hash
   */
  async placeBetWithSbets(
    userId: number,
    walletAddress: string,
    eventId: number,
    marketName: string,
    prediction: string,
    amount: number,
    odds: number
  ): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.getCoinsOfType(
        walletAddress, 
        '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS'
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => BigInt(coin.balance) >= BigInt(amount));
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Split the SBETS coin for the bet
      const [betCoin] = tx.splitCoins(
        tx.object(coinWithSufficientBalance.coinObjectId), 
        [tx.pure(amount.toString())]
      );
      
      // Calculate platform fee (0%) and network fee (1%)
      const platformFee = 0; // No platform fee as requested
      const networkFee = Math.round(amount * 0.01); // 1% network fee
      
      // Calculate potential payout
      const potentialPayout = Math.round(amount * odds);
      
      // Call the place_bet function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::place_bet',
        arguments: [
          betCoin,
          tx.pure(eventId.toString()),
          tx.pure(marketName),
          tx.pure(prediction),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation (e.g., 2.5 -> 250)
          tx.pure(potentialPayout.toString()),
          tx.pure(platformFee.toString()),
          tx.pure(networkFee.toString()),
          tx.pure(userId.toString()),
          tx.pure('SBETS')
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
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
   * Create a parlay bet with SUI tokens
   * @param userId The user ID
   * @param walletAddress The wallet address
   * @param amount The bet amount
   * @param totalOdds The total odds
   * @param legs Array of parlay legs
   * @returns Transaction hash
   */
  async createParlayWithSui(
    userId: number,
    walletAddress: string,
    amount: number,
    totalOdds: number,
    legs: any[]
  ): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));
      
      // Split the SUI coin for the bet
      const [betCoin] = tx.splitCoins(tx.gas, [tx.pure(amountInMist.toString())]);
      
      // Calculate platform fee (0%) and network fee (1%)
      const platformFee = 0; // No platform fee as requested
      const networkFee = Math.round(amount * 0.01 * 1_000_000_000); // 1% network fee
      
      // Calculate potential payout
      const potentialPayout = Math.round(amount * totalOdds * 1_000_000_000);
      
      // Format legs for the Move call
      const formattedLegs = legs.map(leg => ({
        event_id: leg.eventId.toString(),
        market_id: leg.marketId ? leg.marketId.toString() : '0',
        market_name: leg.marketName || 'Match result',
        prediction: leg.prediction,
        odds: Math.round(leg.odds * 100).toString()
      }));
      
      // Serialize legs to JSON for the Move call
      const legsJson = JSON.stringify(formattedLegs);
      
      // Call the create_parlay function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::create_parlay',
        arguments: [
          betCoin,
          tx.pure(legsJson),
          tx.pure(Math.round(totalOdds * 100).toString()),
          tx.pure(potentialPayout.toString()),
          tx.pure(platformFee.toString()),
          tx.pure(networkFee.toString()),
          tx.pure(userId.toString()),
          tx.pure('SUI')
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Parlay created with SUI:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error creating parlay with SUI:', error);
      throw error;
    }
  }
  
  /**
   * Create a parlay bet with SBETS tokens
   * @param userId The user ID
   * @param walletAddress The wallet address
   * @param amount The bet amount
   * @param totalOdds The total odds
   * @param legs Array of parlay legs
   * @returns Transaction hash
   */
  async createParlayWithSbets(
    userId: number,
    walletAddress: string,
    amount: number,
    totalOdds: number,
    legs: any[]
  ): Promise<string> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.getCoinsOfType(
        walletAddress, 
        '0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285::sbets::SBETS'
      );
      
      if (!coins || coins.length === 0) {
        throw new Error('No SBETS tokens found in the wallet');
      }
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => BigInt(coin.balance) >= BigInt(amount));
      
      if (!coinWithSufficientBalance) {
        throw new Error('Insufficient SBETS balance');
      }
      
      // Split the SBETS coin for the bet
      const [betCoin] = tx.splitCoins(
        tx.object(coinWithSufficientBalance.coinObjectId), 
        [tx.pure(amount.toString())]
      );
      
      // Calculate platform fee (0%) and network fee (1%)
      const platformFee = 0; // No platform fee as requested
      const networkFee = Math.round(amount * 0.01); // 1% network fee
      
      // Calculate potential payout
      const potentialPayout = Math.round(amount * totalOdds);
      
      // Format legs for the Move call
      const formattedLegs = legs.map(leg => ({
        event_id: leg.eventId.toString(),
        market_id: leg.marketId ? leg.marketId.toString() : '0',
        market_name: leg.marketName || 'Match result',
        prediction: leg.prediction,
        odds: Math.round(leg.odds * 100).toString()
      }));
      
      // Serialize legs to JSON for the Move call
      const legsJson = JSON.stringify(formattedLegs);
      
      // Call the create_parlay function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::create_parlay',
        arguments: [
          betCoin,
          tx.pure(legsJson),
          tx.pure(Math.round(totalOdds * 100).toString()),
          tx.pure(potentialPayout.toString()),
          tx.pure(platformFee.toString()),
          tx.pure(networkFee.toString()),
          tx.pure(userId.toString()),
          tx.pure('SBETS')
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Parlay created with SBETS:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error creating parlay with SBETS:', error);
      throw error;
    }
  }
  
  /**
   * Cash out a single bet
   * @param walletAddress The wallet address
   * @param betId The bet ID
   * @param amount The cashout amount
   * @returns Transaction hash
   */
  async cashOutSingleBet(walletAddress: string, betId: string, amount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the cash_out_bet function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::cash_out_bet',
        arguments: [
          tx.pure(betId),
          tx.pure(amount.toString())
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
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
   * Cash out a parlay bet
   * @param walletAddress The wallet address
   * @param parlayId The parlay ID
   * @param amount The cashout amount
   * @returns Transaction hash
   */
  async cashOutParlay(walletAddress: string, parlayId: string, amount: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the cash_out_parlay function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::cash_out_parlay',
        arguments: [
          tx.pure(parlayId),
          tx.pure(amount.toString())
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
      if (config.blockchain.verbose) {
        console.log('Parlay cashed out:', result);
      }
      
      return result.digest;
    } catch (error) {
      console.error('Error cashing out parlay:', error);
      throw error;
    }
  }
  
  /**
   * Get user dividends information
   * @param walletAddress The wallet address
   * @returns Dividends information
   */
  async getUserDividends(walletAddress: string): Promise<any> {
    try {
      // In a real implementation, this would query the Walrus protocol
      // For now, we'll return mock data that mimics the structure of the response
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
   * Claim winnings from a bet
   * @param walletAddress The wallet address
   * @param betId The bet ID
   * @returns Transaction hash
   */
  async claimWinnings(walletAddress: string, betId: string): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the claim_winnings function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::claim_winnings',
        arguments: [
          tx.pure(betId)
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
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
   * Stake tokens in the protocol
   * @param walletAddress The wallet address
   * @param amount The amount to stake
   * @param periodDays The staking period in days
   * @returns Transaction hash
   */
  async stakeTokens(walletAddress: string, amount: number, periodDays: number): Promise<string> {
    try {
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = BigInt(Math.round(amount * 1_000_000_000));
      
      // Split the SUI coin for staking
      const [stakeCoin] = tx.splitCoins(tx.gas, [tx.pure(amountInMist.toString())]);
      
      // Convert days to seconds
      const periodSeconds = periodDays * 24 * 60 * 60;
      
      // Call the stake_tokens function from the Walrus package
      tx.moveCall({
        target: '0x45f3b76138726dbeb67ca5bb98b6a425fd7284fff63953640f6bc8cf0906ea2e::walrus::stake_tokens',
        arguments: [
          stakeCoin,
          tx.pure(periodSeconds.toString())
        ]
      });
      
      // Execute the transaction
      const result = await this.executeSignedTransaction(walletAddress, tx);
      
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
   * Get user bets
   * @param walletAddress The wallet address
   * @returns Array of user bets
   */
  async getUserBets(walletAddress: string): Promise<any[]> {
    try {
      // In a real implementation, this would query the Walrus protocol
      // For now, we'll return mock data that mimics the structure of the response
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
    } catch (error) {
      console.error('Error getting user bets:', error);
      return [];
    }
  }
}