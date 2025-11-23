import axios from 'axios';
import * as cheerio from 'cheerio';

interface UpcomingEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  sport: string;
  league: string;
  odds?: {
    home?: number;
    draw?: number;
    away?: number;
  };
  isLive: boolean;
}

export class FlashscoreScraperService {
  private static readonly TIMEOUT = 15000;
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  private sportUrls = {
    football: 'https://www.flashscore.com/football/',
    basketball: 'https://www.flashscore.com/basketball/',
    tennis: 'https://www.flashscore.com/tennis/',
    cricket: 'https://www.flashscore.com/cricket/',
    americanfootball: 'https://www.flashscore.com/american-football/',
    hockey: 'https://www.flashscore.com/hockey/',
    volleyball: 'https://www.flashscore.com/volleyball/',
    rugby: 'https://www.flashscore.com/rugby/',
    golf: 'https://www.flashscore.com/golf/',
    cycling: 'https://www.flashscore.com/cycling/',
    athletics: 'https://www.flashscore.com/athletics/',
    motorsports: 'https://www.flashscore.com/motorsports/',
    boxing: 'https://www.flashscore.com/boxing/',
    mma: 'https://www.flashscore.com/mma/'
  };

  async scrapeUpcomingMatches(sport?: string): Promise<UpcomingEvent[]> {
    const events: UpcomingEvent[] = [];

    try {
      const headers = { 'User-Agent': FlashscoreScraperService.USER_AGENT };
      const sportsToScrape = sport ? [sport] : Object.keys(this.sportUrls);

      for (const sportKey of sportsToScrape) {
        const url = this.sportUrls[sportKey as keyof typeof this.sportUrls];
        if (!url) continue;

        try {
          console.log(`[Flashscore] Scraping upcoming ${sportKey} matches from ${url}`);
          const response = await axios.get(url, { 
            headers, 
            timeout: FlashscoreScraperService.TIMEOUT 
          });
          
          const $ = cheerio.load(response.data);
          
          // Look for match containers - Flashscore uses event rows
          const matches = $('[data-eventid], .event__row, [class*="match"], [class*="event"]');
          
          matches.each((_idx, elem) => {
            try {
              const $elem = $(elem);
              const text = $elem.text();
              
              // Extract team names and time
              const teamMatch = text.match(/(.+?)\s+(?:vs?|@|v|-)\s+(.+?)(?:\s+\d+:\d+|\s+\d+\/\d+|$)/i);
              const timeMatch = text.match(/(\d+:\d+|\d+\/\d+\/\d+|\d{1,2}\s+\w+)/);
              const scoresMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);

              if (teamMatch) {
                const startTime = timeMatch 
                  ? this.parseFlashscoreTime(timeMatch[0])
                  : new Date(Date.now() + 86400000).toISOString(); // Default to tomorrow

                events.push({
                  id: `flashscore_${sportKey}_${Date.now()}_${Math.random()}`,
                  homeTeam: teamMatch[1]?.trim() || 'Team A',
                  awayTeam: teamMatch[2]?.trim() || 'Team B',
                  startTime,
                  sport: sportKey,
                  league: this.extractLeague(text),
                  isLive: text.includes('LIVE') || text.includes('In Progress'),
                  odds: scoresMatch ? undefined : { home: 1.8, draw: 3.5, away: 2.0 }
                });
              }
            } catch (e) {
              console.debug(`[Flashscore] Error parsing match element: ${e}`);
            }
          });

          console.log(`[Flashscore] Found ${matches.length} potential matches for ${sportKey}`);
        } catch (err) {
          console.warn(`[Flashscore] Error scraping ${sportKey}:`, err);
        }
      }
    } catch (error) {
      console.error('[Flashscore] Service error:', error);
    }

    console.log(`[Flashscore] Total upcoming events scraped: ${events.length}`);
    return events;
  }

  async scrapeTodayAndTomorrowMatches(): Promise<UpcomingEvent[]> {
    const allEvents: UpcomingEvent[] = [];
    
    try {
      // Scrape all sports
      const events = await this.scrapeUpcomingMatches();
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Filter for today and tomorrow only
      const filteredEvents = events.filter(event => {
        const eventTime = new Date(event.startTime);
        const daysDiff = Math.floor((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 1;
      });

      allEvents.push(...filteredEvents);
    } catch (error) {
      console.error('[Flashscore] Error scraping today/tomorrow matches:', error);
    }

    return allEvents;
  }

  async scrapeWeekMatches(): Promise<UpcomingEvent[]> {
    const allEvents: UpcomingEvent[] = [];
    
    try {
      const events = await this.scrapeUpcomingMatches();
      
      const now = new Date();
      
      // Filter for next 7 days
      const filteredEvents = events.filter(event => {
        const eventTime = new Date(event.startTime);
        const daysDiff = Math.floor((eventTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 7;
      });

      allEvents.push(...filteredEvents);
    } catch (error) {
      console.error('[Flashscore] Error scraping week matches:', error);
    }

    return allEvents;
  }

  private parseFlashscoreTime(timeStr: string): string {
    // Handle various time formats from Flashscore
    const now = new Date();

    // Format: HH:MM (time today or tomorrow)
    if (timeStr.match(/^\d+:\d+$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const matchTime = new Date(now);
      matchTime.setHours(hours, minutes, 0, 0);

      // If time is in the past, assume tomorrow
      if (matchTime < now) {
        matchTime.setDate(matchTime.getDate() + 1);
      }

      return matchTime.toISOString();
    }

    // Format: DD/MM/YYYY
    if (timeStr.match(/^\d+\/\d+\/\d+$/)) {
      const [day, month, year] = timeStr.split('/').map(Number);
      const matchTime = new Date(year, month - 1, day);
      return matchTime.toISOString();
    }

    // Format: DD Mon (day month abbreviation)
    if (timeStr.match(/^\d+\s+\w+/)) {
      const [day, month] = timeStr.split(/\s+/);
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = monthNames.findIndex(m => m.startsWith(month.toLowerCase()));
      
      if (monthIdx >= 0) {
        const matchTime = new Date(now);
        matchTime.setMonth(monthIdx);
        matchTime.setDate(parseInt(day));
        
        if (matchTime < now) {
          matchTime.setFullYear(matchTime.getFullYear() + 1);
        }

        return matchTime.toISOString();
      }
    }

    // Default: return tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }

  private extractLeague(text: string): string {
    // Try to extract league name from text
    const leaguePatterns = [
      /Premier League/i,
      /La Liga/i,
      /Serie A/i,
      /Bundesliga/i,
      /Champions League/i,
      /Europa League/i,
      /NBA/i,
      /NFL/i,
      /MLB/i,
      /NHL/i,
      /ATP/i,
      /WTA/i,
      /IPL/i,
      /Test Match/i,
      /T20/i
    ];

    for (const pattern of leaguePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }

    // Default league names by sport
    if (text.toLowerCase().includes('football') || text.toLowerCase().includes('soccer')) {
      return 'International Football';
    }
    return 'Various Leagues';
  }
}

export const flashscoreScraperService = new FlashscoreScraperService();
