/**
 * suiMoveService.ts
 * 
 * This service handles interaction with the Sui blockchain using Sui Move language.
 * It implements the wurlus protocol for sports betting based on Wal.app documentation.
 * References:
 * - https://docs.wal.app/usage/interacting.html
 * - https://docs.wal.app/dev-guide/costs.html
 * - https://docs.wal.app/dev-guide/storage.html
 */

// Define the key Sui Move contract types and interfaces
export interface SuiMoveTransaction {
  sender: string;
  packageObjectId: string;
  module: string;
  function: string;
  typeArguments: string[];
  arguments: unknown[];
  gasPayment?: string;
  gasBudget?: number;
}

export interface SuiMoveObject {
  objectId: string;
  version: number;
  digest: string;
  type: string;
  owner: SuiMoveOwner;
  content: any;
}

export type SuiMoveOwner = {
  AddressOwner: string;
} | {
  ObjectOwner: string;
} | {
  Shared: {
    initial_shared_version: number;
  };
} | "Immutable";

// Wurlus protocol types based on Wal.app
export interface WurlusEvent {
  id: string;
  name: string;
  description: string;
  startTime: number;
  sportId: string;
  markets: WurlusMarket[];
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

export interface WurlusMarket {
  id: string;
  name: string;
  outcomes: WurlusOutcome[];
  status: 'open' | 'closed' | 'settled';
}

export interface WurlusOutcome {
  id: string;
  name: string;
  odds: number;
  status: 'active' | 'settled_win' | 'settled_lose' | 'voided';
}

export interface WurlusBet {
  id: string;
  eventId: string;
  marketId: string;
  outcomeId: string;
  amount: number;
  potentialPayout: number;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  placedAt: number;
  settledAt: number | null;
  txHash: string;
}

// Network options for Sui blockchain based on Wal.app documentation
export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export interface SuiNetworkConfig {
  name: SuiNetwork;
  url: string;
  packageId: string;
  protocolObjectId: string;
  faucetUrl?: string;
}

// Main service class for interacting with Sui blockchain using Wurlus protocol
export class SuiMoveService {
  // Network configurations based on Wal.app documentation
  private readonly networks: Record<SuiNetwork, SuiNetworkConfig> = {
    mainnet: {
      name: 'mainnet',
      url: 'https://fullnode.mainnet.sui.io:443',
      packageId: '0x52d7c5de2a03d1e2d7b69fe5def0e876561e04860d17f8d5c7f6c2caa4e132fc',
      protocolObjectId: '0xfd5783bd2ec65a132f23ea30f693fc1e35d3043aa9501b5f85c71d8da5ac5178'
    },
    testnet: {
      name: 'testnet',
      url: 'https://fullnode.testnet.sui.io:443',
      packageId: '0x52d7c5de2a03d1e2d7b69fe5def0e876561e04860d17f8d5c7f6c2caa4e132fc',
      protocolObjectId: '0xfd5783bd2ec65a132f23ea30f693fc1e35d3043aa9501b5f85c71d8da5ac5178',
      faucetUrl: 'https://faucet.testnet.sui.io/gas'
    },
    devnet: {
      name: 'devnet',
      url: 'https://fullnode.devnet.sui.io:443',
      packageId: '0x52d7c5de2a03d1e2d7b69fe5def0e876561e04860d17f8d5c7f6c2caa4e132fc',
      protocolObjectId: '0xfd5783bd2ec65a132f23ea30f693fc1e35d3043aa9501b5f85c71d8da5ac5178',
      faucetUrl: 'https://faucet.devnet.sui.io/gas'
    },
    localnet: {
      name: 'localnet',
      url: 'http://127.0.0.1:9000',
      packageId: '0x52d7c5de2a03d1e2d7b69fe5def0e876561e04860d17f8d5c7f6c2caa4e132fc',
      protocolObjectId: '0xfd5783bd2ec65a132f23ea30f693fc1e35d3043aa9501b5f85c71d8da5ac5178'
    }
  };
  
