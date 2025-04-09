import { securityService } from './securityService';
import { sportDataService } from './sportDataService';
import axios from 'axios';

// Mock data provider interface
export interface IOddsProvider {
  getName(): string;
  getId(): string;
  getWeight(): number;
  setWeight(weight: number): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  fetchOdds(): Promise<any[]>;
  normalizeOdds(rawOdds: any[]): any[];
}

// Aggregator service to combine odds from multiple providers
class AggregatorService {
  private providers: IOddsProvider[] = [];
  private lastRefresh: Date = new Date();
  
  constructor() {
    this.initializeProviders();
    
    // Schedule periodic refresh of odds
    setInterval(() => {
      this.refreshOdds();
    }, 15000); // Refresh every 15 seconds
  }
  
  // Add a provider to the list
  public addProvider(provider: IOddsProvider) {
    // Check if provider already exists
    const existingProvider = this.providers.find(p => p.getId() === provider.getId());
    if (existingProvider) {
      console.log(`Provider ${provider.getName()} already exists, not adding duplicate`);
      return;
    }
    
    this.providers.push(provider);
    console.log(`Added provider ${provider.getName()}`);
  }
  
  private initializeProviders() {
    // Add mock providers
    this.providers.push(new WurlusProtocolProvider());
    this.providers.push(new WalAppProvider());
    
    // Add SportDataProvider for SportsData.io integration
    this.providers.push(new SportDataProvider());
    
    // Add API-Sports provider if API key is available
    if (process.env.API_SPORTS_KEY) {
      try {
        // We'll add this manually after import has been updated
        // For now, the SportDataProvider will serve as our primary provider
        import('../providers/ApiSportsProvider.js')
          .then(module => {
            this.addProvider(module.default);
          })
          .catch(error => {
            console.warn('Could not load API-Sports provider:', error);
          });
      } catch (error) {
        console.warn('Could not load API-Sports provider:', error);
      }
    }
    
    console.log(`AggregatorService initialized with ${this.providers.length} providers`);
  }
  
  // Get all registered providers
  public getProviders() {
    return this.providers.map(p => ({
      id: p.getId(),
      name: p.getName(),
      enabled: p.isEnabled(),
      weight: p.getWeight()
    }));
  }
  
  // Get a specific provider by ID
  public getProvider(providerId: string) {
    const provider = this.providers.find(p => p.getId() === providerId);
    if (!provider) return null;
    
    return {
      id: provider.getId(),
      name: provider.getName(),
      enabled: provider.isEnabled(),
      weight: provider.getWeight()
    };
  }
  
  // Toggle a provider's enabled status
  public toggleProvider(providerId: string, enabled?: boolean) {
    const provider = this.providers.find(p => p.getId() === providerId);
    if (!provider) return false;
    
    const newState = enabled !== undefined ? enabled : !provider.isEnabled();
    provider.setEnabled(newState);
    return newState;
  }
  
  // Update a provider's weight
  public updateProviderWeight(providerId: string, weight: number) {
    const provider = this.providers.find(p => p.getId() === providerId);
    if (!provider) return false;
    
    provider.setWeight(Math.max(0, Math.min(100, weight))); // Clamp between 0-100
    return true;
  }
  
