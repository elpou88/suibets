/**
 * Aggregator Service for Wal.app integration
 * Based on Wal.app aggregator documentation: https://docs.wal.app/operator-guide/aggregator.html
 * 
 * This service handles odds aggregation, normalization, and best odds selection
 * from multiple providers according to Wal.app standards.
 */
import { securityService } from './securityService';
import { config } from '../config';
import axios from 'axios';

// Types for odds providers
export interface OddsProvider {
  id: string;
  name: string;
  apiKey?: string;
  apiUrl: string;
  weight: number; // Provider weight for weighted aggregation
  enabled: boolean;
}

// Types for raw odds data
export interface RawOdds {
  providerId: string;
  eventId: string;
  marketId: string;
  outcomeId: string;
  odds: number;
  lastUpdated: number;
}

// Types for normalized odds
export interface NormalizedOdds {
  eventId: string;
  marketId: string;
  outcomeId: string;
  odds: number;
  providerIds: string[];
  bestProviderId: string;
  lastUpdated: number;
}

// Types for provider status
export interface ProviderStatus {
  providerId: string;
  isActive: boolean;
  lastSuccessfulFetch: number | null;
  totalApiCalls: number;
  successfulApiCalls: number;
  failedApiCalls: number;
  averageResponseTime: number;
}

export class AggregatorService {
  private providers: Map<string, OddsProvider>;
  private providerStatus: Map<string, ProviderStatus>;
  private oddsCache: Map<string, RawOdds[]>; // Cache for raw odds by provider
  private normalizedOddsCache: Map<string, NormalizedOdds>; // Cache for normalized odds by marketOutcomeKey
  private refreshInterval: NodeJS.Timeout | null;
  private refreshRate: number; // in milliseconds
  
  constructor() {
    this.providers = new Map();
    this.providerStatus = new Map();
    this.oddsCache = new Map();
    this.normalizedOddsCache = new Map();
    this.refreshInterval = null;
    this.refreshRate = 60000; // Default to 1 minute
    
    // Load initial providers from config or environment
    this.initializeProviders();
  }
  
  /**
   * Initialize odds providers from configuration
   */
  private initializeProviders(): void {
    // Add default providers defined in config or environment
    const defaultProviders: OddsProvider[] = [
      {
        id: 'wurlus',
        name: 'Wurlus Protocol',
        apiKey: config.api.wurlusApiKey,
        apiUrl: 'https://api.wurlus.com/v1/odds',
        weight: 1.0,
        enabled: true
      },
      {
        id: 'walapp',
        name: 'Wal.app',
        apiKey: config.api.walAppApiKey,
        apiUrl: `${config.api.walAppBaseUrl}/v1/odds`,
        weight: 0.8,
        enabled: true
      }
      // Additional providers would be added here
    ];
    
    // Add each provider to our map and initialize its status
    defaultProviders.forEach(provider => {
      this.addProvider(provider);
    });
  }
  
  /**
   * Add a new odds provider
   * @param provider Provider configuration
   */
  public addProvider(provider: OddsProvider): void {
    this.providers.set(provider.id, provider);
    
    // Initialize provider status
    this.providerStatus.set(provider.id, {
      providerId: provider.id,
      isActive: provider.enabled,
      lastSuccessfulFetch: null,
      totalApiCalls: 0,
      successfulApiCalls: 0,
      failedApiCalls: 0,
      averageResponseTime: 0
    });
  }
  
  /**
   * Enable or disable a provider
   * @param providerId Provider ID
   * @param enabled Whether to enable or disable
   */
  public setProviderEnabled(providerId: string, enabled: boolean): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    provider.enabled = enabled;
    
    // Update provider status
    const status = this.providerStatus.get(providerId);
    if (status) {
      status.isActive = enabled;
    }
    
