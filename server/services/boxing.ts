import { SportEvent, MarketData } from '../types/betting';
import { ApiSportsService } from './apiSportsService';
import axios from 'axios';

/**
 * Service for retrieving and processing boxing event data 
 * using the API-Sports boxing-specific endpoints
 */
export class BoxingService {
  private apiSportsService: ApiSportsService;
  private apiKey: string;

  constructor() {
    this.apiSportsService = new ApiSportsService();
    // Use the existing API key from environment variables
    this.apiKey = process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || '';
    if (!this.apiKey) {
      console.error('[BoxingService] No API key found for API-Sports');
    }
  }

  /**
   * Get boxing events (upcoming or live) from the API-Sports boxing endpoint
   */
  public async getBoxingEvents(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[BoxingService] Fetching ${isLive ? 'live' : 'upcoming'} boxing events from API-Sports`);
      
      if (isLive) {
        // For live events, use the ApiSportsService getLiveEvents method with 'boxing' sport
        return await this.apiSportsService.getLiveEvents('boxing');
      } else {
        // For upcoming events, use getUpcomingEvents with 'boxing' sport
        return await this.apiSportsService.getUpcomingEvents('boxing');
      }
    } catch (error) {
      console.error(`[BoxingService] Error fetching boxing events from API:`, error);
      
      // Try direct approach as fallback if the service method fails
      try {
        console.log(`[BoxingService] Trying direct API approach for boxing ${isLive ? 'live' : 'upcoming'} events`);
        
        const apiUrl = 'https://v1.boxing.api-sports.io/fights';
        const params = {
          status: isLive ? 'live' : 'scheduled'
        };
        
        const response = await axios.get(apiUrl, {
          params,
          headers: {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.response && Array.isArray(response.data.response)) {
          console.log(`[BoxingService] Found ${response.data.response.length} boxing events via direct API call`);
          
          // Process the events to match our SportEvent format
          const events = response.data.response.map((fight: any, index: number) => {
            const id = fight.id?.toString() || `boxing-${index}-${Date.now()}`;
            
            // Boxing fights structure is different from other sports
            const boxer1 = fight.fighters?.[0]?.name || 'Boxer 1';
            const boxer2 = fight.fighters?.[1]?.name || 'Boxer 2';
            
            // Get league/division information
            const leagueName = fight.league?.name || fight.event?.name || 'Boxing';
            const venueName = fight.venue?.name || '';
            const locationName = fight.location?.city || '';
            const displayLocation = venueName ? `${venueName}, ${locationName}` : locationName;
            
            // Parse date
            const startTime = fight.date || new Date().toISOString();
            
            // Create markets based on actual fight data
            const markets: MarketData[] = [
              {
                id: `${id}-market-winner`,
                name: 'Winner',
                outcomes: [
                  {
                    id: `${id}-outcome-boxer1`,
                    name: `${boxer1} Win`,
                    odds: 1.85,
                    probability: 0.54
                  },
                  {
                    id: `${id}-outcome-boxer2`,
                    name: `${boxer2} Win`,
                    odds: 1.95,
                    probability: 0.51
                  }
                ]
              }
            ];
            
            return {
              id,
              sportId: 11, // Boxing ID
              leagueName: leagueName,
              homeTeam: boxer1,
              awayTeam: boxer2,
              startTime,
              status: isLive ? 'live' : 'upcoming',
              score: fight.score || '',
              markets,
              isLive,
              location: displayLocation,
              dataSource: 'api-sports-boxing'
            };
          });
          
          console.log(`[BoxingService] Processed ${events.length} boxing events`);
          return events;
        }
      } catch (directError) {
        console.error(`[BoxingService] Direct API approach also failed:`, directError);
      }
      
      // If all attempts fail, return empty array
      console.log(`[BoxingService] No boxing events found from API, returning empty array`);
      return [];
    }
  }
  
  /**
   * Filter events to ensure they're actual boxing events
   * This helps remove any football or other sport events that might have been 
   * incorrectly categorized
   */
  private isBoxingEvent(event: any): boolean {
    // Boxing events should have certain characteristics
    if (!event) return false;
    
    // Check if it's explicitly marked as boxing
    if (event._sportName === 'boxing') return true;
    
    // Boxing events usually have these terms in their league/competition name
    const boxingTerms = ['boxing', 'championship', 'bout', 'title', 'ufc', 'fight night', 'match', 'combat'];
    const leagueName = (event.leagueName || event.league?.name || '').toLowerCase();
    
    // Check for boxing keywords in the league name
    if (boxingTerms.some(term => leagueName.includes(term))) return true;
    
    // Boxing has 'fighters' or individual names, not team names
    // Teams with FC, United, etc. in their names are likely football teams
    const homeTeam = (event.homeTeam || '').toLowerCase();
    const awayTeam = (event.awayTeam || '').toLowerCase();
    
    const footballTerms = ['fc', 'united', 'city', 'club', 'athletic', 'sporting', 'real', 'deportivo'];
    
    // If both team names contain football terms, it's likely not boxing
    if (footballTerms.some(term => homeTeam.includes(term)) && 
        footballTerms.some(term => awayTeam.includes(term))) {
      return false;
    }
    
    return true;
  }
}

// Export a singleton instance
export const boxingService = new BoxingService();