  // Fetch fresh odds from all enabled providers
  public async refreshOdds() {
    console.log("[AggregatorService] Refreshing odds from all providers");
    
    try {
      const oddsByOutcome: Record<string, any[]> = {};
      
      // Fetch and normalize odds from each enabled provider
      for (const provider of this.providers) {
        if (!provider.isEnabled()) continue;
        
        console.log(`[AggregatorService] Fetching odds from provider: ${provider.getName()}`);
        
        try {
          const rawOdds = await provider.fetchOdds();
          const normalizedOdds = provider.normalizeOdds(rawOdds);
          
          console.log(`[AggregatorService] Successfully fetched ${normalizedOdds.length} odds from ${provider.getName()}`);
          
          // Group by outcomeId
          for (const odds of normalizedOdds) {
            const outcomeId = odds.outcomeId;
            if (!oddsByOutcome[outcomeId]) {
              oddsByOutcome[outcomeId] = [];
            }
            oddsByOutcome[outcomeId].push(odds);
          }
        } catch (error) {
          console.error(`[AggregatorService] Error fetching odds from provider ${provider.getName()}:`, error);
        }
      }
      
      console.log("[AggregatorService] Normalizing and aggregating odds");
      
      // Aggregate odds for each outcome
      let aggregatedCount = 0;
      for (const outcomeId in oddsByOutcome) {
        const oddsForOutcome = oddsByOutcome[outcomeId];
        
        // Apply provider weights and calculate weighted average
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (const odds of oddsForOutcome) {
          const provider = this.providers.find(p => p.getId() === odds.providerId);
          if (!provider) continue;
          
          const weight = provider.getWeight() / 100;
          weightedSum += odds.value * weight;
          totalWeight += weight;
        }
        
        // Calculate weighted average if we have valid weights
        if (totalWeight > 0) {
          const averageOdds = weightedSum / totalWeight;
          
          // Update the outcome's odds in the database
          // TODO: Implement database update
          
          aggregatedCount++;
        }
      }
      
      console.log(`[AggregatorService] Aggregated odds for ${aggregatedCount} market outcomes`);
      this.lastRefresh = new Date();
      
      return {
        success: true,
        refreshTime: this.lastRefresh,
        count: aggregatedCount
      };
    } catch (error) {
      console.error("[AggregatorService] Error refreshing odds:", error);
      return {
        success: false,
        error: "Failed to refresh odds"
      };
    }
  }
  
  // Get the last refresh time
  public getLastRefreshTime() {
    return this.lastRefresh;
  }
}

// Mock implementation of Wurlus Protocol Provider
class WurlusProtocolProvider implements IOddsProvider {
  private name = "Wurlus Protocol";
  private id = "wurlus";
  private weight = 60;
  private enabled = true;
  
  getName(): string {
    return this.name;
  }
  
  getId(): string {
    return this.id;
  }
  
  getWeight(): number {
    return this.weight;
  }
  
