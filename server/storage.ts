import { 
  users, type User, type InsertUser, 
  sports, type Sport, type InsertSport, 
  events, type Event, type InsertEvent, 
  bets, type Bet, type InsertBet, 
  promotions, type Promotion, type InsertPromotion,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByWalletFingerprint(fingerprint: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Sports methods
  getSports(): Promise<Sport[]>;
  getSport(id: number): Promise<Sport | undefined>;
  getSportBySlug(slug: string): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;

  // Events methods
  getEvents(sportId?: number, isLive?: boolean): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;

  // Bets methods
  getBets(userId: number): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  updateBet(id: number, bet: Partial<Bet>): Promise<Bet | undefined>;

  // Promotions methods
  getPromotions(isActive?: boolean): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, promotion: Partial<Promotion>): Promise<Promotion | undefined>;

  // Notifications methods
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Markets methods
  getMarkets(eventId?: number): Promise<Market[]>;
  getMarket(id: number): Promise<Market | undefined>;
  getMarketByWurlusId(wurlusMarketId: string): Promise<Market | undefined>;
  createMarket(market: InsertMarket): Promise<Market>;
  updateMarket(id: number, market: Partial<Market>): Promise<Market | undefined>;
  
  // Outcomes methods
  getOutcomes(marketId: number): Promise<Outcome[]>;
  getOutcome(id: number): Promise<Outcome | undefined>;
  getOutcomeByWurlusId(wurlusOutcomeId: string): Promise<Outcome | undefined>;
  createOutcome(outcome: InsertOutcome): Promise<Outcome>;
  updateOutcome(id: number, outcome: Partial<Outcome>): Promise<Outcome | undefined>;
  
  // Staking methods
  getUserStaking(userId: number): Promise<WurlusStaking[]>;
  getStakingByWallet(walletAddress: string): Promise<WurlusStaking[]>;
  getStaking(id: number): Promise<WurlusStaking | undefined>;
  createStaking(staking: InsertWurlusStaking): Promise<WurlusStaking>;
  updateStaking(id: number, staking: Partial<WurlusStaking>): Promise<WurlusStaking | undefined>;
  
  // Dividends methods
  getUserDividends(userId: number, status?: string): Promise<WurlusDividend[]>;
  getDividendsByWallet(walletAddress: string, status?: string): Promise<WurlusDividend[]>;
  createDividend(dividend: InsertWurlusDividend): Promise<WurlusDividend>;
  updateDividend(id: number, dividend: Partial<WurlusDividend>): Promise<WurlusDividend | undefined>;
  
  // Wallet operations methods
  getWalletOperations(walletAddress: string, operationType?: string): Promise<WurlusWalletOperation[]>;
  createWalletOperation(operation: InsertWurlusWalletOperation): Promise<WurlusWalletOperation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sports: Map<number, Sport>;
  private events: Map<number, Event>;
  private bets: Map<number, Bet>;
  private promotions: Map<number, Promotion>;
  private notifications: Map<number, Notification>;
  private markets: Map<number, Market>;
  private outcomes: Map<number, Outcome>;
  private stakings: Map<number, WurlusStaking>;
  private dividends: Map<number, WurlusDividend>;
  private walletOperations: Map<number, WurlusWalletOperation>;
  private userIdCounter: number;
  private sportIdCounter: number;
  private eventIdCounter: number;
  private betIdCounter: number;
  private promotionIdCounter: number;
  private notificationIdCounter: number;
  private marketIdCounter: number;
  private outcomeIdCounter: number;
  private stakingIdCounter: number;
  private dividendIdCounter: number;
  private walletOperationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.sports = new Map();
    this.events = new Map();
    this.bets = new Map();
    this.promotions = new Map();
    this.notifications = new Map();
    this.markets = new Map();
    this.outcomes = new Map();
    this.stakings = new Map();
    this.dividends = new Map();
    this.walletOperations = new Map();
    this.userIdCounter = 1;
    this.sportIdCounter = 1;
    this.eventIdCounter = 1;
    this.betIdCounter = 1;
    this.promotionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.marketIdCounter = 1;
    this.outcomeIdCounter = 1;
    this.stakingIdCounter = 1;
    this.dividendIdCounter = 1;
    this.walletOperationIdCounter = 1;

    // Initialize default sports
    this.initializeDefaultSports();
    // Initialize sample promotions
    this.initializeDefaultPromotions();
    // Initialize sample events
    this.initializeDefaultEvents();
  }

  private initializeDefaultSports() {
    const defaultSports: InsertSport[] = [
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

    defaultSports.forEach(sport => this.createSport(sport));
  }

  private initializeDefaultPromotions() {
    const defaultPromotions: InsertPromotion[] = [
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

    defaultPromotions.forEach(promotion => this.createPromotion(promotion));
  }

  private initializeDefaultEvents() {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const defaultEvents: InsertEvent[] = [
      {
        sportId: 1, // Football
        leagueName: "Spain: La Liga",
        leagueSlug: "spain-la-liga",
        homeTeam: "Real Sociedad",
        awayTeam: "Leganes",
        startTime: twoHoursLater,
        homeOdds: 1.53,
        drawOdds: 3.82,
        awayOdds: 6.83,
        isLive: false,
        status: "upcoming"
      },
      {
        sportId: 1, // Football
        leagueName: "Germany: Bundesliga",
        leagueSlug: "germany-bundesliga",
        homeTeam: "Bayern Munich",
        awayTeam: "Borussia Dortmund",
        startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        homeOdds: 1.75,
        drawOdds: 3.60,
        awayOdds: 4.50,
        isLive: false,
        status: "upcoming"
      },
      {
        sportId: 3, // Tennis
        leagueName: "Rwanda: ATP CH Kigali",
        leagueSlug: "rwanda-atp-ch-kigali",
        homeTeam: "Alex M Pujolas",
        awayTeam: "Dominik Kellovsky",
        startTime: now,
        homeOdds: 1.07,
        awayOdds: 6.96,
        isLive: true,
        score: "7-6, 1-0",
        status: "live"
      },
      {
        sportId: 3, // Tennis
        leagueName: "Rwanda: ATP CH Kigali",
        leagueSlug: "rwanda-atp-ch-kigali",
        homeTeam: "Maximus Ivanov",
        awayTeam: "Mathys Erhard",
        startTime: now,
        homeOdds: 8.00,
        awayOdds: 1.04,
        isLive: true,
        score: "0-3",
        status: "live"
      },
      {
        sportId: 1, // Football
        leagueName: "Europe: UEFA Champions League",
        leagueSlug: "uefa-champions-league",
        homeTeam: "Club Brugge",
        awayTeam: "Aston Villa",
        startTime: new Date("2025-03-04T18:45:00"),
        homeOdds: 2.85,
        drawOdds: 3.42,
        awayOdds: 2.43,
        isLive: false,
        status: "upcoming"
      }
    ];

    defaultEvents.forEach(event => this.createEvent(event));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress
    );
  }
  
  async getUserByWalletFingerprint(fingerprint: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletFingerprint === fingerprint
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, balance: 0, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Sports methods
  async getSports(): Promise<Sport[]> {
    return Array.from(this.sports.values());
  }

  async getSport(id: number): Promise<Sport | undefined> {
    return this.sports.get(id);
  }

  async getSportBySlug(slug: string): Promise<Sport | undefined> {
    return Array.from(this.sports.values()).find(
      (sport) => sport.slug === slug
    );
  }

  async createSport(insertSport: InsertSport): Promise<Sport> {
    const id = this.sportIdCounter++;
    const sport: Sport = { ...insertSport, id };
    this.sports.set(id, sport);
    return sport;
  }

  // Events methods
  async getEvents(sportId?: number, isLive?: boolean): Promise<Event[]> {
    let events = Array.from(this.events.values());
    
    if (sportId !== undefined) {
      events = events.filter(event => event.sportId === sportId);
    }
    
    if (isLive !== undefined) {
      events = events.filter(event => event.isLive === isLive);
    }
    
    return events;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Bets methods
  async getBets(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(
      (bet) => bet.userId === userId
    );
  }

  async getBet(id: number): Promise<Bet | undefined> {
    return this.bets.get(id);
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const id = this.betIdCounter++;
    const now = new Date();
    const bet: Bet = { 
      ...insertBet, 
      id, 
      status: 'pending', 
      result: null, 
      payout: null, 
      createdAt: now 
    };
    this.bets.set(id, bet);
    return bet;
  }

  async updateBet(id: number, betData: Partial<Bet>): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (!bet) return undefined;
    
    const updatedBet = { ...bet, ...betData };
    this.bets.set(id, updatedBet);
    return updatedBet;
  }

  // Promotions methods
  async getPromotions(isActive?: boolean): Promise<Promotion[]> {
    let promotions = Array.from(this.promotions.values());
    
    if (isActive !== undefined) {
      promotions = promotions.filter(promo => promo.isActive === isActive);
    }
    
    return promotions;
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    return this.promotions.get(id);
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const id = this.promotionIdCounter++;
    const promotion: Promotion = { ...insertPromotion, id };
    this.promotions.set(id, promotion);
    return promotion;
  }

  async updatePromotion(id: number, promotionData: Partial<Promotion>): Promise<Promotion | undefined> {
    const promotion = this.promotions.get(id);
    if (!promotion) return undefined;
    
    const updatedPromotion = { ...promotion, ...promotionData };
    this.promotions.set(id, updatedPromotion);
    return updatedPromotion;
  }

  // Notifications methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      isRead: false, 
      createdAt: now 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .forEach(notification => {
        this.notifications.set(notification.id, { ...notification, isRead: true });
      });
  }
  
  // Markets methods
  async getMarkets(eventId?: number): Promise<Market[]> {
    let markets = Array.from(this.markets.values());
    
    if (eventId !== undefined) {
      markets = markets.filter(market => market.eventId === eventId);
    }
    
    return markets;
  }
  
  async getMarket(id: number): Promise<Market | undefined> {
    return this.markets.get(id);
  }
  
  async getMarketByWurlusId(wurlusMarketId: string): Promise<Market | undefined> {
    return Array.from(this.markets.values()).find(
      (market) => market.wurlusMarketId === wurlusMarketId
    );
  }
  
  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const id = this.marketIdCounter++;
    const market: Market = { ...insertMarket, id };
    this.markets.set(id, market);
    return market;
  }
  
  async updateMarket(id: number, marketData: Partial<Market>): Promise<Market | undefined> {
    const market = this.markets.get(id);
    if (!market) return undefined;
    
    const updatedMarket = { ...market, ...marketData };
    this.markets.set(id, updatedMarket);
    return updatedMarket;
  }
  
  // Outcomes methods
  async getOutcomes(marketId: number): Promise<Outcome[]> {
    return Array.from(this.outcomes.values()).filter(
      (outcome) => outcome.marketId === marketId
    );
  }
  
  async getOutcome(id: number): Promise<Outcome | undefined> {
    return this.outcomes.get(id);
  }
  
  async getOutcomeByWurlusId(wurlusOutcomeId: string): Promise<Outcome | undefined> {
    return Array.from(this.outcomes.values()).find(
      (outcome) => outcome.wurlusOutcomeId === wurlusOutcomeId
    );
  }
  
  async createOutcome(insertOutcome: InsertOutcome): Promise<Outcome> {
    const id = this.outcomeIdCounter++;
    const outcome: Outcome = { ...insertOutcome, id };
    this.outcomes.set(id, outcome);
    return outcome;
  }
  
  async updateOutcome(id: number, outcomeData: Partial<Outcome>): Promise<Outcome | undefined> {
    const outcome = this.outcomes.get(id);
    if (!outcome) return undefined;
    
    const updatedOutcome = { ...outcome, ...outcomeData };
    this.outcomes.set(id, updatedOutcome);
    return updatedOutcome;
  }
  
  // Staking methods
  async getUserStaking(userId: number): Promise<WurlusStaking[]> {
    return Array.from(this.stakings.values()).filter(
      (staking) => staking.userId === userId
    );
  }
  
  async getStakingByWallet(walletAddress: string): Promise<WurlusStaking[]> {
    return Array.from(this.stakings.values()).filter(
      (staking) => staking.walletAddress === walletAddress
    );
  }
  
  async getStaking(id: number): Promise<WurlusStaking | undefined> {
    return this.stakings.get(id);
  }
  
  async createStaking(insertStaking: InsertWurlusStaking): Promise<WurlusStaking> {
    const id = this.stakingIdCounter++;
    const now = new Date();
    const staking: WurlusStaking = { 
      ...insertStaking, 
      id,
      stakingDate: insertStaking.stakingDate || now
    };
    this.stakings.set(id, staking);
    return staking;
  }
  
  async updateStaking(id: number, stakingData: Partial<WurlusStaking>): Promise<WurlusStaking | undefined> {
    const staking = this.stakings.get(id);
    if (!staking) return undefined;
    
    const updatedStaking = { ...staking, ...stakingData };
    this.stakings.set(id, updatedStaking);
    return updatedStaking;
  }
  
  // Dividends methods
  async getUserDividends(userId: number, status?: string): Promise<WurlusDividend[]> {
    let dividends = Array.from(this.dividends.values()).filter(
      (dividend) => dividend.userId === userId
    );
    
    if (status) {
      dividends = dividends.filter(dividend => dividend.status === status);
    }
    
    return dividends.sort((a, b) => {
      if (a.periodEnd && b.periodEnd) {
        return b.periodEnd.getTime() - a.periodEnd.getTime();
      }
      return 0;
    });
  }
  
  async getDividendsByWallet(walletAddress: string, status?: string): Promise<WurlusDividend[]> {
    let dividends = Array.from(this.dividends.values()).filter(
      (dividend) => dividend.walletAddress === walletAddress
    );
    
    if (status) {
      dividends = dividends.filter(dividend => dividend.status === status);
    }
    
    return dividends.sort((a, b) => {
      if (a.periodEnd && b.periodEnd) {
        return b.periodEnd.getTime() - a.periodEnd.getTime();
      }
      return 0;
    });
  }
  
  async createDividend(insertDividend: InsertWurlusDividend): Promise<WurlusDividend> {
    const id = this.dividendIdCounter++;
    const dividend: WurlusDividend = { ...insertDividend, id };
    this.dividends.set(id, dividend);
    return dividend;
  }
  
  async updateDividend(id: number, dividendData: Partial<WurlusDividend>): Promise<WurlusDividend | undefined> {
    const dividend = this.dividends.get(id);
    if (!dividend) return undefined;
    
    const updatedDividend = { ...dividend, ...dividendData };
    this.dividends.set(id, updatedDividend);
    return updatedDividend;
  }
  
  // Wallet operations methods
  async getWalletOperations(walletAddress: string, operationType?: string): Promise<WurlusWalletOperation[]> {
    let operations = Array.from(this.walletOperations.values()).filter(
      (operation) => operation.walletAddress === walletAddress
    );
    
    if (operationType) {
      operations = operations.filter(operation => operation.operationType === operationType);
    }
    
    return operations.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
      return 0;
    });
  }
  
  async createWalletOperation(insertOperation: InsertWurlusWalletOperation): Promise<WurlusWalletOperation> {
    const id = this.walletOperationIdCounter++;
    const now = new Date();
    const operation: WurlusWalletOperation = { 
      ...insertOperation, 
      id,
      timestamp: insertOperation.timestamp || now
    };
    this.walletOperations.set(id, operation);
    return operation;
  }
}