  // Current network settings
  private network: SuiNetworkConfig;
  
  // Module names based on Wal.app protocol structure
  private readonly moduleNames = {
    betting: 'betting',
    market: 'market',
    event: 'event',
    odds: 'odds',
    payment: 'payment',
    wurlusProtocol: 'wurlus_protocol',
    userRegistry: 'user_registry'
  };

  constructor(network: SuiNetwork = 'testnet') {
    this.network = this.networks[network];
    console.log(`Initializing SuiMoveService with Wurlus Protocol on ${network}`);
    console.log(`Network URL: ${this.network.url}`);
    console.log(`Package ID: ${this.network.packageId}`);
    console.log(`Protocol Object ID: ${this.network.protocolObjectId}`);
    
    // Initialize connection to Sui blockchain if needed
    // In a production environment, we would initialize the Sui client here
    // const suiClient = new SuiClient({ url: this.network.url });
  }
  
  /**
   * Switch the network being used
   * @param network Network to switch to
   */
  setNetwork(network: SuiNetwork): void {
    this.network = this.networks[network];
    console.log(`Switched to ${network} network`);
    console.log(`Network URL: ${this.network.url}`);
    console.log(`Package ID: ${this.network.packageId}`);
    console.log(`Protocol Object ID: ${this.network.protocolObjectId}`);
  }

  /**
   * Connect wallet to the Wurlus protocol
   * This will register the wallet with the protocol and create necessary storage objects
   * 
   * @param walletAddress User's Sui wallet address
   * @returns Promise resolving to boolean indicating success
   */
  async connectWallet(walletAddress: string): Promise<boolean> {
    try {
      // Following Wal.app documentation for wallet connection
      const transaction: SuiMoveTransaction = {
        sender: walletAddress,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.userRegistry,
        function: 'register_user',
        typeArguments: [],
        arguments: [this.network.protocolObjectId],
        gasBudget: 10000
      };

      console.log(`[SuiMove] Connecting wallet ${walletAddress} to Wurlus protocol`);
      console.log(`[SuiMove] Transaction details: ${JSON.stringify(transaction)}`);

      // In a real implementation, this would execute the transaction on the Sui network
      // using the @mysten/sui.js SDK as specified in Wal.app docs
      
      // In production, this would call:
      // const txResult = await walClient.signAndExecuteTransaction({
      //   transaction: {
      //     kind: 'moveCall',
      //     data: transaction
      //   }
      // });
      
      // Mock successful response for now
      return true;
    } catch (error) {
      console.error(`[SuiMove] Error connecting wallet: ${error}`);
      return false;
    }
  }

  /**
   * Get wallet balance in SUI tokens - follows Wal.app's query pattern
   * 
   * @param walletAddress User's Sui wallet address
   * @returns Promise resolving to balance amount
   */
  async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      // Following Wal.app documentation for balance queries
      // This would normally use their getSuiBalance method
      
      console.log(`[SuiMove] Getting balance for wallet ${walletAddress}`);
      
      // In production this would call:
      // const { totalBalance } = await walClient.getBalance({
      //   owner: walletAddress,
      //   coinType: '0x2::sui::SUI'
      // });
      