  setWeight(weight: number): void {
    this.weight = weight;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  async fetchOdds(): Promise<any[]> {
    // Check if we have API key for the real Wurlus Protocol
    const wurlusApiKey = process.env.WURLUS_API_KEY;
    
    if (wurlusApiKey) {
      try {
        // Implement real API call to Wurlus Protocol using Wal.app Web API
        // As per https://docs.wal.app/usage/web-api.html
        const response = await axios.get(`https://api.wal.app/api/v1/odds`, {
          headers: { 
            'Authorization': `Bearer ${wurlusApiKey}`,
            'X-API-Key': wurlusApiKey,
            'Accept': 'application/json'
          },
          params: {
            provider: 'wurlus',
            limit: 100,
            status: 'active',
            include_markets: 'true'
          }
        });
        
        if (response.data && response.data.data && Array.isArray(response.data.data.odds)) {
          console.log(`[AggregatorService] Successfully fetched ${response.data.data.odds.length} odds from Wurlus Protocol API`);
          return response.data.data.odds;
        } else if (response.data && Array.isArray(response.data.odds)) {
          console.log(`[AggregatorService] Successfully fetched ${response.data.odds.length} odds from Wurlus Protocol API`);
          return response.data.odds;
        }
        
        throw new Error('Invalid response from Wurlus Protocol API');
      } catch (error) {
        console.error("[AggregatorService] Error fetching from real Wurlus Protocol API:", error);
      }
    }
    
    console.log("[AggregatorService] No API key available for Wurlus Protocol, using mock data");
    return this.getMockOdds();
  }
  
  normalizeOdds(rawOdds: any[]): any[] {
    return rawOdds.map(odds => ({
      outcomeId: odds.outcomeId,
      marketId: odds.marketId,
      eventId: odds.eventId,
      value: odds.odds,
      providerId: this.id,
      timestamp: new Date(),
      confidence: 0.8
    }));
  }
  
  private getMockOdds(): any[] {
    const odds = [];
    
    // Generate some random mock data
    for (let i = 1; i <= 10; i++) {
      for (let j = 1; j <= 3; j++) {
        if (i <= 3) {
          // These are for football (soccer)
          // For each market, create home win, draw, away win outcomes
          odds.push({
            outcomeId: `outcome-${i}-${j}`,
            marketId: `market-${i}-1`,
            eventId: i,
            odds: j === 1 ? 1.5 + Math.random() : (j === 2 ? 3.2 + Math.random() * 0.5 : 2.1 + Math.random()),
            sport: 'football',
            timestamp: new Date()
          });
        } else if (i <= 6) {
          // These are for basketball, just home/away (no draw)
          if (j <= 2) {
            odds.push({
              outcomeId: `outcome-${i}-${j}`,
              marketId: `market-${i}-1`,
              eventId: i,
              odds: j === 1 ? 1.6 + Math.random() * 0.3 : 1.8 + Math.random() * 0.3,
              sport: 'basketball',
              timestamp: new Date()
            });
          }
        } else {
          // These are for other sports
          odds.push({
            outcomeId: `outcome-${i}-${j}`,
            marketId: `market-${i}-1`,
            eventId: i,
            odds: 1.5 + Math.random() * 2,
            sport: 'other',
            timestamp: new Date()
          });
        }
      }
    }
    
    // Add some outcome IDs that match the SportData outcomes
    for (let i = 1; i <= 10; i++) {
      odds.push({
        outcomeId: `soccer-live-1-1`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 1.75 + Math.random() * 0.2,
        sport: 'soccer',
        timestamp: new Date()
      });
      
      odds.push({
        outcomeId: `soccer-live-1-2`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 3.2 + Math.random() * 0.3,
        sport: 'soccer',
        timestamp: new Date()
      });
      
      odds.push({
        outcomeId: `soccer-live-1-3`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 2.1 + Math.random() * 0.25,
        sport: 'soccer',
        timestamp: new Date()
      });
    }
    
    return odds;
  }
}

// Mock implementation of Wal.app Provider
class WalAppProvider implements IOddsProvider {
  private name = "Wal.app";
  private id = "walapp";
  private weight = 40;
  private enabled = true;
  
  getName(): string {
    return this.name;
  }
  
  getId(): string {
    return this.id;
  }
  
  getWeight(): number {
    return this.weight;
  }
  
