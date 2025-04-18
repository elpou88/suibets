import { db } from './db';
import { users, type User, type InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import pg from 'pg';

// Create connection pool for PostgreSQL session store
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  // Additional methods for wallet-based users
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  updateWalletAddress(userId: number, walletAddress: string, walletType: string): Promise<User>;
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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
}

// Export an instance of the storage class
export const storage = new DatabaseStorage();