      // Mock balance for testing - would be replaced with actual balance call
      const mockBalance = Math.floor(Math.random() * 1000) / 100;
      return mockBalance;
    } catch (error) {
      console.error(`[SuiMove] Error getting wallet balance: ${error}`);
      return 0;
    }
  }

  /**
   * Place a bet using the Wurlus protocol - following Wal.app betting flow
   * 
   * @param walletAddress User's wallet address
   * @param eventId Event ID
   * @param marketId Market ID
   * @param outcomeId Outcome ID
   * @param amount Bet amount in SUI
   * @param odds Odds value
   * @returns Promise resolving to transaction hash
   */
  async placeBet(
    walletAddress: string,
    eventId: number,
    marketId: string,
    outcomeId: string,
    amount: number,
    odds: number
  ): Promise<string> {
    try {
      // Following Wal.app documentation for placing bets
      // Convert amount to MIST (smallest SUI unit) - 1 SUI = 10^9 MIST
      const amountInMist = amount * 1000000000;
      
      // Calculate fees based on Wal.app cost documentation
      // https://docs.wal.app/dev-guide/costs.html
      const platformFeePercentage = 0.05; // 5% platform fee
      const networkFeePercentage = 0.01; // 1% network fee
      const totalFeePercentage = platformFeePercentage + networkFeePercentage;
      
      // Calculate fee amounts
      const platformFee = Math.floor(amountInMist * platformFeePercentage);
      const networkFee = Math.floor(amountInMist * networkFeePercentage);
      const totalFee = platformFee + networkFee;
      
      // Amount after fees
      const betAmountAfterFees = amountInMist - totalFee;
      
      console.log(`[SuiMove] Bet amount: ${amountInMist} MIST`);
      console.log(`[SuiMove] Platform fee (5%): ${platformFee} MIST`);
      console.log(`[SuiMove] Network fee (1%): ${networkFee} MIST`);
      console.log(`[SuiMove] Bet amount after fees: ${betAmountAfterFees} MIST`);
      
      const transaction: SuiMoveTransaction = {
        sender: walletAddress,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.betting,
        function: 'place_bet',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId, // Protocol object ID
          eventId.toString(),    // Event ID
          marketId,              // Market ID
          outcomeId,             // Outcome ID
          amountInMist.toString(), // Full amount in MIST (fees are calculated internally by protocol)
          platformFee.toString(), // Platform fee
          networkFee.toString(),  // Network fee
        ],
        gasBudget: 10000
      };

      console.log(`[SuiMove] Placing bet for wallet ${walletAddress}`);
      console.log(`[SuiMove] Transaction details: ${JSON.stringify(transaction)}`);

      // In production, this would call:
      // const txResult = await walClient.signAndExecuteTransaction({
      //   transaction: {
      //     kind: 'moveCall',
      //     data: transaction
      //   }
      // });
      // return txResult.digest;

      // Mock transaction hash for testing
      const txHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      return txHash;
    } catch (error) {
      console.error(`[SuiMove] Error placing bet: ${error}`);
      throw new Error(`Failed to place bet: ${error}`);
    }
  }

  /**
   * Get user's bet history from the Wurlus protocol
   * 
   * @param walletAddress User's wallet address
   * @returns Promise resolving to array of bet objects
   */
  async getUserBets(walletAddress: string): Promise<WurlusBet[]> {
    try {
      console.log(`[SuiMove] Getting bet history for wallet ${walletAddress}`);
      
      // Following Wal.app documentation for querying bet history
      // This would use the SuiClient.getOwnedObjects method to retrieve bet objects
      
      // In production, this would call:
      // const response = await walClient.getOwnedObjects({
      //   owner: walletAddress,
      //   filter: {
      //     StructType: `${this.network.packageId}::betting::Bet`
      //   },
      //   options: {
      //     showContent: true
      //   }
      // });
      // Then it would transform those objects into WurlusBet format
      
      // Return empty array for testing
      return [];
    } catch (error) {
      console.error(`[SuiMove] Error getting user bets: ${error}`);
      return [];
    }
  }

  /**
   * Create an event in the Wurlus protocol - Admin function
   * 
   * @param adminWallet Admin wallet address
   * @param eventName Event name
   * @param eventDescription Event description
   * @param startTime Start time
   * @param sportId Sport ID
   * @returns Promise resolving to event ID
   */
  async createEvent(
    adminWallet: string,
    eventName: string,
    eventDescription: string,
    startTime: number,
    sportId: number
  ): Promise<string> {
    try {
      // Following Wal.app documentation for event creation
      const transaction: SuiMoveTransaction = {
        sender: adminWallet,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.event,
        function: 'create_event',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId, // Protocol object ID
          eventName,
          eventDescription,
          startTime.toString(),
          sportId.toString()
        ],
        gasBudget: 15000
      };

      console.log(`[SuiMove] Creating event by admin ${adminWallet}`);
      console.log(`[SuiMove] Transaction details: ${JSON.stringify(transaction)}`);

      // In production, this would call:
      // const txResult = await walClient.signAndExecuteTransaction({
      //   transaction: {
      //     kind: 'moveCall',
      //     data: transaction
      //   }
      // });
      // Then extract the event ID from the transaction

      // Mock event ID for testing
      const eventId = `event_${Math.floor(Math.random() * 10000)}`;
      
      return eventId;
    } catch (error) {
      console.error(`[SuiMove] Error creating event: ${error}`);
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  /**
   * Get available sports from Wurlus protocol
   * 
   * @returns Promise resolving to array of sport objects
   */
  async getSports(): Promise<{ id: string; name: string; slug: string }[]> {
    try {
      console.log('[SuiMove] Getting available sports from Wurlus protocol');
      
      // Following Wal.app documentation for querying sports
      // This would use the queryEvents method to get all sports
      
      // In production, would retrieve from Wal.app API or blockchain
      
      // For testing, return mock sports based on our existing data
      return [
        { id: '1', name: 'Football', slug: 'football' },
        { id: '2', name: 'Basketball', slug: 'basketball' },
        { id: '3', name: 'Tennis', slug: 'tennis' },
        { id: '4', name: 'Baseball', slug: 'baseball' },
        { id: '5', name: 'Boxing', slug: 'boxing' },
        { id: '8', name: 'UFC/MMA', slug: 'mma-ufc' }
      ];
    } catch (error) {
      console.error(`[SuiMove] Error getting sports: ${error}`);
      return [];
    }
  }

  /**
   * Get live events from Wurlus protocol
   * 
   * @param sportId Optional sport ID to filter events
   * @returns Promise resolving to array of event objects
   */
  async getLiveEvents(sportId?: string): Promise<Partial<WurlusEvent>[]> {
    try {
      console.log(`[SuiMove] Getting live events${sportId ? ` for sport ${sportId}` : ''}`);
      
      // Following Wal.app documentation for querying live events
      // This would use their queryEvents method with status filter
      
      // In production, would retrieve from Wal.app API or blockchain
      
      return [];
    } catch (error) {
      console.error(`[SuiMove] Error getting live events: ${error}`);
      return [];
    }
  }

  /**
   * Claim winnings from a bet
   * 
   * @param walletAddress User wallet address
   * @param betId Bet ID to claim winnings from
   * @returns Promise resolving to transaction hash
   */
  async claimWinnings(walletAddress: string, betId: string): Promise<string> {
    try {
      // Following Wal.app documentation for claiming winnings
      const transaction: SuiMoveTransaction = {
        sender: walletAddress,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.betting,
        function: 'claim_winnings',
        typeArguments: [],
        arguments: [
          betId,
        ],
        gasBudget: 10000
      };

      console.log(`[SuiMove] Claiming winnings for bet ${betId}`);
      
      // Mock transaction hash
      const txHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      return txHash;
    } catch (error) {
      console.error(`[SuiMove] Error claiming winnings: ${error}`);
      throw new Error(`Failed to claim winnings: ${error}`);
    }
  }

  /**
   * Create a new market for an event
   * Admin function
   * 
   * @param adminWallet Admin wallet address
   * @param eventId Event ID
   * @param marketName Market name (e.g., "Match Winner")
   * @returns Promise resolving to market ID
   */
  async createMarket(
    adminWallet: string,
    eventId: string,
    marketName: string
  ): Promise<string> {
    try {
      const transaction: SuiMoveTransaction = {
        sender: adminWallet,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.market,
        function: 'create_market',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId,
          eventId,
          marketName
        ],
        gasBudget: 12000
      };

      console.log(`[SuiMove] Creating market for event ${eventId}`);
      
      // Mock market ID
      const marketId = `market_${Math.floor(Math.random() * 10000)}`;
      return marketId;
    } catch (error) {
      console.error(`[SuiMove] Error creating market: ${error}`);
      throw new Error(`Failed to create market: ${error}`);
    }
  }

  /**
   * Create a new outcome for a market
   * Admin function
   * 
   * @param adminWallet Admin wallet address
   * @param marketId Market ID
   * @param outcomeName Outcome name (e.g., "Home Win")
   * @param oddsValue Odds value (e.g., 2.5)
   * @returns Promise resolving to outcome ID
   */
  async createOutcome(
    adminWallet: string,
    marketId: string,
    outcomeName: string,
    oddsValue: number
  ): Promise<string> {
    try {
      // Convert odds to protocol format (integer representation)
      const oddsInProtocolFormat = Math.floor(oddsValue * 100).toString();
      
      const transaction: SuiMoveTransaction = {
        sender: adminWallet,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.odds,
        function: 'create_outcome',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId,
          marketId,
          outcomeName,
          oddsInProtocolFormat
        ],
        gasBudget: 12000
      };

      console.log(`[SuiMove] Creating outcome for market ${marketId}`);
      
      // Mock outcome ID
      const outcomeId = `outcome_${Math.floor(Math.random() * 10000)}`;
      return outcomeId;
    } catch (error) {
      console.error(`[SuiMove] Error creating outcome: ${error}`);
      throw new Error(`Failed to create outcome: ${error}`);
    }
  }

  /**
   * Settle a market based on results
   * Admin function
   * 
   * @param adminWallet Admin wallet address
   * @param marketId Market ID
   * @param winningOutcomeId Winning outcome ID
   * @returns Promise resolving to transaction hash
   */
  async settleMarket(
    adminWallet: string,
    marketId: string,
    winningOutcomeId: string
  ): Promise<string> {
    try {
      const transaction: SuiMoveTransaction = {
        sender: adminWallet,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.market,
        function: 'settle_market',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId,
          marketId,
          winningOutcomeId
        ],
        gasBudget: 20000
      };

      console.log(`[SuiMove] Settling market ${marketId} with winning outcome ${winningOutcomeId}`);
      
      // Mock transaction hash
      const txHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      return txHash;
    } catch (error) {
      console.error(`[SuiMove] Error settling market: ${error}`);
      throw new Error(`Failed to settle market: ${error}`);
    }
  }

  /**
   * Get user's protocol registration status
   * 
   * @param walletAddress User wallet address
   * @returns Promise resolving to boolean indicating registration status
   */
  async getUserRegistrationStatus(walletAddress: string): Promise<boolean> {
    try {
      console.log(`[SuiMove] Checking registration status for wallet ${walletAddress}`);
      
      // In production, this would check if the user has a storage object
      // associated with their address using the Sui SDK.
      // const userObjects = await suiClient.getOwnedObjects({
      //   owner: walletAddress,
      //   filter: {
      //     StructType: `${this.network.packageId}::user_registry::UserProfile`
      //   }
      // });
      // return userObjects.data.length > 0;
      
      // Mock result
      return true;
    } catch (error) {
      console.error(`[SuiMove] Error checking user registration: ${error}`);
      return false;
    }
  }

  /**
   * Get user's dividend information
   * 
   * @param walletAddress User wallet address
   * @returns Promise resolving to user dividend data
   */
  async getUserDividends(walletAddress: string): Promise<{
    availableDividends: number;
    claimedDividends: number;
    stakingAmount: number;
    lastClaimTime: number;
    // Add additional fields based on Wal.app cost documentation
    stakingStartTime: number;
    stakingEndTime: number;
    totalRewards: number;
    platformFees: number;
  }> {
    try {
      console.log(`[SuiMove] Getting dividend info for wallet ${walletAddress}`);
      
      // In production, this would query the user's dividend state object
      // and return the actual values.
      
      // Generate consistent mock data for demonstration purposes
      const now = Date.now();
      const stakingAmount = Math.random() * 100;
      const totalRewards = stakingAmount * 0.15; // 15% total rewards
      
      // Calculate platform fee according to Wal.app cost documentation
      // https://docs.wal.app/dev-guide/costs.html
      const platformFeePercentage = 0.1; // 10% platform fee on rewards
      const platformFees = totalRewards * platformFeePercentage;
      
      // Calculate available dividends (rewards after platform fees)
      const availableDividends = totalRewards - platformFees;
      
      // Random staking start time in the past (1-30 days)
      const stakingStartTime = now - Math.floor((1 + Math.random() * 29) * 24 * 60 * 60 * 1000);
      
      // Random staking end time in the future (1-30 days)
      const stakingEndTime = now + Math.floor((1 + Math.random() * 29) * 24 * 60 * 60 * 1000);
      
      return {
        availableDividends,
        claimedDividends: Math.random() * 10,
        stakingAmount,
        lastClaimTime: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        stakingStartTime,
        stakingEndTime,
        totalRewards,
        platformFees
      };
    } catch (error) {
      console.error(`[SuiMove] Error getting user dividends: ${error}`);
      return {
        availableDividends: 0,
        claimedDividends: 0,
        stakingAmount: 0,
        lastClaimTime: 0,
        stakingStartTime: 0,
        stakingEndTime: 0,
        totalRewards: 0,
        platformFees: 0
      };
    }
  }
  
  /**
   * Stake tokens in the Wurlus protocol
   * Following Wal.app staking documentation
   * 
   * @param walletAddress User wallet address
   * @param amount Amount to stake in SUI tokens
   * @param periodDays Staking period in days
   * @returns Promise resolving to transaction hash
   */
  async stakeTokens(
    walletAddress: string,
    amount: number,
    periodDays: number
  ): Promise<string> {
    try {
      console.log(`[SuiMove] Staking ${amount} tokens for ${periodDays} days from wallet ${walletAddress}`);
      
      // Convert amount to MIST (smallest SUI unit) - 1 SUI = 10^9 MIST
      const amountInMist = amount * 1000000000;
      
      // Calculate fees based on Wal.app cost documentation
      // https://docs.wal.app/dev-guide/costs.html
      // Staking has platform fee but no network fee according to docs
      const platformFeePercentage = 0.02; // 2% platform fee for staking
      
      // Calculate fee amount
      const platformFee = Math.floor(amountInMist * platformFeePercentage);
      
      // Amount after fees
      const stakeAmountAfterFees = amountInMist - platformFee;
      
      console.log(`[SuiMove] Stake amount: ${amountInMist} MIST`);
      console.log(`[SuiMove] Platform fee (2%): ${platformFee} MIST`);
      console.log(`[SuiMove] Stake amount after fees: ${stakeAmountAfterFees} MIST`);
      
      // Following Wal.app documentation for staking
      const transaction: SuiMoveTransaction = {
        sender: walletAddress,
        packageObjectId: this.network.packageId,
        module: this.moduleNames.wurlusProtocol,
        function: 'stake_tokens',
        typeArguments: [],
        arguments: [
          this.network.protocolObjectId,
          amountInMist.toString(),   // Full amount in MIST
          platformFee.toString(),    // Platform fee
          periodDays.toString()      // Staking period in days
        ],
        gasBudget: 10000
      };
      
      console.log(`[SuiMove] Staking transaction details: ${JSON.stringify(transaction)}`);
      
      // In production, this would execute the transaction:
      // const txResult = await walClient.signAndExecuteTransaction({
      //   transaction: {
      //     kind: 'moveCall',
      //     data: transaction
      //   }
      // });
      // return txResult.digest;
      
      // Mock transaction hash for development
      const txHash = `0x${Array.from({length: 64}, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      return txHash;
    } catch (error) {
      console.error(`[SuiMove] Error staking tokens: ${error}`);
      throw new Error(`Failed to stake tokens: ${error}`);
    }
  }
}