import { db } from "./db";
import { eq, and, desc, asc, or, isNull } from "drizzle-orm";
import {
  markets, type Market, type InsertMarket,
  outcomes, type Outcome, type InsertOutcome,
  wurlusStaking, type WurlusStaking, type InsertWurlusStaking,
  wurlusDividends, type WurlusDividend, type InsertWurlusDividend,
  wurlus_wallet_operations, type WurlusWalletOperation, type InsertWurlusWalletOperation
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }
  
  async getUserByWalletFingerprint(fingerprint: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletFingerprint, fingerprint));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Sports methods
  async getSports(): Promise<Sport[]> {
    return await db.select().from(sports);
  }

  async getSport(id: number): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.id, id));
    return sport;
  }

  async getSportBySlug(slug: string): Promise<Sport | undefined> {
    const [sport] = await db.select().from(sports).where(eq(sports.slug, slug));
    return sport;
  }

  async createSport(insertSport: InsertSport): Promise<Sport> {
    const [sport] = await db.insert(sports).values(insertSport).returning();
    return sport;
  }

  // Events methods
  async getEvents(sportId?: number, isLive?: boolean): Promise<Event[]> {
    let query = db.select().from(events);
    
    if (sportId !== undefined) {
      query = query.where(eq(events.sportId, sportId));
    }
    
    if (isLive !== undefined) {
      query = query.where(eq(events.isLive, isLive));
    }
    
    return await query;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  // Bets methods
  async getBets(userId: number): Promise<Bet[]> {
    return await db.select().from(bets).where(eq(bets.userId, userId));
  }

  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet;
  }

  async createBet(insertBet: InsertBet): Promise<Bet> {
    const [bet] = await db.insert(bets).values(insertBet).returning();
    return bet;
  }

  async updateBet(id: number, betData: Partial<Bet>): Promise<Bet | undefined> {
    const [updatedBet] = await db
      .update(bets)
      .set(betData)
      .where(eq(bets.id, id))
      .returning();
    return updatedBet;
  }

  // Promotions methods
  async getPromotions(isActive?: boolean): Promise<Promotion[]> {
    let query = db.select().from(promotions);
    
    if (isActive !== undefined) {
      query = query.where(eq(promotions.isActive, isActive));
    }
    
    return await query;
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));
    return promotion;
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const [promotion] = await db.insert(promotions).values(insertPromotion).returning();
    return promotion;
  }

  async updatePromotion(id: number, promotionData: Partial<Promotion>): Promise<Promotion | undefined> {
    const [updatedPromotion] = await db
      .update(promotions)
      .set(promotionData)
      .where(eq(promotions.id, id))
      .returning();
    return updatedPromotion;
  }

  // Notifications methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Wurlus Protocol specific methods
  
  // Markets methods
  async getMarkets(eventId?: number): Promise<Market[]> {
    let query = db.select().from(markets);
    
    if (eventId !== undefined) {
      query = query.where(eq(markets.eventId, eventId));
    }
    
    return await query;
  }

  async getMarket(id: number): Promise<Market | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.id, id));
    return market;
  }

  async getMarketByWurlusId(wurlusMarketId: string): Promise<Market | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.wurlusMarketId, wurlusMarketId));
    return market;
  }

  async createMarket(insertMarket: InsertMarket): Promise<Market> {
    const [market] = await db.insert(markets).values(insertMarket).returning();
    return market;
  }

  async updateMarket(id: number, marketData: Partial<Market>): Promise<Market | undefined> {
    const [updatedMarket] = await db
      .update(markets)
      .set(marketData)
      .where(eq(markets.id, id))
      .returning();
    return updatedMarket;
  }

  // Outcomes methods
  async getOutcomes(marketId: number): Promise<Outcome[]> {
    return await db.select().from(outcomes).where(eq(outcomes.marketId, marketId));
  }

  async getOutcome(id: number): Promise<Outcome | undefined> {
    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.id, id));
    return outcome;
  }

  async getOutcomeByWurlusId(wurlusOutcomeId: string): Promise<Outcome | undefined> {
    const [outcome] = await db.select().from(outcomes).where(eq(outcomes.wurlusOutcomeId, wurlusOutcomeId));
    return outcome;
  }

  async createOutcome(insertOutcome: InsertOutcome): Promise<Outcome> {
    const [outcome] = await db.insert(outcomes).values(insertOutcome).returning();
    return outcome;
  }

  async updateOutcome(id: number, outcomeData: Partial<Outcome>): Promise<Outcome | undefined> {
    const [updatedOutcome] = await db
      .update(outcomes)
      .set(outcomeData)
      .where(eq(outcomes.id, id))
      .returning();
    return updatedOutcome;
  }

  // Staking methods
  async getUserStaking(userId: number): Promise<WurlusStaking[]> {
    return await db.select().from(wurlusStaking).where(eq(wurlusStaking.userId, userId));
  }

  async getStakingByWallet(walletAddress: string): Promise<WurlusStaking[]> {
    return await db.select().from(wurlusStaking).where(eq(wurlusStaking.walletAddress, walletAddress));
  }
  
  async getStaking(id: number): Promise<WurlusStaking | undefined> {
    const [staking] = await db.select().from(wurlusStaking).where(eq(wurlusStaking.id, id));
    return staking;
  }

  async createStaking(insertStaking: InsertWurlusStaking): Promise<WurlusStaking> {
    const [staking] = await db.insert(wurlusStaking).values(insertStaking).returning();
    return staking;
  }

  async updateStaking(id: number, stakingData: Partial<WurlusStaking>): Promise<WurlusStaking | undefined> {
    const [updatedStaking] = await db
      .update(wurlusStaking)
      .set(stakingData)
      .where(eq(wurlusStaking.id, id))
      .returning();
    return updatedStaking;
  }

  // Dividends methods
  async getUserDividends(userId: number, status?: string): Promise<WurlusDividend[]> {
    let query = db.select().from(wurlusDividends).where(eq(wurlusDividends.userId, userId));
    
    if (status) {
      query = query.where(eq(wurlusDividends.status, status));
    }
    
    return await query.orderBy(desc(wurlusDividends.periodEnd));
  }

  async getDividendsByWallet(walletAddress: string, status?: string): Promise<WurlusDividend[]> {
    let query = db.select().from(wurlusDividends).where(eq(wurlusDividends.walletAddress, walletAddress));
    
    if (status) {
      query = query.where(eq(wurlusDividends.status, status));
    }
    
    return await query.orderBy(desc(wurlusDividends.periodEnd));
  }

  async createDividend(insertDividend: InsertWurlusDividend): Promise<WurlusDividend> {
    const [dividend] = await db.insert(wurlusDividends).values(insertDividend).returning();
    return dividend;
  }

  async updateDividend(id: number, dividendData: Partial<WurlusDividend>): Promise<WurlusDividend | undefined> {
    const [updatedDividend] = await db
      .update(wurlusDividends)
      .set(dividendData)
      .where(eq(wurlusDividends.id, id))
      .returning();
    return updatedDividend;
  }

  // Wallet operations methods
  async getWalletOperations(walletAddress: string, operationType?: string): Promise<WurlusWalletOperation[]> {
    let query = db.select().from(wurlus_wallet_operations).where(eq(wurlus_wallet_operations.walletAddress, walletAddress));
    
    if (operationType) {
      query = query.where(eq(wurlus_wallet_operations.operationType, operationType));
    }
    
    return await query.orderBy(desc(wurlus_wallet_operations.timestamp));
  }

  async createWalletOperation(insertOperation: InsertWurlusWalletOperation): Promise<WurlusWalletOperation> {
    const [operation] = await db.insert(wurlus_wallet_operations).values(insertOperation).returning();
    return operation;
  }
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();

// For development/testing only
// export const storage = new MemStorage();
