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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sports: Map<number, Sport>;
  private events: Map<number, Event>;
  private bets: Map<number, Bet>;
  private promotions: Map<number, Promotion>;
  private notifications: Map<number, Notification>;
  private userIdCounter: number;
  private sportIdCounter: number;
  private eventIdCounter: number;
  private betIdCounter: number;
  private promotionIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.sports = new Map();
    this.events = new Map();
    this.bets = new Map();
    this.promotions = new Map();
    this.notifications = new Map();
    this.userIdCounter = 1;
    this.sportIdCounter = 1;
    this.eventIdCounter = 1;
    this.betIdCounter = 1;
    this.promotionIdCounter = 1;
    this.notificationIdCounter = 1;

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
}

export const storage = new MemStorage();