  setWeight(weight: number): void {
    this.weight = weight;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  async fetchOdds(): Promise<any[]> {
    // Check if we have API key for the real Wal.app
    const walAppApiKey = process.env.WAL_APP_API_KEY;
    
    if (walAppApiKey) {
      try {
        // Implement real API call to Wal.app as per the documentation
        // https://docs.wal.app/usage/web-api.html
        const response = await axios.get(`https://api.wal.app/api/v1/events`, {
          headers: { 
            'X-API-Key': walAppApiKey,
            'Accept': 'application/json'
          },
          params: {
            status: 'live', // Get odds for live events
            limit: 100,
            include_markets: 'true',
            include_odds: 'true'
          }
        });
        
        if (response.data && response.data.data && Array.isArray(response.data.data.events)) {
          console.log(`[AggregatorService] Successfully fetched ${response.data.data.events.length} events from Wal.app API`);
          
          // Extract odds from events
          const odds: any[] = [];
          
          response.data.data.events.forEach((event: any) => {
            if (event.markets && Array.isArray(event.markets)) {
              event.markets.forEach((market: any) => {
                if (market.outcomes && Array.isArray(market.outcomes)) {
                  market.outcomes.forEach((outcome: any) => {
                    odds.push({
                      outcomeId: outcome.id,
                      marketId: market.id,
                      eventId: event.id,
                      odds: outcome.odds || outcome.price,
                      sport: event.sport_id || event.sport || 'unknown',
                      timestamp: new Date()
                    });
                  });
                }
              });
            }
          });
          
          console.log(`[AggregatorService] Successfully extracted ${odds.length} odds from Wal.app`);
          return odds;
        } else if (response.data && Array.isArray(response.data.events)) {
          console.log(`[AggregatorService] Successfully fetched ${response.data.events.length} events from Wal.app API using legacy format`);
          
          // Extract odds from events (legacy format)
          const odds: any[] = [];
          
          response.data.events.forEach((event: any) => {
            if (event.markets && Array.isArray(event.markets)) {
              event.markets.forEach((market: any) => {
                if (market.outcomes && Array.isArray(market.outcomes)) {
                  market.outcomes.forEach((outcome: any) => {
                    odds.push({
                      outcomeId: outcome.id,
                      marketId: market.id,
                      eventId: event.id,
                      odds: outcome.odds || outcome.price,
                      sport: event.sport_id || event.sport || 'unknown',
                      timestamp: new Date()
                    });
                  });
                }
              });
            }
          });
          
          console.log(`[AggregatorService] Successfully extracted ${odds.length} odds from Wal.app`);
          return odds;
        }
        
        throw new Error('Invalid response from Wal.app API');
      } catch (error) {
        console.error("[AggregatorService] Error fetching from real Wal.app API:", error);
      }
    }
    
    console.log("[AggregatorService] No API key available for Wal.app, using mock data");
    return this.getMockOdds();
  }
  
  normalizeOdds(rawOdds: any[]): any[] {
    return rawOdds.map(odds => ({
      outcomeId: odds.outcomeId,
      marketId: odds.marketId,
      eventId: odds.eventId,
      value: odds.odds,
      providerId: this.id,
      timestamp: new Date(),
      confidence: 0.7 
    }));
  }
  
  private getMockOdds(): any[] {
    const odds = [];
    
    // Generate some random mock data similar to Wurlus but with slightly different odds
    for (let i = 1; i <= 10; i++) {
      for (let j = 1; j <= 3; j++) {
        if (i <= 3) {
          // These are for football (soccer)
          // For each market, create home win, draw, away win outcomes
          odds.push({
            outcomeId: `outcome-${i}-${j}`,
            marketId: `market-${i}-1`,
            eventId: i,
            odds: j === 1 ? 1.6 + Math.random() * 0.2 : (j === 2 ? 3.3 + Math.random() * 0.4 : 2.2 + Math.random() * 0.2),
            sport: 'football',
            timestamp: new Date()
          });
        } else if (i <= 6) {
          // These are for basketball, just home/away (no draw)
          if (j <= 2) {
            odds.push({
              outcomeId: `outcome-${i}-${j}`,
              marketId: `market-${i}-1`,
              eventId: i,
              odds: j === 1 ? 1.65 + Math.random() * 0.3 : 1.85 + Math.random() * 0.25,
              sport: 'basketball',
              timestamp: new Date()
            });
          }
        } else {
          // These are for other sports
          odds.push({
            outcomeId: `outcome-${i}-${j}`,
            marketId: `market-${i}-1`,
            eventId: i,
            odds: 1.6 + Math.random() * 1.9,
            sport: 'other',
            timestamp: new Date()
          });
        }
      }
    }
    
    // Add some outcome IDs that match the SportData outcomes (like Wurlus provider)
    for (let i = 1; i <= 10; i++) {
      odds.push({
        outcomeId: `soccer-live-1-1`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 1.7 + Math.random() * 0.25,
        sport: 'soccer',
        timestamp: new Date()
      });
      
      odds.push({
        outcomeId: `soccer-live-1-2`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 3.1 + Math.random() * 0.4,
        sport: 'soccer',
        timestamp: new Date()
      });
      
      odds.push({
        outcomeId: `soccer-live-1-3`,
        marketId: `market-soccer-live-1-1`,
        eventId: 'soccer-live-1',
        odds: 2.0 + Math.random() * 0.3,
        sport: 'soccer',
        timestamp: new Date()
      });
    }
    
    return odds;
  }
}

// Mock data provider that uses SportData.io API data
class SportDataProvider implements IOddsProvider {
  private name = "SportsData.io";
  private id = "sportsdata";
  private weight = 70;
  private enabled = true;
  private lastFetchTime: Date = new Date();
  private cachedOdds: any[] = [];
  
