import { db } from './db';
import { users, sports, events, markets, bets, promotions, type User, type InsertUser, type Sport, type Event, type Market } from "@shared/schema";
import { eq } from "drizzle-orm";
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
      // Generate mock tx hash (in production, this would be the real blockchain tx)
      const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 40)}`;
      
      // Insert into PostgreSQL database - use null for userId to avoid FK constraint
      const [inserted] = await db.insert(bets).values({
        userId: null, // Don't link to users table - wallet-based system
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
      const [inserted] = await db.insert(bets).values({
        userId: null, // Don't link to users table - wallet-based system
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
        feeCurrency: parlay.currency || 'SUI'
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
      const userIdNum = parseInt(userId);
      const userBets = isNaN(userIdNum) 
        ? await db.select().from(bets) // If no valid userId, return all (for demo)
        : await db.select().from(bets).where(eq(bets.userId, userIdNum));
      
      // Transform to match frontend's expected format for bet-history page
      return userBets.map(bet => ({
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
      return allBets.map(bet => ({
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
}

// Export an instance of the storage class
export const storage = new DatabaseStorage();