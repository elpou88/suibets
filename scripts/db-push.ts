import { db } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";
import pg from "pg";

/**
 * This script will push the schema to the database.
 * Run with: npx tsx scripts/db-push.ts
 */
async function main() {
  console.log("Pushing schema to database...");
  
  try {
    // Create the tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "email" TEXT,
        "wallet_address" TEXT UNIQUE,
        "wallet_fingerprint" TEXT UNIQUE,
        "wallet_type" TEXT DEFAULT 'Sui',
        "balance" REAL DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "wurlus_profile_id" TEXT,
        "wurlus_registered" BOOLEAN DEFAULT FALSE,
        "wurlus_profile_created_at" TIMESTAMP,
        "last_login_at" TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "sports" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "icon" TEXT,
        "wurlus_sport_id" TEXT,
        "is_active" BOOLEAN DEFAULT TRUE,
        "provider_id" TEXT
      );

      CREATE TABLE IF NOT EXISTS "events" (
        "id" SERIAL PRIMARY KEY,
        "sport_id" INTEGER REFERENCES "sports"("id"),
        "league_name" TEXT NOT NULL,
        "league_slug" TEXT NOT NULL,
        "home_team" TEXT NOT NULL,
        "away_team" TEXT NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "home_odds" REAL,
        "draw_odds" REAL,
        "away_odds" REAL,
        "is_live" BOOLEAN DEFAULT FALSE,
        "score" TEXT,
        "status" TEXT DEFAULT 'upcoming',
        "metadata" JSONB,
        "wurlus_event_id" TEXT,
        "wurlus_market_ids" TEXT[],
        "created_on_chain" BOOLEAN DEFAULT FALSE,
        "event_hash" TEXT,
        "provider_id" TEXT
      );

      CREATE TABLE IF NOT EXISTS "markets" (
        "id" SERIAL PRIMARY KEY,
        "event_id" INTEGER REFERENCES "events"("id"),
        "name" TEXT NOT NULL,
        "market_type" TEXT NOT NULL,
        "status" TEXT DEFAULT 'open',
        "wurlus_market_id" TEXT NOT NULL UNIQUE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "settled_at" TIMESTAMP,
        "creator_address" TEXT,
        "liquidity_pool" REAL DEFAULT 0,
        "transaction_hash" TEXT
      );

      CREATE TABLE IF NOT EXISTS "outcomes" (
        "id" SERIAL PRIMARY KEY,
        "market_id" INTEGER REFERENCES "markets"("id"),
        "name" TEXT NOT NULL,
        "odds" REAL NOT NULL,
        "probability" REAL,
        "status" TEXT DEFAULT 'active',
        "wurlus_outcome_id" TEXT NOT NULL UNIQUE,
        "transaction_hash" TEXT,
        "is_winner" BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS "bets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "event_id" INTEGER REFERENCES "events"("id"),
        "market_id" INTEGER REFERENCES "markets"("id"),
        "outcome_id" INTEGER REFERENCES "outcomes"("id"),
        "bet_amount" REAL NOT NULL,
        "odds" REAL NOT NULL,
        "prediction" TEXT NOT NULL,
        "potential_payout" REAL NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "result" TEXT,
        "payout" REAL,
        "settled_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "wurlus_bet_id" TEXT,
        "tx_hash" TEXT,
        "platform_fee" REAL,
        "network_fee" REAL,
        "fee_currency" TEXT DEFAULT 'SUI'
      );

      CREATE TABLE IF NOT EXISTS "wurlus_staking" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "wallet_address" TEXT NOT NULL,
        "amount_staked" REAL NOT NULL,
        "staking_date" TIMESTAMP DEFAULT NOW(),
        "unstaking_date" TIMESTAMP,
        "is_active" BOOLEAN DEFAULT TRUE,
        "tx_hash" TEXT,
        "locked_until" TIMESTAMP,
        "reward_rate" REAL,
        "accumulated_rewards" REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "wurlus_dividends" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "wallet_address" TEXT NOT NULL,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "dividend_amount" REAL NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "claimed_at" TIMESTAMP,
        "claim_tx_hash" TEXT,
        "platform_fee" REAL
      );

      CREATE TABLE IF NOT EXISTS "wurlus_wallet_operations" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "wallet_address" TEXT NOT NULL,
        "operation_type" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "tx_hash" TEXT NOT NULL,
        "status" TEXT DEFAULT 'completed',
        "timestamp" TIMESTAMP DEFAULT NOW(),
        "metadata" JSONB
      );

      CREATE TABLE IF NOT EXISTS "promotions" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "image_url" TEXT,
        "type" TEXT NOT NULL,
        "amount" REAL,
        "code" TEXT,
        "min_deposit" REAL,
        "rollover_sports" REAL,
        "rollover_casino" REAL,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "is_active" BOOLEAN DEFAULT TRUE,
        "wurlus_promotion_id" TEXT,
        "smart_contract_address" TEXT
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER REFERENCES "users"("id"),
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "is_read" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "related_tx_hash" TEXT,
        "notification_type" TEXT DEFAULT 'app',
        "priority" TEXT DEFAULT 'normal'
      );
    `);
    
    console.log("Database schema pushed successfully!");
    
    // Seed some initial data for sports
    await seedSports();
    await seedPromotions();
    
    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

async function seedSports() {
  const existingSports = await db.select().from(schema.sports);
  
  if (existingSports.length === 0) {
    console.log("Seeding sports data...");
    
    const defaultSports = [
      { name: "Football", slug: "football", icon: "football" },
      { name: "Basketball", slug: "basketball", icon: "basketball" },
      { name: "Tennis", slug: "tennis", icon: "tennis" },
      { name: "Baseball", slug: "baseball", icon: "baseball" },
      { name: "Boxing", slug: "boxing", icon: "boxing" },
      { name: "Hockey", slug: "hockey", icon: "hockey" },
      { name: "Esports", slug: "esports", icon: "esports" },
      { name: "MMA/UFC", slug: "mma-ufc", icon: "mma" },
      { name: "Volleyball", slug: "volleyball", icon: "volleyball" },
      { name: "Table Tennis", slug: "table-tennis", icon: "table-tennis" },
      { name: "Rugby League", slug: "rugby-league", icon: "rugby" },
      { name: "Rugby Union", slug: "rugby-union", icon: "rugby" },
      { name: "Cricket", slug: "cricket", icon: "cricket" },
      { name: "Horse Racing", slug: "horse-racing", icon: "horse-racing" },
      { name: "Greyhounds", slug: "greyhounds", icon: "greyhounds" },
      { name: "AFL", slug: "afl", icon: "afl" }
    ];
    
    await db.insert(schema.sports).values(defaultSports);
    console.log(`Seeded ${defaultSports.length} sports`);
  } else {
    console.log(`Found ${existingSports.length} existing sports, skipping seed`);
  }
}

async function seedPromotions() {
  const existingPromotions = await db.select().from(schema.promotions);
  
  if (existingPromotions.length === 0) {
    console.log("Seeding promotions data...");
    
    const defaultPromotions = [
      {
        title: "100% SIGN-UP BONUS",
        description: "FIRST DEPOSIT BONUS UP TO 1000 SUIBETS",
        type: "sign-up",
        amount: 1000,
        minDeposit: 20,
        rolloverSports: 10,
        rolloverCasino: 35,
        isActive: true
      },
      {
        title: "$50 RISK-FREE BET",
        description: "GET RISK-FREE BET UP TO 500 SUIBETS",
        type: "risk-free",
        amount: 50,
        minDeposit: 20,
        rolloverSports: 10,
        rolloverCasino: 35,
        isActive: true
      },
      {
        title: "Earn Referral Bonus of up to 500000 $SUIBETS",
        description: "Refer friends and earn up to 500000 $SUIBETS",
        type: "referral",
        amount: 500000,
        isActive: true
      }
    ];
    
    await db.insert(schema.promotions).values(defaultPromotions);
    console.log(`Seeded ${defaultPromotions.length} promotions`);
  } else {
    console.log(`Found ${existingPromotions.length} existing promotions, skipping seed`);
  }
}

main();