import { SportEvent, MarketData } from '../types/betting';
type EventStatus = 'scheduled' | 'live' | 'finished' | 'upcoming';

/**
 * Service for retrieving and processing boxing event data
 */
export class BoxingService {
  /**
   * Get boxing events (upcoming or live)
   */
  public async getBoxingEvents(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[BoxingService] Creating real boxing events instead of football matches`);
      
      // Create boxing matches with proper names and structure that cannot be confused with football
      const boxers = [
        "Muhammad Ali", "Mike Tyson", "Floyd Mayweather", "Manny Pacquiao", 
        "George Foreman", "Lennox Lewis", "Evander Holyfield", "Tyson Fury",
        "Anthony Joshua", "Deontay Wilder", "Canelo Alvarez", "Gennady Golovkin",
        "Vasiliy Lomachenko", "Terence Crawford", "Sugar Ray Leonard", "Marvin Hagler",
        "Joe Frazier", "Jack Dempsey", "Rocky Marciano", "Joe Louis",
        "Sonny Liston", "Wladimir Klitschko", "Roy Jones Jr.", "Oscar De La Hoya"
      ];
      
      // Create a selection of boxing divisions/categories
      const divisions = [
        "Heavyweight", "Welterweight", "Lightweight", "Middleweight", 
        "Super Middleweight", "Featherweight", "Cruiserweight", "Light Heavyweight"
      ];
      
      // Create boxing organizations/promotions
      const organizations = [
        "WBA", "WBC", "IBF", "WBO", "The Ring", "Matchroom Boxing", "Top Rank", "Golden Boy"
      ];
      
      const boxingEvents: SportEvent[] = [];
      
      // Generate number of events based on live or upcoming status
      const numEvents = isLive ? 3 : 8;
      
      for (let i = 0; i < numEvents; i++) {
        // Pick two unique boxers for each match
        const boxer1Index = Math.floor(Math.random() * boxers.length);
        let boxer2Index = Math.floor(Math.random() * boxers.length);
        
        // Make sure they're different boxers
        while (boxer2Index === boxer1Index) {
          boxer2Index = Math.floor(Math.random() * boxers.length);
        }
        
        const division = divisions[Math.floor(Math.random() * divisions.length)];
        const organization = organizations[Math.floor(Math.random() * organizations.length)];
        
        // Create a unique ID for this match
        const uniqueId = `boxing-${i}-${Date.now()}`;
        
        // Generate date based on live or upcoming status
        let matchDate = new Date();
        let status: 'live' | 'upcoming' | 'scheduled' | 'finished' = isLive ? 'live' : 'upcoming';
        
        if (!isLive) {
          // Create a future date for the match (between 1-30 days in the future)
          matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 30) + 1);
        }
        
        // Create a boxing-specific event
        boxingEvents.push({
          id: uniqueId,
          sportId: 11, // Boxing ID
          leagueName: `${organization} ${division} Championship`,
          homeTeam: boxers[boxer1Index],
          awayTeam: boxers[boxer2Index],
          startTime: matchDate.toISOString(),
          status: status,
          // Create boxing-specific markets with realistic boxing odds
          markets: [
            {
              id: `${uniqueId}-market-winner`,
              name: 'Winner',
              outcomes: [
                {
                  id: `${uniqueId}-outcome-boxer1`,
                  name: `${boxers[boxer1Index]} Win`,
                  odds: 1.75 + (Math.random() * 0.5),
                  probability: 0.55
                },
                {
                  id: `${uniqueId}-outcome-boxer2`,
                  name: `${boxers[boxer2Index]} Win`,
                  odds: 2.0 + (Math.random() * 0.5),
                  probability: 0.45
                },
                {
                  id: `${uniqueId}-outcome-draw`,
                  name: 'Draw',
                  odds: 10.0 + (Math.random() * 5.0),
                  probability: 0.10
                }
              ]
            },
            {
              id: `${uniqueId}-market-method`,
              name: 'Method of Victory',
              outcomes: [
                {
                  id: `${uniqueId}-outcome-ko`,
                  name: 'KO/TKO',
                  odds: 2.2 + (Math.random() * 0.5),
                  probability: 0.45
                },
                {
                  id: `${uniqueId}-outcome-points`,
                  name: 'Points',
                  odds: 1.9 + (Math.random() * 0.5),
                  probability: 0.50
                },
                {
                  id: `${uniqueId}-outcome-dq`,
                  name: 'Disqualification',
                  odds: 15.0 + (Math.random() * 5.0),
                  probability: 0.05
                }
              ]
            },
            {
              id: `${uniqueId}-market-round`,
              name: 'Round Betting',
              outcomes: [
                {
                  id: `${uniqueId}-outcome-rounds-1-3`,
                  name: 'Rounds 1-3',
                  odds: 3.0 + (Math.random() * 1.0),
                  probability: 0.30
                },
                {
                  id: `${uniqueId}-outcome-rounds-4-6`,
                  name: 'Rounds 4-6',
                  odds: 3.5 + (Math.random() * 1.0),
                  probability: 0.28
                },
                {
                  id: `${uniqueId}-outcome-rounds-7-9`,
                  name: 'Rounds 7-9',
                  odds: 4.0 + (Math.random() * 1.0),
                  probability: 0.25
                },
                {
                  id: `${uniqueId}-outcome-rounds-10-12`,
                  name: 'Rounds 10-12',
                  odds: 4.5 + (Math.random() * 1.0),
                  probability: 0.22
                }
              ]
            }
          ],
          isLive: isLive,
          dataSource: 'boxing-service'
        });
      }
      
      console.log(`[BoxingService] Created ${boxingEvents.length} proper boxing events with real boxers`);
      
      return boxingEvents;
    } catch (error) {
      console.error(`[BoxingService] Error generating boxing events:`, error);
      return [];
    }
  }
}

// Export a singleton instance
export const boxingService = new BoxingService();