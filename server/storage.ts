import { db } from './db';
import { users, sports, events, markets, bets, promotions, wurlus_wallet_operations, type User, type InsertUser, type Sport, type Event, type Market } from "@shared/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import pg from 'pg';

// Create connection pool for PostgreSQL session store
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  updateWalletAddress(userId: number, walletAddress: string, walletType: string): Promise<User>;
  
  // Sports data methods
  getSports(): Promise<Sport[]>;
  getEvents(sportId?: number, isLive?: boolean, limit?: number): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getMarkets(eventId: number): Promise<Market[]>;
  getPromotions(): Promise<any[]>;
  
  // Betting methods
  getBet(betId: number | string): Promise<any | undefined>;
  getBetByStringId(betId: string): Promise<any | undefined>;
  createBet(bet: any): Promise<any>;
  createParlay(parlay: any): Promise<any>;
  getUserBets(userId: string): Promise<any[]>;
  getAllBets(status?: string): Promise<any[]>;
  updateBetStatus(betId: string, status: string, payout?: number): Promise<void>;
  markBetWinningsWithdrawn(betId: number, txHash: string): Promise<void>;
  cashOutSingleBet(betId: number): Promise<void>;
  
  // Session store
  sessionStore: any;
  
  // Balance methods (persistent)
  getUserBalance(walletAddress: string): Promise<{ suiBalance: number; sbetsBalance: number } | undefined>;
  updateUserBalance(walletAddress: string, suiDelta: number, sbetsDelta: number): Promise<void>;
  setUserBalance(walletAddress: string, suiBalance: number, sbetsBalance: number): Promise<void>;
  recordWalletOperation(walletAddress: string, operationType: string, amount: number, txHash: string, metadata?: any): Promise<void>;
  getWalletOperations(walletAddress: string, limit?: number): Promise<any[]>;
  isTransactionProcessed(txHash: string): Promise<boolean>;
  getPlatformRevenue(): Promise<{ suiRevenue: number; sbetsRevenue: number }>;
  addPlatformRevenue(amount: number, currency: 'SUI' | 'SBETS'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Initialize the PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Create a new user
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateWalletAddress(userId: number, walletAddress: string, walletType: string): Promise<User> {
    // Update a user's wallet address and type
    const [user] = await db
      .update(users)
      .set({ 
        walletAddress,
        walletType,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Add a method to update a user's Stripe customer ID (for future Stripe integration)
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Add a method to update a user's Stripe subscription ID (for future Stripe integration)
  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string, subscriptionId: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // Get all sports
  async getSports(): Promise<Sport[]> {
    try {
      // Get sports from the database
      const sportsList = await db.select().from(sports).where(eq(sports.isActive, true));
      
      // If we don't have any sports in the DB yet, return default sports
      if (!sportsList || sportsList.length === 0) {
        return [
          { id: 1, name: 'Football', slug: 'football', icon: 'football', wurlusSportId: null, providerId: null, isActive: true },
          { id: 2, name: 'Basketball', slug: 'basketball', icon: 'basketball', wurlusSportId: null, providerId: null, isActive: true },
          { id: 3, name: 'Tennis', slug: 'tennis', icon: 'tennis', wurlusSportId: null, providerId: null, isActive: true },
          { id: 4, name: 'Baseball', slug: 'baseball', icon: 'baseball', wurlusSportId: null, providerId: null, isActive: true },
          { id: 5, name: 'Hockey', slug: 'hockey', icon: 'hockey', wurlusSportId: null, providerId: null, isActive: true },
          { id: 6, name: 'Handball', slug: 'handball', icon: 'handball', wurlusSportId: null, providerId: null, isActive: true },
          { id: 7, name: 'Volleyball', slug: 'volleyball', icon: 'volleyball', wurlusSportId: null, providerId: null, isActive: true },
          { id: 8, name: 'Rugby', slug: 'rugby', icon: 'rugby', wurlusSportId: null, providerId: null, isActive: true },
          { id: 9, name: 'Cricket', slug: 'cricket', icon: 'cricket', wurlusSportId: null, providerId: null, isActive: true },
          { id: 10, name: 'Golf', slug: 'golf', icon: 'golf', wurlusSportId: null, providerId: null, isActive: true },
          { id: 11, name: 'Boxing', slug: 'boxing', icon: 'boxing', wurlusSportId: null, providerId: null, isActive: true },
          { id: 12, name: 'MMA/UFC', slug: 'mma-ufc', icon: 'mma', wurlusSportId: null, providerId: null, isActive: true },
          { id: 13, name: 'Formula 1', slug: 'formula_1', icon: 'formula1', wurlusSportId: null, providerId: null, isActive: true },
          { id: 14, name: 'Cycling', slug: 'cycling', icon: 'cycling', wurlusSportId: null, providerId: null, isActive: true },
          { id: 15, name: 'American Football', slug: 'american_football', icon: 'american-football', wurlusSportId: null, providerId: null, isActive: true },
          { id: 16, name: 'Australian Football', slug: 'afl', icon: 'australian-football', wurlusSportId: null, providerId: null, isActive: true },
          { id: 17, name: 'Snooker', slug: 'snooker', icon: 'snooker', wurlusSportId: null, providerId: null, isActive: true },
          { id: 18, name: 'Darts', slug: 'darts', icon: 'darts', wurlusSportId: null, providerId: null, isActive: true },
          { id: 19, name: 'Table Tennis', slug: 'table-tennis', icon: 'table-tennis', wurlusSportId: null, providerId: null, isActive: true },
          { id: 20, name: 'Badminton', slug: 'badminton', icon: 'badminton', wurlusSportId: null, providerId: null, isActive: true }
        ];
      }
      
      return sportsList;
    } catch (error) {
      console.error('Error getting sports:', error);
      return [];
    }
  }
  
  // Get events with optional filters
  async getEvents(sportId?: number, isLive?: boolean, limit?: number): Promise<Event[]> {
    try {
      let query = db.select().from(events);
      
      // Apply filters if provided
      if (sportId !== undefined) {
        query = query.where(eq(events.sportId, sportId));
      }
      
      if (isLive !== undefined) {
        query = query.where(eq(events.isLive, isLive));
      }
      
      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }
  
  // Get a specific event by ID
  async getEvent(id: number): Promise<Event | undefined> {
    try {
      const [event] = await db.select().from(events).where(eq(events.id, id));
      return event;
    } catch (error) {
      console.error(`Error getting event ${id}:`, error);
      return undefined;
    }
  }
  
  // Get markets for an event
  async getMarkets(eventId: number): Promise<Market[]> {
    try {
      return await db.select().from(markets).where(eq(markets.eventId, eventId));
    } catch (error) {
      console.error(`Error getting markets for event ${eventId}:`, error);
      return [];
    }
  }
  
  // Get promotions from database
  async getPromotions(): Promise<any[]> {
    try {
      const promoList = await db.select().from(promotions).where(eq(promotions.isActive, true));
      
      if (promoList && promoList.length > 0) {
        return promoList;
      }
      
      // Return empty array if no promotions exist - no mock data
      return [];
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }
  }

  // Betting methods implementation with PostgreSQL database
  async getBet(betId: number | string): Promise<any | undefined> {
    try {
      let bet;
      if (typeof betId === 'number') {
        [bet] = await db.select().from(bets).where(eq(bets.id, betId));
      } else {
        // String ID - search by wurlusBetId field
        [bet] = await db.select().from(bets).where(eq(bets.wurlusBetId, betId));
      }
      
      if (!bet) return undefined;
      
      // Return with string ID for compatibility
      return {
        ...bet,
        id: bet.wurlusBetId || String(bet.id),
        userId: bet.walletAddress, // Use walletAddress as userId for settlement
        winningsWithdrawn: bet.status === 'winnings_withdrawn',
        amount: bet.betAmount
      };
    } catch (error) {
      console.error('Error getting bet from database:', error);
      return undefined;
    }
  }

  async getBetByStringId(betId: string): Promise<any | undefined> {
    return this.getBet(betId);
  }

  async createBet(bet: any): Promise<any> {
    try {
      // DUPLICATE PREVENTION: Check if bet with same ID already exists
      if (bet.id) {
        const existing = await db.select().from(bets).where(eq(bets.wurlusBetId, bet.id));
        if (existing.length > 0) {
          console.log(`⚠️ DUPLICATE BET PREVENTION: Bet ${bet.id} already exists`);
          return { ...existing[0], id: bet.id, duplicate: true };
        }
      }
      
      // Generate mock tx hash (in production, this would be the real blockchain tx)
      const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 40)}`;
      
      // NORMALIZE wallet address to lowercase for consistent retrieval
      const normalizedWallet = bet.userId?.toLowerCase?.() || bet.userId;
      
      // Insert into PostgreSQL database - use null for userId to avoid FK constraint
      const [inserted] = await db.insert(bets).values({
        userId: null, // Don't link to users table - wallet-based system
        walletAddress: normalizedWallet, // Store NORMALIZED wallet address for settlement payout
        betAmount: bet.betAmount,
        odds: bet.odds,
        prediction: bet.prediction,
        potentialPayout: bet.potentialPayout,
        status: 'pending',
        betType: bet.betType || 'single',
        cashOutAvailable: true,
        wurlusBetId: bet.id, // Store string ID here
        txHash: bet.txHash || txHash,
        platformFee: bet.platformFee,
        networkFee: bet.networkFee,
        feeCurrency: bet.currency || 'SUI',
        eventName: bet.eventName || 'Unknown Event' // Store event name for display
      }).returning();
      
      console.log(`✅ BET STORED IN DB: ${bet.id} (db id: ${inserted.id}) tx: ${inserted.txHash}`);
      
      // Return with original string ID
      return {
        ...inserted,
        id: bet.id,
        userId: bet.userId, // Keep original userId in response
        currency: inserted.feeCurrency,
        amount: inserted.betAmount
      };
    } catch (error) {
      console.error('Error creating bet in database:', error);
      throw error;
    }
  }

  async createParlay(parlay: any): Promise<any> {
    try {
      // For parlays, we store in DB with a special betType
      // IMPORTANT: Store walletAddress so bets are ALWAYS retrievable and never disappear
      // NORMALIZE wallet address to lowercase for consistent retrieval
      const normalizedWallet = parlay.userId?.toLowerCase?.() || parlay.userId;
      
      const [inserted] = await db.insert(bets).values({
        userId: null, // Don't link to users table - wallet-based system
        walletAddress: normalizedWallet, // Store NORMALIZED wallet address for bet retrieval and settlement
        betAmount: parlay.totalStake,
        odds: parlay.combinedOdds,
        prediction: JSON.stringify(parlay.selections),
        potentialPayout: parlay.potentialPayout,
        status: 'pending',
        betType: 'parlay',
        cashOutAvailable: true,
        wurlusBetId: parlay.id,
        platformFee: parlay.platformFee,
        networkFee: parlay.networkFee,
        feeCurrency: parlay.currency || 'SUI',
        eventName: 'Parlay Bet' // Ensure parlay has event name for display
      }).returning();
      
      console.log(`✅ PARLAY STORED IN DB: ${parlay.id} (db id: ${inserted.id})`);
      
      return {
        ...inserted,
        id: parlay.id,
        userId: parlay.userId, // Keep original userId in response
        selections: parlay.selections
      };
    } catch (error) {
      console.error('Error creating parlay in database:', error);
      throw error;
    }
  }

  async getUserBets(userId: string): Promise<any[]> {
    try {
      // COMPREHENSIVE bet retrieval - NEVER loses bets
      // Combines all possible sources to guarantee 100% bet persistence
      const normalizedAddress = userId.toLowerCase();
      const allMatchedBets: any[] = [];
      const seenIds = new Set<number>();
      
      // Helper to add bets without duplicates
      const addBets = (betList: any[]) => {
        for (const bet of betList) {
          if (!seenIds.has(bet.id)) {
            seenIds.add(bet.id);
            allMatchedBets.push(bet);
          }
        }
      };
      
      // STRATEGY 1: Match walletAddress with any casing (primary lookup)
      const walletBets = await db.select().from(bets)
        .where(or(
          sql`LOWER(${bets.walletAddress}) = ${normalizedAddress}`,
          eq(bets.walletAddress, userId)
        ))
        .orderBy(desc(bets.createdAt));
      addBets(walletBets);
      
      // STRATEGY 2: Match by numeric userId (legacy support)
      // IMPORTANT: Only run for purely numeric IDs to avoid cross-user leakage
      if (/^\d+$/.test(userId)) {
        const userIdNum = parseInt(userId);
        const legacyUserBets = await db.select().from(bets)
          .where(eq(bets.userId, userIdNum))
          .orderBy(desc(bets.createdAt));
        addBets(legacyUserBets);
      }
      
      // STRATEGY 3: Match by wurlusBetId containing wallet prefix
      if (userId.startsWith('0x') || userId.length > 20) {
        const shortPrefix = userId.slice(0, 10).toLowerCase();
        const wurlusBets = await db.select().from(bets)
          .where(sql`LOWER(${bets.wurlusBetId}) LIKE ${`%${shortPrefix}%`}`)
          .orderBy(desc(bets.createdAt));
        addBets(wurlusBets);
      }
      
      // STRATEGY 4: Include legacy bets with NULL walletAddress that match wallet pattern
      if (userId.startsWith('0x')) {
        const walletPrefix = userId.slice(0, 8).toLowerCase();
        const nullWalletBets = await db.select().from(bets)
          .where(sql`${bets.walletAddress} IS NULL`)
          .orderBy(desc(bets.createdAt))
          .limit(200);
        
        // Filter by wurlusBetId or txHash containing wallet prefix
        const matchingLegacy = nullWalletBets.filter((bet: any) => 
          bet.wurlusBetId?.toLowerCase().includes(walletPrefix) ||
          bet.txHash?.toLowerCase().includes(walletPrefix)
        );
        addBets(matchingLegacy);
      }
      
      // Sort all results by creation date
      allMatchedBets.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      console.log(`📋 getUserBets: Found ${allMatchedBets.length} bets for ${userId.slice(0, 12)}...`);
      
      // Transform to match frontend's expected format for bet-history page
      return allMatchedBets.map((bet: any) => ({
        id: bet.wurlusBetId || String(bet.id),
        eventName: bet.eventName || 'Unknown Event',
        selection: bet.prediction,
        odds: bet.odds,
        stake: bet.betAmount,
        potentialWin: bet.potentialPayout,
        status: bet.status,
        placedAt: bet.createdAt?.toISOString() || new Date().toISOString(),
        settledAt: bet.settledAt?.toISOString(),
        txHash: bet.txHash,
        currency: bet.feeCurrency,
        betType: bet.betType
      }));
    } catch (error) {
      console.error('Error getting user bets:', error);
      return [];
    }
  }

  async getAllBets(status?: string): Promise<any[]> {
    try {
      let allBets;
      if (status && status !== 'all') {
        allBets = await db.select().from(bets).where(eq(bets.status, status));
      } else {
        allBets = await db.select().from(bets);
      }
      
      // Transform to match admin panel format with user info
      return allBets.map((bet: any) => ({
        id: bet.wurlusBetId || String(bet.id),
        dbId: bet.id,
        userId: bet.userId,
        walletAddress: bet.walletAddress,
        eventId: bet.eventId,
        eventName: bet.eventName || 'Unknown Event',
        selection: bet.prediction,
        odds: bet.odds,
        stake: bet.betAmount,
        potentialWin: bet.potentialPayout,
        status: bet.status,
        placedAt: bet.createdAt?.toISOString() || new Date().toISOString(),
        settledAt: bet.settledAt?.toISOString(),
        txHash: bet.txHash,
        currency: bet.feeCurrency,
        betType: bet.betType,
        platformFee: bet.platformFee,
        networkFee: bet.networkFee
      }));
    } catch (error) {
      console.error('Error getting all bets:', error);
      return [];
    }
  }

  async updateBetStatus(betId: string, status: string, payout?: number): Promise<void> {
    try {
      // DUPLICATE SETTLEMENT PREVENTION: Check if bet is already settled
      const existing = await db.select().from(bets).where(eq(bets.wurlusBetId, betId));
      if (existing.length > 0) {
        const currentStatus = existing[0].status;
        if (currentStatus === 'won' || currentStatus === 'lost' || currentStatus === 'cashed_out' || currentStatus === 'void') {
          console.log(`⚠️ DUPLICATE SETTLEMENT BLOCKED: Bet ${betId} already settled as ${currentStatus}`);
          return; // Don't update already settled bets
        }
      }
      
      const updateData: any = { status };
      if (payout !== undefined) {
        updateData.payout = payout;
      }
      if (status === 'won' || status === 'lost' || status === 'cashed_out') {
        updateData.settledAt = new Date();
      }
      
      await db.update(bets)
        .set(updateData)
        .where(eq(bets.wurlusBetId, betId));
      
      console.log(`✅ BET STATUS UPDATED IN DB: ${betId} -> ${status}`);
    } catch (error) {
      console.error('Error updating bet status in database:', error);
    }
  }

  async markBetWinningsWithdrawn(betId: number, txHash: string): Promise<void> {
    try {
      await db.update(bets)
        .set({ 
          status: 'winnings_withdrawn',
          txHash: txHash,
          settledAt: new Date()
        })
        .where(eq(bets.id, betId));
      console.log(`Marked bet ${betId} winnings as withdrawn with tx hash: ${txHash}`);
    } catch (error) {
      console.error('Error updating bet winnings withdrawal:', error);
      // Log the action even if database update fails
      console.log(`Marking bet ${betId} winnings as withdrawn with tx hash: ${txHash}`);
    }
  }

  async cashOutSingleBet(betId: number): Promise<void> {
    try {
      await db.update(bets)
        .set({ 
          status: 'cashed_out',
          cashOutAt: new Date(),
          cashOutAvailable: false
        })
        .where(eq(bets.id, betId));
      console.log(`Cashed out bet ${betId}`);
    } catch (error) {
      console.error('Error updating bet cash out:', error);
      // Log the action even if database update fails
      console.log(`Cashing out bet ${betId}`);
    }
  }

  // === PERSISTENT BALANCE METHODS ===
  
  async getUserBalance(walletAddress: string): Promise<{ suiBalance: number; sbetsBalance: number } | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
      if (!user) return undefined;
      return {
        suiBalance: user.suiBalance || 0,
        sbetsBalance: user.sbetsBalance || 0
      };
    } catch (error) {
      console.error('Error getting user balance:', error);
      return undefined;
    }
  }

  async updateUserBalance(walletAddress: string, suiDelta: number, sbetsDelta: number): Promise<void> {
    try {
      // Get current balance
      const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
      
      if (!user) {
        // Create new user with wallet address if doesn't exist
        await db.insert(users).values({
          username: `wallet_${walletAddress.slice(0, 8)}`,
          password: '',
          walletAddress,
          suiBalance: Math.max(0, suiDelta),
          sbetsBalance: Math.max(0, sbetsDelta)
        });
        console.log(`📝 Created new user for wallet ${walletAddress.slice(0, 8)}... with balance ${suiDelta} SUI, ${sbetsDelta} SBETS`);
        return;
      }

      // Update existing user's balance
      const newSuiBalance = Math.max(0, (user.suiBalance || 0) + suiDelta);
      const newSbetsBalance = Math.max(0, (user.sbetsBalance || 0) + sbetsDelta);
      
      await db.update(users)
        .set({ 
          suiBalance: newSuiBalance,
          sbetsBalance: newSbetsBalance
        })
        .where(eq(users.walletAddress, walletAddress));
      
      console.log(`💰 DB BALANCE UPDATE: ${walletAddress.slice(0, 8)}... | SUI: ${user.suiBalance || 0} -> ${newSuiBalance} | SBETS: ${user.sbetsBalance || 0} -> ${newSbetsBalance}`);
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }

  async setUserBalance(walletAddress: string, suiBalance: number, sbetsBalance: number): Promise<void> {
    try {
      const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
      
      if (!user) {
        // Create new user with wallet address
        await db.insert(users).values({
          username: `wallet_${walletAddress.slice(0, 8)}`,
          password: '',
          walletAddress,
          suiBalance,
          sbetsBalance
        });
        console.log(`📝 Created new user for wallet ${walletAddress.slice(0, 8)}... with balance ${suiBalance} SUI, ${sbetsBalance} SBETS`);
        return;
      }

      await db.update(users)
        .set({ suiBalance, sbetsBalance })
        .where(eq(users.walletAddress, walletAddress));
      
      console.log(`💰 DB BALANCE SET: ${walletAddress.slice(0, 8)}... | SUI: ${suiBalance} | SBETS: ${sbetsBalance}`);
    } catch (error) {
      console.error('Error setting user balance:', error);
    }
  }

  async recordWalletOperation(walletAddress: string, operationType: string, amount: number, txHash: string, metadata?: any): Promise<void> {
    try {
      await db.insert(wurlus_wallet_operations).values({
        walletAddress,
        operationType,
        amount,
        txHash,
        status: 'completed',
        metadata: metadata || {}
      });
      console.log(`📋 WALLET OP RECORDED: ${operationType} | ${amount} | ${walletAddress.slice(0, 8)}... | tx: ${txHash.slice(0, 16)}...`);
    } catch (error) {
      console.error('Error recording wallet operation:', error);
    }
  }

  async getWalletOperations(walletAddress: string, limit: number = 50): Promise<any[]> {
    try {
      const operations = await db.select()
        .from(wurlus_wallet_operations)
        .where(eq(wurlus_wallet_operations.walletAddress, walletAddress))
        .orderBy(desc(wurlus_wallet_operations.timestamp))
        .limit(limit);
      
      return operations.map(op => ({
        type: op.operationType,
        amount: op.amount,
        txHash: op.txHash,
        status: op.status,
        timestamp: op.timestamp,
        metadata: op.metadata
      }));
    } catch (error) {
      console.error('Error getting wallet operations:', error);
      return [];
    }
  }

  async isTransactionProcessed(txHash: string): Promise<boolean> {
    try {
      const [existing] = await db.select()
        .from(wurlus_wallet_operations)
        .where(eq(wurlus_wallet_operations.txHash, txHash));
      return !!existing;
    } catch (error) {
      console.error('Error checking transaction:', error);
      return false;
    }
  }

  async getPlatformRevenue(): Promise<{ suiRevenue: number; sbetsRevenue: number }> {
    try {
      // Platform revenue is stored in a special user with wallet address 'platform_revenue'
      const [platform] = await db.select().from(users).where(eq(users.walletAddress, 'platform_revenue'));
      if (!platform) {
        return { suiRevenue: 0, sbetsRevenue: 0 };
      }
      return {
        suiRevenue: platform.suiBalance || 0,
        sbetsRevenue: platform.sbetsBalance || 0
      };
    } catch (error) {
      console.error('Error getting platform revenue:', error);
      return { suiRevenue: 0, sbetsRevenue: 0 };
    }
  }

  async addPlatformRevenue(amount: number, currency: 'SUI' | 'SBETS'): Promise<void> {
    try {
      const platformWallet = 'platform_revenue';
      let [platform] = await db.select().from(users).where(eq(users.walletAddress, platformWallet));
      
      if (!platform) {
        // Create platform revenue account
        await db.insert(users).values({
          username: 'platform_revenue',
          password: '',
          walletAddress: platformWallet,
          suiBalance: currency === 'SUI' ? amount : 0,
          sbetsBalance: currency === 'SBETS' ? amount : 0
        });
        console.log(`📊 PLATFORM REVENUE CREATED: ${amount} ${currency}`);
        return;
      }

      if (currency === 'SUI') {
        await db.update(users)
          .set({ suiBalance: (platform.suiBalance || 0) + amount })
          .where(eq(users.walletAddress, platformWallet));
        console.log(`📊 PLATFORM REVENUE: +${amount} SUI | Total: ${(platform.suiBalance || 0) + amount} SUI`);
      } else {
        await db.update(users)
          .set({ sbetsBalance: (platform.sbetsBalance || 0) + amount })
          .where(eq(users.walletAddress, platformWallet));
        console.log(`📊 PLATFORM REVENUE: +${amount} SBETS | Total: ${(platform.sbetsBalance || 0) + amount} SBETS`);
      }
    } catch (error) {
      console.error('Error adding platform revenue:', error);
    }
  }
}

// Export an instance of the storage class
export const storage = new DatabaseStorage();