    return true;
  }
  
  /**
   * Update provider weight for weighted aggregation
   * @param providerId Provider ID
   * @param weight Weight value (0-1)
   */
  public setProviderWeight(providerId: string, weight: number): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    
    // Ensure weight is between 0 and 1
    provider.weight = Math.min(Math.max(weight, 0), 1);
    
    return true;
  }
  
  /**
   * Start the odds refresh interval
   * @param refreshRate Optional custom refresh rate in milliseconds
   */
  public startRefreshInterval(refreshRate?: number): void {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set new refresh rate if provided
    if (refreshRate) {
      this.refreshRate = refreshRate;
    }
    
    // Start new interval
    this.refreshInterval = setInterval(() => {
      this.refreshAllOdds();
    }, this.refreshRate);
    
    console.log(`[AggregatorService] Started odds refresh interval (${this.refreshRate}ms)`);
  }
  
  /**
   * Stop the odds refresh interval
   */
  public stopRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[AggregatorService] Stopped odds refresh interval');
    }
  }
  
  /**
   * Refresh odds from all enabled providers
   */
  public async refreshAllOdds(): Promise<void> {
    console.log('[AggregatorService] Refreshing odds from all providers');
    
    // Get all enabled providers
    const enabledProviders = Array.from(this.providers.values())
      .filter(provider => provider.enabled);
    
    // Fetch odds from each provider
    const fetchPromises = enabledProviders.map(provider => 
      this.fetchOddsFromProvider(provider));
    
    // Wait for all fetch operations to complete
    await Promise.allSettled(fetchPromises);
    
    // After all fetches, normalize and aggregate the odds
    this.normalizeAndAggregateOdds();
  }
  
  /**
   * Fetch odds from a specific provider
   * @param provider Provider to fetch from
   */
  private async fetchOddsFromProvider(provider: OddsProvider): Promise<void> {
    const startTime = Date.now();
    const status = this.providerStatus.get(provider.id);
    
    if (!status) return;
    
    // Update call counters
    status.totalApiCalls++;
    
    try {
      console.log(`[AggregatorService] Fetching odds from provider: ${provider.name}`);
      
      // Create headers with API key if available
      const headers: Record<string, string> = {};
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
        // Add additional security if specified in Wal.app documentation
        headers['X-Timestamp'] = Date.now().toString();
        headers['X-Signature'] = securityService.sha256Hash(
          `${provider.apiKey}:${headers['X-Timestamp']}`
        );
      }
      
      // Make API request to provider
      const response = await axios.get(provider.apiUrl, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      if (response.status === 200 && response.data) {
        // Process and store the odds data
        const rawOdds = this.processProviderResponse(provider.id, response.data);
        this.oddsCache.set(provider.id, rawOdds);
        
        // Update provider status
        status.lastSuccessfulFetch = Date.now();
        status.successfulApiCalls++;
        
        // Calculate new average response time
        const responseTime = Date.now() - startTime;
        status.averageResponseTime = 
          (status.averageResponseTime * (status.successfulApiCalls - 1) + responseTime) / 
          status.successfulApiCalls;
        
        console.log(`[AggregatorService] Successfully fetched ${rawOdds.length} odds from ${provider.name}`);
      } else {
        throw new Error(`Invalid response from provider: ${response.status}`);
      }
    } catch (error) {
      // Update failure stats
      status.failedApiCalls++;
      console.error(`[AggregatorService] Failed to fetch odds from ${provider.name}:`, error);
    }
  }
  
  /**
   * Process response from a provider into standardized RawOdds format
   * @param providerId Provider ID
   * @param responseData Response data from provider API
   */
  private processProviderResponse(providerId: string, responseData: any): RawOdds[] {
    try {
      // Different providers may have different response formats
      // This is a simplistic example - actual implementation would depend on each provider's format
      
      const rawOdds: RawOdds[] = [];
      
      // Handle Wurlus Protocol format
      if (providerId === 'wurlus') {
        if (Array.isArray(responseData.events)) {
          // Process events data
          responseData.events.forEach((event: any) => {
            if (Array.isArray(event.markets)) {
              event.markets.forEach((market: any) => {
                if (Array.isArray(market.outcomes)) {
                  market.outcomes.forEach((outcome: any) => {
                    rawOdds.push({
                      providerId,
                      eventId: event.id,
                      marketId: market.id,
                      outcomeId: outcome.id,
                      odds: outcome.odds,
                      lastUpdated: Date.now()
                    });
                  });
                }
              });
            }
          });
        }
      } 
      // Handle Wal.app format
      else if (providerId === 'walapp') {
        if (Array.isArray(responseData.data)) {
          responseData.data.forEach((item: any) => {
            rawOdds.push({
              providerId,
              eventId: item.event_id,
              marketId: item.market_id,
              outcomeId: item.outcome_id,
              odds: item.odds,
              lastUpdated: item.last_updated || Date.now()
            });
          });
        }
      }
      // Add more provider-specific formats as needed
      
      return rawOdds;
    } catch (error) {
      console.error(`[AggregatorService] Error processing response from ${providerId}:`, error);
      return [];
    }
  }
  
  /**
   * Normalize and aggregate odds from all providers
   */
  private normalizeAndAggregateOdds(): void {
    console.log('[AggregatorService] Normalizing and aggregating odds');
    
    // Clear the current normalized odds cache
    this.normalizedOddsCache.clear();
    
    // Group raw odds by market/outcome combination
    const groupedOdds = this.groupOddsByMarketOutcome();
    
    // Process each group to find the best odds
    groupedOdds.forEach((oddsGroup, key) => {
      if (oddsGroup.length === 0) return;
      
      // Sort by odds (higher is better for the user)
      oddsGroup.sort((a: RawOdds, b: RawOdds) => b.odds - a.odds);
      
      // Create normalized odds entry
      const bestOdds = oddsGroup[0];
      const normalizedOdds: NormalizedOdds = {
        eventId: bestOdds.eventId,
        marketId: bestOdds.marketId,
        outcomeId: bestOdds.outcomeId,
        odds: bestOdds.odds,
        providerIds: oddsGroup.map((o: RawOdds) => o.providerId),
        bestProviderId: bestOdds.providerId,
        lastUpdated: Date.now()
      };
      
      // Store in cache
      this.normalizedOddsCache.set(key, normalizedOdds);
    });
    
    console.log(`[AggregatorService] Aggregated odds for ${this.normalizedOddsCache.size} market outcomes`);
  }
  
  /**
   * Group raw odds by market/outcome combination
   */
  private groupOddsByMarketOutcome(): Map<string, RawOdds[]> {
    const groupedOdds = new Map<string, RawOdds[]>();
    
    // Go through each provider's odds
    this.oddsCache.forEach((providerOdds, providerId) => {
      // Skip disabled providers
      const provider = this.providers.get(providerId);
      if (!provider || !provider.enabled) return;
      
      // Process each odds entry
      for (const odds of providerOdds) {
        // Create a unique key for each market/outcome combination
        const key = `${odds.eventId}:${odds.marketId}:${odds.outcomeId}`;
        
        // Get or create the group
        if (!groupedOdds.has(key)) {
          groupedOdds.set(key, []);
        }
        
        // Add to group
        groupedOdds.get(key)?.push(odds);
      }
    });
    
    return groupedOdds;
  }
  
  /**
   * Get best odds for a specific event
   * @param eventId Event ID
   */
  public getBestOddsForEvent(eventId: string): NormalizedOdds[] {
    const eventOdds: NormalizedOdds[] = [];
    
    // Filter normalized odds by event ID
    this.normalizedOddsCache.forEach((odds) => {
      if (odds.eventId === eventId) {
        eventOdds.push(odds);
      }
    });
    
    return eventOdds;
  }
  
  /**
   * Get best odds for a specific market
   * @param marketId Market ID
   */
  public getBestOddsForMarket(marketId: string): NormalizedOdds[] {
    const marketOdds: NormalizedOdds[] = [];
    
    // Filter normalized odds by market ID
    this.normalizedOddsCache.forEach((odds) => {
      if (odds.marketId === marketId) {
        marketOdds.push(odds);
      }
    });
    
    return marketOdds;
  }
  
  /**
   * Get best odds for a specific outcome
   * @param eventId Event ID
   * @param marketId Market ID
   * @param outcomeId Outcome ID
   */
  public getBestOddsForOutcome(
    eventId: string, 
    marketId: string, 
    outcomeId: string
  ): NormalizedOdds | null {
    const key = `${eventId}:${marketId}:${outcomeId}`;
    return this.normalizedOddsCache.get(key) || null;
  }
  
  /**
   * Get status information for all providers
   */
  public getProvidersStatus(): ProviderStatus[] {
    return Array.from(this.providerStatus.values());
  }
  
  /**
   * Get detailed information about a specific provider
   * @param providerId Provider ID
   */
  public getProviderDetails(providerId: string): { 
    provider: OddsProvider | undefined, 
    status: ProviderStatus | undefined 
  } {
    return {
      provider: this.providers.get(providerId),
      status: this.providerStatus.get(providerId)
    };
  }
}

// Export singleton instance
export const aggregatorService = new AggregatorService();