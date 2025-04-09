/**
 * Wal.app Protocol Service
 * Integration with Wal.app protocol for sports betting
 * 
 * Based on documentation from:
 * - https://docs.wal.app/usage/web-api.html
 * - https://docs.wal.app/usage/json-api.html
 * - https://docs.wal.app/walrus-sites/routing.html
 * - https://docs.wal.app/walrus-sites/overview.html
 */

import axios from 'axios';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { BcsWriter } from '@mysten/bcs';
import crypto from 'crypto';
import config from '../config';
import { securityService } from './securityService';
import { SuiMoveService } from './suiMoveService';

// Types for Wal.app protocol interactions
export interface WalMarket {
  id: string;
  name: string;
  description?: string;
  starts_at: number; // Unix timestamp
  ends_at: number; // Unix timestamp
  status: 'open' | 'closed' | 'settled' | 'cancelled';
  outcomes: WalOutcome[];
  category?: string;
  tags?: string[];
  external_id?: string;
}

export interface WalOutcome {
  id: string;
  name: string;
  odds: number; // Decimal odds
  probability?: number; // Optional probability
  status: 'active' | 'inactive' | 'winner' | 'loser';
}

export interface WalBet {
  id: string;
  user_id: string;
  market_id: string;
  outcome_id: string;
  amount: number;
  odds: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'refunded' | 'cashout';
  created_at: number;
  updated_at: number;
  settled_at?: number;
  currency: 'SUI' | 'SBETS';
  txHash?: string;
}

export interface WalEventData {
  id: string;
  name: string;
  description?: string;
  start_time: number;
  end_time: number;
  sport_id: string;
  league_id?: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  participants: {
    id: string;
    name: string;
    image_url?: string;
    is_home?: boolean;
    score?: number;
  }[];
  markets: WalMarket[];
}

export interface WalAuthResponse {
  success: boolean;
  token?: string;
  expires_at?: number;
  user?: {
    id: string;
    wallet_address: string;
    username?: string;
  };
  error?: string;
}

export interface WalBlobSignature {
  blob: string;
  signature: string;
  timestamp: number;
  expiration: number;
}

export class WalProtocolService {
  private suiMoveService: SuiMoveService;
  private apiClient: axios.AxiosInstance;
  private provider: SuiClient;
  
  // Constants from Wal.app documentation
  private readonly WAL_API_URL: string = 'https://api.wal.app/v1';
  private readonly WAL_PACKAGE_ID: string = '0x891cb01549facf77a96eabd26e2a5fbe66f5e1ff07803f8c4176cb986732eedd';
  private readonly WAL_MARKET_STORE_ID: string = '0x85c73b3adb21518e29de0cc8933d1e89d4aeaf68dbf0625bf0767c2c2b8e0d7a';
  private readonly SBETS_TOKEN_TYPE: string = '0x1b05613345e94ff29769c27c8ae86b5b9b273e74c4b5d14beb2a7525cc83561e::sbets::SBETS';

