import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  walletAddress: text("wallet_address"),
  walletType: text("wallet_type").default("Sui"),
  balance: real("balance").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon")
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  sportId: integer("sport_id").references(() => sports.id),
  leagueName: text("league_name").notNull(),
  leagueSlug: text("league_slug").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  startTime: timestamp("start_time").notNull(),
  homeOdds: real("home_odds"),
  drawOdds: real("draw_odds"),
  awayOdds: real("away_odds"),
  isLive: boolean("is_live").default(false),
  score: text("score"),
  status: text("status").default("upcoming"),
  metadata: json("metadata")
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventId: integer("event_id").references(() => events.id),
  betAmount: real("bet_amount").notNull(),
  odds: real("odds").notNull(),
  prediction: text("prediction").notNull(),
  market: text("market").notNull(), // Market ID from Wurlus protocol
  selection: text("selection").notNull(), // Selection/outcome ID from Wurlus protocol
  status: text("status").default("pending"),
  result: text("result"),
  payout: real("payout"),
  txHash: text("tx_hash"), // Transaction hash from blockchain
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at")
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  type: text("type").notNull(),
  amount: real("amount"),
  code: text("code"),
  minDeposit: real("min_deposit"),
  rolloverSports: real("rollover_sports"),
  rolloverCasino: real("rollover_casino"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true)
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    walletAddress: true,
    walletType: true
  })
  .partial({ password: true }); // Make password optional for wallet-based users

export const insertSportSchema = createInsertSchema(sports).pick({
  name: true,
  slug: true,
  icon: true
});

export const insertEventSchema = createInsertSchema(events).pick({
  sportId: true,
  leagueName: true,
  leagueSlug: true,
  homeTeam: true,
  awayTeam: true,
  startTime: true,
  homeOdds: true,
  drawOdds: true,
  awayOdds: true,
  isLive: true,
  score: true,
  status: true,
  metadata: true
});

export const insertBetSchema = createInsertSchema(bets)
  .pick({
    userId: true,
    eventId: true,
    betAmount: true,
    odds: true,
    prediction: true,
    market: true,
    selection: true,
    txHash: true
  });

export const insertPromotionSchema = createInsertSchema(promotions).pick({
  title: true,
  description: true,
  imageUrl: true,
  type: true,
  amount: true,
  code: true,
  minDeposit: true,
  rolloverSports: true,
  rolloverCasino: true,
  startDate: true,
  endDate: true,
  isActive: true
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true
});

// Type Exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSport = z.infer<typeof insertSportSchema>;
export type Sport = typeof sports.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Wallet type for Sui
export type WalletType = 'Sui' | 'Suiet' | 'Nightly' | 'WalletConnect';
