import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  sport: string;
  league: string;
  homeScore?: number;
  awayScore?: number;
  isLive: boolean;
}

export class EventScrapingService {
  private static readonly TIMEOUT = 10000;

  async scrapeEspnLiveEvents(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    try {
      const response = await axios.get('https://www.espn.com', { timeout: this.TIMEOUT });
      const $ = cheerio.load(response.data);

      $('article').each((_i, elem) => {
        const text = $(elem).text();
        const link = $(elem).find('a').attr('href');
        
        if (text.includes('LIVE') || text.includes('Final')) {
          const teams = text.match(/(.+?)\s+(?:vs?|@|v)\s+(.+?)(?:\s+\d+|\s+LIVE|$)/i);
          const scores = text.match(/(\d+)\s*[-–]\s*(\d+)/);
          
          if (teams) {
            events.push({
              id: `espn_scraped_${Date.now()}_${Math.random()}`,
              homeTeam: teams[1]?.trim() || 'Team A',
              awayTeam: teams[2]?.trim() || 'Team B',
              startTime: new Date().toISOString(),
              sport: 'football',
              league: 'NFL/Premier League',
              homeScore: scores ? parseInt(scores[1]) : undefined,
              awayScore: scores ? parseInt(scores[2]) : undefined,
              isLive: text.includes('LIVE')
            });
          }
        }
      });
    } catch (error) {
      console.error('[EventScrapingService] Failed to scrape ESPN:', error);
    }
    return events;
  }

  async scrapeUpcomingMatches(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    
    try {
      const response = await axios.get('https://www.espn.com/soccer/', { timeout: this.TIMEOUT });
      const $ = cheerio.load(response.data);

      $('tr').each((_i, elem) => {
        const cells = $(elem).find('td');
        if (cells.length >= 3) {
          const time = $(cells[0]).text().trim();
          const matchText = $(cells[1]).text().trim();
          
          const teams = matchText.match(/(.+?)\s+(?:vs?|@)\s+(.+)/i);
          
          if (teams && (time.includes(':') || time.match(/\d+[ap]m/i))) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            events.push({
              id: `espn_upcoming_${Date.now()}_${Math.random()}`,
              homeTeam: teams[1]?.trim() || 'Home Team',
              awayTeam: teams[2]?.trim() || 'Away Team',
              startTime: tomorrow.toISOString(),
              sport: 'football',
              league: 'UEFA Champions League / Premier League',
              isLive: false
            });
          }
        }
      });
    } catch (error) {
      console.error('[EventScrapingService] Failed to scrape upcoming matches:', error);
    }

    return events;
  }

  async scrapeAllSports(): Promise<ScrapedEvent[]> {
    const allEvents: ScrapedEvent[] = [];
    
    const sportSources = [
      { sport: 'football', url: 'https://www.espn.com/soccer/' },
      { sport: 'basketball', url: 'https://www.espn.com/nba/' },
      { sport: 'baseball', url: 'https://www.espn.com/mlb/' },
      { sport: 'hockey', url: 'https://www.espn.com/nhl/' },
      { sport: 'tennis', url: 'https://www.espn.com/tennis/' }
    ];

    for (const source of sportSources) {
      try {
        const response = await axios.get(source.url, { timeout: this.TIMEOUT });
        const $ = cheerio.load(response.data);

        const eventElements = $('article, [data-testid*="event"], .scoreboard-item');
        
        eventElements.each((_i, elem) => {
          const text = $(elem).text();
          const teams = text.match(/(.+?)\s+(?:vs?|@|v)\s+(.+?)(?:\s+\d+|\s+LIVE|$)/i);
          const scores = text.match(/(\d+)\s*[-–]\s*(\d+)/);

          if (teams && text.length > 10) {
            allEvents.push({
              id: `scraped_${source.sport}_${Date.now()}_${Math.random()}`,
              homeTeam: teams[1]?.trim().substring(0, 30) || 'Team A',
              awayTeam: teams[2]?.trim().substring(0, 30) || 'Team B',
              startTime: new Date().toISOString(),
              sport: source.sport,
              league: 'Major League',
              homeScore: scores ? parseInt(scores[1]) : undefined,
              awayScore: scores ? parseInt(scores[2]) : undefined,
              isLive: text.includes('LIVE') || text.includes('In Progress')
            });
          }
        });
      } catch (error) {
        console.error(`[EventScrapingService] Failed to scrape ${source.sport}:`, error);
      }
    }

    return allEvents;
  }
}

export const eventScrapingService = new EventScrapingService();