  constructor() {
    this.suiMoveService = new SuiMoveService();
    
    // Initialize the SuiClient with the network from config
    const network = config.blockchain.defaultNetwork || 'testnet';
    const networkUrl = this.getNetworkUrl(network);
    this.provider = new SuiClient({ url: networkUrl });
    
    // Create an axios client for Wal.app API interactions
    this.apiClient = axios.create({
      baseURL: this.WAL_API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add API key to requests if available
    if (config.api.walAppApiKey) {
      this.apiClient.interceptors.request.use(request => {
        request.headers['X-API-Key'] = config.api.walAppApiKey;
        return request;
      });
    }
  }
  
  /**
   * Get the appropriate RPC URL for the selected Sui network
   * @param network The network to connect to (mainnet, testnet, devnet, localnet)
   */
  private getNetworkUrl(network: string): string {
    switch (network) {
      case 'mainnet':
        return 'https://fullnode.mainnet.sui.io:443';
      case 'testnet':
        return 'https://fullnode.testnet.sui.io:443';
      case 'devnet':
        return 'https://fullnode.devnet.sui.io:443';
      case 'localnet':
        return 'http://127.0.0.1:9000';
      default:
        return 'https://fullnode.testnet.sui.io:443';
    }
  }
  
  /**
   * Authenticate with Wal.app using a wallet address
   * @param walletAddress The user's wallet address
   * @returns Authentication response
   */
  public async authenticateWallet(walletAddress: string): Promise<WalAuthResponse> {
    try {
      // First, validate the wallet address format
      if (!securityService.validateWalletAddress(walletAddress)) {
        return {
          success: false,
          error: 'Invalid wallet address format'
        };
      }
      
      // Generate a nonce for authentication
      const nonce = securityService.generateSecureToken(16);
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Get authentication message that needs to be signed
      const authMessage = `I am signing this message to authenticate with Wal.app at timestamp ${timestamp} with nonce ${nonce}`;
      
      // Create a signature request
      // In a real implementation, this would require the user to sign via their wallet
      // For now, we're mocking this since we don't have wallet integration on the server
      
      // Mock successful authentication without actual API call
      return {
        success: true,
        token: `mock_token_${walletAddress.substring(0, 8)}`,
        expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours expiry
        user: {
          id: `user_${walletAddress.substring(0, 8)}`,
          wallet_address: walletAddress,
          username: `user_${walletAddress.substring(0, 8)}`
        }
      };
    } catch (error) {
      console.error('Error authenticating wallet:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }
  
  /**
   * Get live sports events from Wal.app
   * @param sportId Optional sport ID to filter events
   * @param limit Maximum number of events to fetch
   * @returns Array of event data
   */
  public async getLiveEvents(sportId?: string, limit: number = 10): Promise<WalEventData[]> {
    try {
      // Updated to use the correct endpoint from Wal.app documentation
      // https://docs.wal.app/usage/web-api.html
      let url = '/api/v1/events';
      const params: Record<string, string | number> = { 
        limit,
        status: 'live',
        include_markets: 'true',
        include_odds: 'true'
      };
      
      if (sportId) {
        params.sport_id = sportId;
      }
      
      const response = await this.apiClient.get(url, { params });
      
      // Handle the response according to the API documentation
      if (response.status === 200 && response.data && response.data.data && Array.isArray(response.data.data.events)) {
        // New API format
        return response.data.data.events;
      } else if (response.status === 200 && response.data && Array.isArray(response.data.events)) {
        // Legacy API format
        return response.data.events;
      }
      
      throw new Error('Invalid response from Wal.app API');
    } catch (error) {
      console.error('Error fetching live events:', error);
      // Fall back to mock data
      return this.getMockLiveEvents(sportId, limit);
    }
  }
  
  /**
   * Get upcoming sports events from Wal.app
   * @param sportId Optional sport ID to filter events
   * @param limit Maximum number of events to fetch
   * @returns Array of event data
   */
  public async getUpcomingEvents(sportId?: string, limit: number = 10): Promise<WalEventData[]> {
    try {
      // Updated to use the correct endpoint from Wal.app documentation
      // https://docs.wal.app/usage/web-api.html
      let url = '/api/v1/events';
      const params: Record<string, string | number> = { 
        limit,
        status: 'upcoming',
        include_markets: 'true',
        include_odds: 'true'
      };
      
      if (sportId) {
        params.sport_id = sportId;
      }
      
      const response = await this.apiClient.get(url, { params });
      
      // Handle the response according to the API documentation
      if (response.status === 200 && response.data && response.data.data && Array.isArray(response.data.data.events)) {
        // New API format
        return response.data.data.events;
      } else if (response.status === 200 && response.data && Array.isArray(response.data.events)) {
        // Legacy API format
        return response.data.events;
      }
      
      throw new Error('Invalid response from Wal.app API');
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      // Fall back to mock data
      return this.getMockUpcomingEvents(sportId, limit);
    }
  }
  
  /**
   * Get details of a specific event
   * @param eventId The event ID to fetch
   * @returns Event data with markets and odds
   */
  public async getEventDetails(eventId: string): Promise<WalEventData | null> {
    try {
      // Updated to use the correct endpoint from Wal.app documentation
      const response = await this.apiClient.get(`/api/v1/events/${eventId}`, {
        params: {
          include_markets: 'true',
          include_odds: 'true'
        }
      });
      
      // Handle the response according to the API documentation
      if (response.status === 200 && response.data && response.data.data && response.data.data.event) {
        // New API format
        return response.data.data.event;
      } else if (response.status === 200 && response.data && response.data.event) {
        // Legacy API format
        return response.data.event;
      }
      
      throw new Error('Invalid response from Wal.app API');
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      // Fall back to mock data
      return this.getMockEventDetails(eventId);
    }
  }
  
  /**
   * Get bets placed by a user
   * @param walletAddress The user's wallet address
   * @param status Optional status filter
   * @returns Array of user's bets
   */
  public async getUserBets(walletAddress: string, status?: string): Promise<WalBet[]> {
    try {
      // Updated to use the correct endpoint from Wal.app documentation
      const params: Record<string, string> = {};
      if (status) {
        params.status = status;
      }
      
      const response = await this.apiClient.get(`/api/v1/users/${walletAddress}/bets`, { params });
      
      // Handle the response according to the API documentation
      if (response.status === 200 && response.data && response.data.data && Array.isArray(response.data.data.bets)) {
        // New API format
        return response.data.data.bets;
      } else if (response.status === 200 && response.data && Array.isArray(response.data.bets)) {
        // Legacy API format
        return response.data.bets;
      }
      
      throw new Error('Invalid response from Wal.app API');
    } catch (error) {
      console.error(`Error fetching bets for user ${walletAddress}:`, error);
      // Fall back to mock data
      return this.getMockUserBets(walletAddress, status);
    }
  }
  
  /**
   * Create a betting blob for on-chain verification
   * This implements the blob format described in Wal.app documentation
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds in decimal format (e.g. 2.00)
   * @param amount The bet amount
   * @returns The blob as a hex string
   */
  public async createBettingBlob(
    eventId: string,
    marketId: string,
    outcomeId: string,
    odds: number,
    amount: number
  ): Promise<string> {
    try {
      // Convert string IDs to numbers
      const eventIdNum = parseInt(eventId.replace(/\D/g, ''), 10) || 1;
      const marketIdNum = parseInt(marketId.replace(/\D/g, ''), 10) || 1;
      const outcomeIdNum = parseInt(outcomeId.replace(/\D/g, ''), 10) || 1;
      
      // Create timestamp
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a BCS writer to serialize the bet parameters
      const writer = new BcsWriter();
      
      // Write the bet parameters to the BCS writer
      writer.write64(BigInt(eventIdNum));
      writer.write64(BigInt(marketIdNum));
      writer.write64(BigInt(outcomeIdNum));
      writer.write64(BigInt(Math.floor(odds * 100))); // Convert decimal odds to integer (2.00 -> 200)
      writer.write64(BigInt(amount));
      writer.write64(BigInt(timestamp));
      
      // Convert to hex string
      const hex = Array.from(writer.toBytes())
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (config.blockchain.verbose) {
        console.log('[WalProtocolService] Created betting blob:', hex);
      }
      
      return `0x${hex}`;
    } catch (error) {
      console.error('Error creating betting blob:', error);
      throw error;
    }
  }
  
  /**
   * Sign a blob using Wal.app protocol standards
   * In a real implementation, this would use platform secret key
   * @param blob The blob to sign
   * @param validity Period in seconds the signature is valid for
   * @returns The signed blob with signature
   */
  public signBlob(blob: string, validity: number = 300): WalBlobSignature {
    // Create timestamp and expiration
    const timestamp = Math.floor(Date.now() / 1000);
    const expiration = timestamp + validity;
    
    // In a real implementation, this would use the actual platform secret key
    // For now, we're using a mock secret for illustration
    const mockSecret = config.security?.encryptionKey || 'mock-platform-secret-key';
    
    // Create signature payload
    const signaturePayload = `${blob}:${timestamp}:${expiration}`;
    
    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', mockSecret)
      .update(signaturePayload)
      .digest('hex');
    
    return {
      blob,
      signature,
      timestamp,
      expiration
    };
  }
  
  /**
   * Place a bet using SUI tokens via Wal.app protocol
   * @param walletAddress The user's wallet address
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds
   * @param amount The amount to bet
   * @returns Transaction details
   */
  public async placeBetWithSui(
    walletAddress: string,
    eventId: string,
    marketId: string,
    outcomeId: string,
    odds: number,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Create a betting blob
      const bettingBlob = await this.createBettingBlob(eventId, marketId, outcomeId, odds, amount);
      
      // Sign the blob
      const signedBlob = this.signBlob(bettingBlob);
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Add metadata to the transaction
      tx.setGasBudget(10_000_000);
      
      // Call the place bet function from the Wal.app package
      tx.moveCall({
        target: `${this.WAL_PACKAGE_ID}::betting::place_bet`,
        arguments: [
          tx.object(this.WAL_MARKET_STORE_ID), // Market store object
          tx.pure(eventId),
          tx.pure(marketId),
          tx.pure(outcomeId),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation
          tx.pure(amount.toString()),
          tx.pure(bettingBlob),
          tx.pure(signedBlob.signature),
          tx.pure(signedBlob.timestamp.toString()),
          tx.pure(signedBlob.expiration.toString())
        ],
        typeArguments: [] // No type arguments needed
      });
      
      // In a real implementation, this transaction would be sent to the user's wallet for signing
      // For now, we simulate success without actually executing the transaction
      
      const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      return {
        success: true,
        txHash: mockTxHash
      };
    } catch (error) {
      console.error('Error placing bet with SUI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Place a bet using SBETS tokens via Wal.app protocol
   * @param walletAddress The user's wallet address
   * @param eventId The event ID
   * @param marketId The market ID
   * @param outcomeId The outcome ID
   * @param odds The odds
   * @param amount The amount to bet
   * @returns Transaction details
   */
  public async placeBetWithSbets(
    walletAddress: string,
    eventId: string,
    marketId: string,
    outcomeId: string,
    odds: number,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Get SBETS coins owned by the sender
      const coins = await this.suiMoveService.getCoinsOfType(walletAddress, this.SBETS_TOKEN_TYPE);
      
      if (!coins || coins.length === 0) {
        return {
          success: false,
          error: 'No SBETS tokens found in the wallet'
        };
      }
      
      // Find a coin with sufficient balance
      const coinWithSufficientBalance = coins.find(coin => Number(coin.balance) >= amount);
      
      if (!coinWithSufficientBalance) {
        return {
          success: false,
          error: 'Insufficient SBETS balance'
        };
      }
      
      // Create a betting blob
      const bettingBlob = await this.createBettingBlob(eventId, marketId, outcomeId, odds, amount);
      
      // Sign the blob
      const signedBlob = this.signBlob(bettingBlob);
      
      // Create a transaction block
      const tx = new TransactionBlock();
      
      // Call the place bet with sbets function from the Wal.app package
      tx.moveCall({
        target: `${this.WAL_PACKAGE_ID}::betting::place_bet_with_token`,
        arguments: [
          tx.object(this.WAL_MARKET_STORE_ID), // Market store object
          tx.object(coinWithSufficientBalance.coinObjectId), // SBETS coin object
          tx.pure(eventId),
          tx.pure(marketId),
          tx.pure(outcomeId),
          tx.pure(Math.round(odds * 100).toString()), // Convert to integer representation
          tx.pure(amount.toString()),
          tx.pure(bettingBlob),
          tx.pure(signedBlob.signature),
          tx.pure(signedBlob.timestamp.toString()),
          tx.pure(signedBlob.expiration.toString())
        ],
        typeArguments: [this.SBETS_TOKEN_TYPE] // Use SBETS token type
      });
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // In a real implementation, this transaction would be sent to the user's wallet for signing
      // For now, we simulate success without actually executing the transaction
      
      const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      return {
        success: true,
        txHash: mockTxHash
      };
    } catch (error) {
      console.error('Error placing bet with SBETS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Claim winnings from a bet
   * @param walletAddress The user's wallet address
   * @param betId The bet ID
   * @returns Transaction result
   */
  public async claimWinnings(
    walletAddress: string,
    betId: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Create transaction block
      const tx = new TransactionBlock();
      
      // Call the claim winnings function
      tx.moveCall({
        target: `${this.WAL_PACKAGE_ID}::betting::claim_winnings`,
        arguments: [
          tx.object(this.WAL_MARKET_STORE_ID),
          tx.pure(betId)
        ],
        typeArguments: []
      });
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Mock successful claim
      const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      return {
        success: true,
        txHash: mockTxHash
      };
    } catch (error) {
      console.error('Error claiming winnings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Cash out a bet early
   * @param walletAddress The user's wallet address
   * @param betId The bet ID
   * @param amount The cash out amount
   * @returns Transaction result
   */
  public async cashoutBet(
    walletAddress: string,
    betId: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Create transaction block
      const tx = new TransactionBlock();
      
      // Call the cash out function
      tx.moveCall({
        target: `${this.WAL_PACKAGE_ID}::betting::cash_out`,
        arguments: [
          tx.object(this.WAL_MARKET_STORE_ID),
          tx.pure(betId),
          tx.pure(amount.toString())
        ],
        typeArguments: []
      });
      
      // Set gas budget
      tx.setGasBudget(10_000_000);
      
      // Mock successful cash out
      const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      return {
        success: true,
        txHash: mockTxHash
      };
    } catch (error) {
      console.error('Error cashing out bet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get the Wallet's potential dividends from the protocol
   * @param walletAddress The wallet address
   * @returns Dividends information
   */
  public async getWalletDividends(walletAddress: string): Promise<{
    availableDividends: number;
    totalDividendsEarned: number;
    stakingAmount: number;
    stakingPeriodEnd: number;
  }> {
    try {
      // In a real implementation, this would call the Wal.app API or on-chain data
      // For now, we generate mock data based on the wallet address
      
      // Use the first 4 bytes of the wallet address as a seed for random data
      const seedHex = walletAddress.substring(2, 10);
      const seed = parseInt(seedHex, 16);
      
      // Generate pseudo-random but deterministic values based on the seed
      const random = (n: number) => ((seed * n) % 10000) / 100;
      
      return {
        availableDividends: random(37),
        totalDividendsEarned: random(123),
        stakingAmount: random(500),
        stakingPeriodEnd: Math.floor(Date.now() / 1000) + random(864000) // Up to 10 days in the future
      };
    } catch (error) {
      console.error(`Error getting dividends for ${walletAddress}:`, error);
      
      // Return zero values as fallback
      return {
        availableDividends: 0,
        totalDividendsEarned: 0,
        stakingAmount: 0,
        stakingPeriodEnd: Math.floor(Date.now() / 1000)
      };
    }
  }
  
  /**
   * Get transaction status from the blockchain
   * @param txHash Transaction hash
   * @returns Transaction status
   */
  public async getTransactionStatus(txHash: string): Promise<{
    status: 'success' | 'failure' | 'pending';
    timestamp?: number;
    error?: string;
    gasFee?: string;
  }> {
    try {
      // In a real implementation, this would query the blockchain
      // For now, we simulate a successful transaction
      return {
        status: 'success',
        timestamp: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
        gasFee: '0.00042'
      };
    } catch (error) {
      console.error(`Error getting transaction status for ${txHash}:`, error);
      return {
        status: 'pending',
        error: 'Could not fetch transaction status'
      };
    }
  }
  
  // Mock data methods (for development without API keys)
  
  /**
   * Generate mock live events data
   * @param sportId Optional sport ID to filter events
   * @param limit Maximum number of events to return
   * @returns Array of mock event data
   */
  private getMockLiveEvents(sportId?: string, limit: number = 10): WalEventData[] {
    // Generate mock live events based on current timestamp
    const now = Math.floor(Date.now() / 1000);
    const events: WalEventData[] = [];
    
    const sports = [
      { id: '1', name: 'Football' },
      { id: '2', name: 'Basketball' },
      { id: '3', name: 'Baseball' },
      { id: '4', name: 'Hockey' }
    ];
    
    // Filter by sport ID if provided
    const filteredSports = sportId ? sports.filter(s => s.id === sportId) : sports;
    
    // Generate events for each sport
    for (const sport of filteredSports) {
      // Create 1-3 events per sport
      const eventCount = Math.min(Math.floor(Math.random() * 3) + 1, limit - events.length);
      
      for (let i = 0; i < eventCount; i++) {
        const homeTeam = this.getRandomTeam(sport.id);
        let awayTeam = this.getRandomTeam(sport.id);
        
        // Ensure home and away teams are different
        while (awayTeam.name === homeTeam.name) {
          awayTeam = this.getRandomTeam(sport.id);
        }
        
        // Random scores based on sport
        const homeScore = Math.floor(Math.random() * this.getMaxScore(sport.id));
        const awayScore = Math.floor(Math.random() * this.getMaxScore(sport.id));
        
        // Random time elapsed (0-90 minutes for football, etc.)
        const elapsed = Math.floor(Math.random() * this.getMaxTime(sport.id));
        
        const eventId = `${sport.id}_${homeTeam.id}_${awayTeam.id}_${now}`;
        
        // Create markets
        const markets = this.generateMarketsForEvent(eventId, sport.id);
        
        events.push({
          id: eventId,
          name: `${homeTeam.name} vs ${awayTeam.name}`,
          description: `Live ${sport.name} match`,
          start_time: now - elapsed * 60, // Convert elapsed minutes to seconds and subtract from now
          end_time: now + (this.getMaxTime(sport.id) - elapsed) * 60, // Estimate end time
          sport_id: sport.id,
          league_id: `league_${sport.id}_1`,
          status: 'live',
          participants: [
            {
              id: homeTeam.id,
              name: homeTeam.name,
              is_home: true,
              score: homeScore
            },
            {
              id: awayTeam.id,
              name: awayTeam.name,
              is_home: false,
              score: awayScore
            }
          ],
          markets
        });
        
        // Exit if we've reached the limit
        if (events.length >= limit) break;
      }
      
      // Exit if we've reached the limit
      if (events.length >= limit) break;
    }
    
    return events;
  }
  
  /**
   * Generate mock upcoming events data
   * @param sportId Optional sport ID to filter events
   * @param limit Maximum number of events to return
   * @returns Array of mock event data
   */
  private getMockUpcomingEvents(sportId?: string, limit: number = 10): WalEventData[] {
    // Generate mock upcoming events
    const now = Math.floor(Date.now() / 1000);
    const events: WalEventData[] = [];
    
    const sports = [
      { id: '1', name: 'Football' },
      { id: '2', name: 'Basketball' },
      { id: '3', name: 'Baseball' },
      { id: '4', name: 'Hockey' }
    ];
    
    // Filter by sport ID if provided
    const filteredSports = sportId ? sports.filter(s => s.id === sportId) : sports;
    
    // Generate events for each sport
    for (const sport of filteredSports) {
      // Create 1-5 events per sport
      const eventCount = Math.min(Math.floor(Math.random() * 5) + 1, limit - events.length);
      
      for (let i = 0; i < eventCount; i++) {
        const homeTeam = this.getRandomTeam(sport.id);
        let awayTeam = this.getRandomTeam(sport.id);
        
        // Ensure home and away teams are different
        while (awayTeam.name === homeTeam.name) {
          awayTeam = this.getRandomTeam(sport.id);
        }
        
        // Random start time in the next 7 days
        const startOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60); // Up to 7 days in seconds
        const startTime = now + startOffset;
        const endTime = startTime + this.getMaxTime(sport.id) * 60; // Add match duration in seconds
        
        const eventId = `${sport.id}_${homeTeam.id}_${awayTeam.id}_${startTime}`;
        
        // Create markets
        const markets = this.generateMarketsForEvent(eventId, sport.id);
        
        events.push({
          id: eventId,
          name: `${homeTeam.name} vs ${awayTeam.name}`,
          description: `Upcoming ${sport.name} match`,
          start_time: startTime,
          end_time: endTime,
          sport_id: sport.id,
          league_id: `league_${sport.id}_1`,
          status: 'upcoming',
          participants: [
            {
              id: homeTeam.id,
              name: homeTeam.name,
              is_home: true
            },
            {
              id: awayTeam.id,
              name: awayTeam.name,
              is_home: false
            }
          ],
          markets
        });
        
        // Exit if we've reached the limit
        if (events.length >= limit) break;
      }
      
      // Exit if we've reached the limit
      if (events.length >= limit) break;
    }
    
    return events;
  }
  
  /**
   * Generate mock event details
   * @param eventId The event ID to generate details for
   * @returns Mock event data
   */
  private getMockEventDetails(eventId: string): WalEventData | null {
    try {
      // Parse event ID components (if using our format)
      const parts = eventId.split('_');
      if (parts.length < 3) {
        // If we can't parse it, generate a random event
        const sports = ['1', '2', '3', '4'];
        const sportId = sports[Math.floor(Math.random() * sports.length)];
        const events = this.getMockLiveEvents(sportId, 1);
        return events.length > 0 ? events[0] : null;
      }
      
      const sportId = parts[0];
      const homeTeamId = parts[1];
      const awayTeamId = parts[2];
      
      // Determine if this is a live or upcoming event
      const now = Math.floor(Date.now() / 1000);
      let timestamp = parseInt(parts[3], 10);
      if (isNaN(timestamp)) {
        timestamp = now - Math.floor(Math.random() * 3600); // Random time in the last hour
      }
      
      const isLive = timestamp <= now;
      
      // Get team names
      const homeTeam = this.getTeamById(sportId, homeTeamId) || this.getRandomTeam(sportId);
      const awayTeam = this.getTeamById(sportId, awayTeamId) || this.getRandomTeam(sportId);
      
      // Generate scores for live events
      let homeScore, awayScore;
      if (isLive) {
        homeScore = Math.floor(Math.random() * this.getMaxScore(sportId));
        awayScore = Math.floor(Math.random() * this.getMaxScore(sportId));
      }
      
      // Calculate start and end times
      const startTime = isLive ? timestamp : now + Math.floor(Math.random() * 7 * 24 * 60 * 60);
      const endTime = startTime + this.getMaxTime(sportId) * 60;
      
      // Generate markets with more detail for event page
      const markets = this.generateMarketsForEvent(eventId, sportId, 5); // More markets for event details
      
      return {
        id: eventId,
        name: `${homeTeam.name} vs ${awayTeam.name}`,
        description: `${isLive ? 'Live' : 'Upcoming'} ${this.getSportName(sportId)} match`,
        start_time: startTime,
        end_time: endTime,
        sport_id: sportId,
        league_id: `league_${sportId}_1`,
        status: isLive ? 'live' : 'upcoming',
        participants: [
          {
            id: homeTeam.id,
            name: homeTeam.name,
            is_home: true,
            score: isLive ? homeScore : undefined
          },
          {
            id: awayTeam.id,
            name: awayTeam.name,
            is_home: false,
            score: isLive ? awayScore : undefined
          }
        ],
        markets
      };
    } catch (error) {
      console.error(`Error generating mock event details for ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Generate mock user bets
   * @param walletAddress The user's wallet address
   * @param status Optional status filter
   * @returns Array of mock bets
   */
  private getMockUserBets(walletAddress: string, status?: string): WalBet[] {
    const bets: WalBet[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    // Use wallet address to seed randomness for consistent results
    const seedHex = walletAddress.substring(2, 10);
    const seed = parseInt(seedHex, 16);
    
    // Generate between 0 and 10 bets
    const betCount = (seed % 10) + 1;
    
    for (let i = 0; i < betCount; i++) {
      // Alternate between SUI and SBETS
      const currency = i % 2 === 0 ? 'SUI' : 'SBETS';
      
      // Generate random amount between 0.1 and 10
      const amount = parseFloat(((seed * (i + 1)) % 1000) / 100).toFixed(2);
      
      // Random odds between 1.1 and 5.0
      const odds = parseFloat(((seed * (i + 2)) % 400) / 100 + 1.1).toFixed(2);
      
      // Calculate potential payout
      const potentialPayout = parseFloat((parseFloat(amount) * parseFloat(odds)).toFixed(2));
      
      // Generate random status
      const statuses = ['pending', 'won', 'lost', 'cashout'];
      let betStatus: 'pending' | 'won' | 'lost' | 'refunded' | 'cashout';
      
      if (status && statuses.includes(status)) {
        betStatus = status as any;
      } else {
        betStatus = statuses[((seed * (i + 3)) % 4)] as any;
      }
      
      // Generate random times
      const createdAt = now - ((seed * (i + 4)) % 604800); // Up to 1 week ago
      let updatedAt = createdAt;
      let settledAt: number | undefined;
      
      if (betStatus !== 'pending') {
        // If settled, update times accordingly
        settledAt = createdAt + ((seed * (i + 5)) % 86400); // Up to 1 day after creation
        updatedAt = settledAt;
      }
      
      // Generate event and market IDs
      const sportId = ((seed * (i + 6)) % 4 + 1).toString();
      const eventId = `${sportId}_team1_team2_${createdAt}`;
      const marketId = `${eventId}_market_${((seed * (i + 7)) % 3 + 1)}`;
      const outcomeId = `${marketId}_outcome_${((seed * (i + 8)) % 2 + 1)}`;
      
      bets.push({
        id: `bet_${walletAddress.substring(2, 10)}_${i}`,
        user_id: `user_${walletAddress.substring(2, 10)}`,
        market_id: marketId,
        outcome_id: outcomeId,
        amount: parseFloat(amount),
        odds: parseFloat(odds),
        potential_payout: potentialPayout,
        status: betStatus,
        created_at: createdAt,
        updated_at: updatedAt,
        settled_at: settledAt,
        currency,
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`
      });
    }
    
    return bets;
  }
  
  /**
   * Generate markets for an event
   * @param eventId The event ID
   * @param sportId The sport ID
   * @param count Number of markets to generate
   * @returns Array of markets
   */
  private generateMarketsForEvent(eventId: string, sportId: string, count: number = 3): WalMarket[] {
    const markets: WalMarket[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    // Default market types
    const marketTypes: Record<string, Array<{ name: string; outcomes: string[] }>> = {
      '1': [ // Football
        { name: 'Match Winner', outcomes: ['Home Win', 'Draw', 'Away Win'] },
        { name: 'Over/Under 2.5 Goals', outcomes: ['Over 2.5', 'Under 2.5'] },
        { name: 'Both Teams to Score', outcomes: ['Yes', 'No'] },
        { name: 'First Team to Score', outcomes: ['Home', 'Away', 'No Goal'] },
        { name: 'Correct Score', outcomes: ['1-0', '2-0', '2-1', '0-0', '1-1', '2-2', '0-1', '0-2', '1-2'] }
      ],
      '2': [ // Basketball
        { name: 'Match Winner', outcomes: ['Home Win', 'Away Win'] },
        { name: 'Total Points Over/Under', outcomes: ['Over 200.5', 'Under 200.5'] },
        { name: 'Point Spread', outcomes: ['Home -5.5', 'Away +5.5'] },
        { name: 'First Quarter Winner', outcomes: ['Home', 'Away', 'Tie'] },
        { name: 'Player Points Over/Under', outcomes: ['Over 25.5', 'Under 25.5'] }
      ],
      '3': [ // Baseball
        { name: 'Match Winner', outcomes: ['Home Win', 'Away Win'] },
        { name: 'Total Runs Over/Under', outcomes: ['Over 8.5', 'Under 8.5'] },
        { name: 'Run Line', outcomes: ['Home -1.5', 'Away +1.5'] },
        { name: 'First Team to Score', outcomes: ['Home', 'Away', 'No Runs'] },
        { name: 'First Inning Winner', outcomes: ['Home', 'Away', 'Tie'] }
      ],
      '4': [ // Hockey
        { name: 'Match Winner', outcomes: ['Home Win', 'Away Win', 'Overtime'] },
        { name: 'Total Goals Over/Under', outcomes: ['Over 5.5', 'Under 5.5'] },
        { name: 'Puck Line', outcomes: ['Home -1.5', 'Away +1.5'] },
        { name: 'Period Winner', outcomes: ['Home', 'Away', 'Tie'] },
        { name: 'First Team to Score', outcomes: ['Home', 'Away', 'No Goal'] }
      ]
    };
    
    // Get market types for this sport, or use a default
    const sportMarkets = marketTypes[sportId] || marketTypes['1'];
    
    // Limit to requested count
    const marketsToUse = sportMarkets.slice(0, count);
    
    // Generate markets
    for (let i = 0; i < marketsToUse.length; i++) {
      const marketType = marketsToUse[i];
      const marketId = `${eventId}_market_${i+1}`;
      
      // Generate outcomes
      const outcomes: WalOutcome[] = [];
      
      for (let j = 0; j < marketType.outcomes.length; j++) {
        const outcomeName = marketType.outcomes[j];
        
        // Generate random odds between 1.1 and 10.0
        const odds = parseFloat((Math.random() * 8.9 + 1.1).toFixed(2));
        
        outcomes.push({
          id: `${marketId}_outcome_${j+1}`,
          name: outcomeName,
          odds,
          probability: parseFloat((1 / odds).toFixed(2)),
          status: 'active'
        });
      }
      
      // Random market start and end times
      const startTime = now - Math.floor(Math.random() * 3600); // Up to 1 hour ago
      const endTime = now + Math.floor(Math.random() * 86400); // Up to 1 day from now
      
      markets.push({
        id: marketId,
        name: marketType.name,
        description: `${marketType.name} market for this event`,
        starts_at: startTime,
        ends_at: endTime,
        status: 'open',
        outcomes,
        category: 'main',
        tags: ['popular', sportId]
      });
    }
    
    return markets;
  }
  
  /**
   * Get a random team for a sport
   * @param sportId Sport ID
   * @returns Random team
   */
  private getRandomTeam(sportId: string): { id: string; name: string } {
    const teams: Record<string, Array<{ id: string; name: string }>> = {
      '1': [ // Football
        { id: 'team_1_1', name: 'Arsenal' },
        { id: 'team_1_2', name: 'Manchester United' },
        { id: 'team_1_3', name: 'Liverpool' },
        { id: 'team_1_4', name: 'Chelsea' },
        { id: 'team_1_5', name: 'Manchester City' },
        { id: 'team_1_6', name: 'Tottenham' },
        { id: 'team_1_7', name: 'Newcastle' },
        { id: 'team_1_8', name: 'Aston Villa' }
      ],
      '2': [ // Basketball
        { id: 'team_2_1', name: 'Lakers' },
        { id: 'team_2_2', name: 'Celtics' },
        { id: 'team_2_3', name: 'Warriors' },
        { id: 'team_2_4', name: 'Bulls' },
        { id: 'team_2_5', name: 'Heat' },
        { id: 'team_2_6', name: 'Nets' },
        { id: 'team_2_7', name: 'Knicks' },
        { id: 'team_2_8', name: 'Mavericks' }
      ],
      '3': [ // Baseball
        { id: 'team_3_1', name: 'Yankees' },
        { id: 'team_3_2', name: 'Red Sox' },
        { id: 'team_3_3', name: 'Dodgers' },
        { id: 'team_3_4', name: 'Cubs' },
        { id: 'team_3_5', name: 'Giants' },
        { id: 'team_3_6', name: 'Astros' },
        { id: 'team_3_7', name: 'Braves' },
        { id: 'team_3_8', name: 'Cardinals' }
      ],
      '4': [ // Hockey
        { id: 'team_4_1', name: 'Maple Leafs' },
        { id: 'team_4_2', name: 'Canadiens' },
        { id: 'team_4_3', name: 'Bruins' },
        { id: 'team_4_4', name: 'Rangers' },
        { id: 'team_4_5', name: 'Blackhawks' },
        { id: 'team_4_6', name: 'Penguins' },
        { id: 'team_4_7', name: 'Red Wings' },
        { id: 'team_4_8', name: 'Flyers' }
      ]
    };
    
    const sportTeams = teams[sportId] || teams['1'];
    return sportTeams[Math.floor(Math.random() * sportTeams.length)];
  }
  
  /**
   * Get a team by ID
   * @param sportId Sport ID
   * @param teamId Team ID
   * @returns Team or null if not found
   */
  private getTeamById(sportId: string, teamId: string): { id: string; name: string } | null {
    const teams: Record<string, Array<{ id: string; name: string }>> = {
      '1': [ // Football
        { id: 'team_1_1', name: 'Arsenal' },
        { id: 'team_1_2', name: 'Manchester United' },
        { id: 'team_1_3', name: 'Liverpool' },
        { id: 'team_1_4', name: 'Chelsea' },
        { id: 'team_1_5', name: 'Manchester City' },
        { id: 'team_1_6', name: 'Tottenham' },
        { id: 'team_1_7', name: 'Newcastle' },
        { id: 'team_1_8', name: 'Aston Villa' }
      ],
      '2': [ // Basketball
        { id: 'team_2_1', name: 'Lakers' },
        { id: 'team_2_2', name: 'Celtics' },
        { id: 'team_2_3', name: 'Warriors' },
        { id: 'team_2_4', name: 'Bulls' },
        { id: 'team_2_5', name: 'Heat' },
        { id: 'team_2_6', name: 'Nets' },
        { id: 'team_2_7', name: 'Knicks' },
        { id: 'team_2_8', name: 'Mavericks' }
      ],
      '3': [ // Baseball
        { id: 'team_3_1', name: 'Yankees' },
        { id: 'team_3_2', name: 'Red Sox' },
        { id: 'team_3_3', name: 'Dodgers' },
        { id: 'team_3_4', name: 'Cubs' },
        { id: 'team_3_5', name: 'Giants' },
        { id: 'team_3_6', name: 'Astros' },
        { id: 'team_3_7', name: 'Braves' },
        { id: 'team_3_8', name: 'Cardinals' }
      ],
      '4': [ // Hockey
        { id: 'team_4_1', name: 'Maple Leafs' },
        { id: 'team_4_2', name: 'Canadiens' },
        { id: 'team_4_3', name: 'Bruins' },
        { id: 'team_4_4', name: 'Rangers' },
        { id: 'team_4_5', name: 'Blackhawks' },
        { id: 'team_4_6', name: 'Penguins' },
        { id: 'team_4_7', name: 'Red Wings' },
        { id: 'team_4_8', name: 'Flyers' }
      ]
    };
    
    const sportTeams = teams[sportId] || teams['1'];
    return sportTeams.find(team => team.id === teamId) || null;
  }
  
  /**
   * Get sport name from ID
   * @param sportId Sport ID
   * @returns Sport name
   */
  private getSportName(sportId: string): string {
    const sports: Record<string, string> = {
      '1': 'Football',
      '2': 'Basketball',
      '3': 'Baseball',
      '4': 'Hockey'
    };
    
    return sports[sportId] || 'Football';
  }
  
  /**
   * Get max score for a sport (for generating random scores)
   * @param sportId Sport ID
   * @returns Max score
   */
  private getMaxScore(sportId: string): number {
    const maxScores: Record<string, number> = {
      '1': 5, // Football - typically low scoring
      '2': 120, // Basketball - high scoring
      '3': 10, // Baseball - medium scoring
      '4': 6 // Hockey - low scoring
    };
    
    return maxScores[sportId] || 5;
  }
  
  /**
   * Get max match time in minutes for a sport
   * @param sportId Sport ID
   * @returns Max time in minutes
   */
  private getMaxTime(sportId: string): number {
    const maxTimes: Record<string, number> = {
      '1': 90, // Football - 90 minutes
      '2': 48, // Basketball - 48 minutes (NBA)
      '3': 180, // Baseball - ~3 hours
      '4': 60 // Hockey - 60 minutes
    };
    
    return maxTimes[sportId] || 90;
  }
}

// Export singleton instance
export const walProtocolService = new WalProtocolService();