  getName(): string {
    return this.name;
  }
  
  getId(): string {
    return this.id;
  }
  
  getWeight(): number {
    return this.weight;
  }
  
  setWeight(weight: number): void {
    this.weight = weight;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  async fetchOdds(): Promise<any[]> {
    // Check cache age, if less than 5 minutes, use cache
    const cacheAgeMs = new Date().getTime() - this.lastFetchTime.getTime();
    if (cacheAgeMs < 300000 && this.cachedOdds.length > 0) {
      console.log("[SportDataProvider] Using cached odds data");
      return this.cachedOdds;
    }
    
    try {
      // Fetch live soccer events from SportData service
      const liveEvents = await sportDataService.getLiveEvents();
      const upcomingEvents = await sportDataService.getUpcomingEvents();
      const allEvents = [...liveEvents, ...upcomingEvents];
      
      console.log(`[SportDataProvider] Fetched ${allEvents.length} events from SportData`);
      
      // Extract odds from these events
      const odds: any[] = [];
      
      allEvents.forEach(event => {
        if (event.markets && event.markets.length > 0) {
          event.markets.forEach((market: any) => {
            if (market.outcomes && market.outcomes.length > 0) {
              market.outcomes.forEach((outcome: any) => {
                odds.push({
                  outcomeId: outcome.id,
                  marketId: market.id,
                  eventId: event.id,
                  odds: outcome.odds,
                  sport: event.sportId ? 'soccer' : 'soccer', // Default to soccer if no sportId
                  timestamp: new Date()
                });
              });
            }
          });
        }
      });
      
      console.log(`[SportDataProvider] Extracted ${odds.length} odds from events`);
      
      // Update cache
      this.cachedOdds = odds;
      this.lastFetchTime = new Date();
      
      return odds;
    } catch (error) {
      console.error("[SportDataProvider] Error fetching odds:", error);
      
      // If error, use the cache if available
      if (this.cachedOdds.length > 0) {
        console.log("[SportDataProvider] Using cached odds due to error");
        return this.cachedOdds;
      }
      
      // Otherwise generate mock data
      console.log("[SportDataProvider] Generating mock odds data");
      const mockOdds = this.getMockOdds();
      this.cachedOdds = mockOdds;
      this.lastFetchTime = new Date();
      
      return mockOdds;
    }
  }
  
  normalizeOdds(rawOdds: any[]): any[] {
    return rawOdds.map(odds => ({
      outcomeId: odds.outcomeId,
      marketId: odds.marketId,
      eventId: odds.eventId,
      value: odds.odds,
      providerId: this.id,
      timestamp: odds.timestamp || new Date(),
      confidence: 0.9 // Higher confidence for real data
    }));
  }
  
  private getMockOdds(): any[] {
    console.log("[MockSportsDataProvider] Updated odds at " + new Date().toISOString());
    
    // Similar structure to our other mock providers but with different values
    const odds = [];
    
    // Generate random mock data
    for (let i = 1; i <= 10; i++) {
      for (let j = 1; j <= 3; j++) {
        odds.push({
          outcomeId: `outcome-${i}-${j}`,
          marketId: `market-${i}-1`,
          eventId: i,
          odds: 1.5 + Math.random() * 2,
          sport: i % 3 === 0 ? 'basketball' : (i % 2 === 0 ? 'football' : 'tennis'),
          timestamp: new Date()
        });
      }
    }
    
    return odds;
  }
}

// Create SportDataProvider instance and add it to the providers list
const sportDataProvider = new SportDataProvider();
const aggregatorService = new AggregatorService();

// Add SportDataProvider to the list of providers
aggregatorService.addProvider(sportDataProvider);

export { aggregatorService };