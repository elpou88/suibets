import { Express, Request, Response } from "express";
import { betsApiService } from "./services/betsApiService";

/**
 * Register dedicated BetsAPI routes to ensure all sports data is properly fetched
 */
export function registerBetsApiRoutes(app: Express) {
  // Direct BetsAPI endpoint for live events across all sports
  app.get('/api/betsapi/live', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      console.log(`[BetsAPI Routes] Fetching live events for sport ID ${sportId || 'all'}`);
      
      const liveEvents = await betsApiService.fetchLiveEvents(sportId);
      return res.json(liveEvents);
    } catch (error) {
      console.error('[BetsAPI Routes] Error fetching live events:', error);
      return res.status(500).json({ error: 'Failed to fetch live events from BetsAPI' });
    }
  });
  
  // Direct BetsAPI endpoint for upcoming events across all sports
  app.get('/api/betsapi/upcoming', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 3;
      console.log(`[BetsAPI Routes] Fetching upcoming events for sport ID ${sportId || 'all'}`);
      
      const upcomingEvents = await betsApiService.fetchUpcomingEvents(sportId, days);
      return res.json(upcomingEvents);
    } catch (error) {
      console.error('[BetsAPI Routes] Error fetching upcoming events:', error);
      return res.status(500).json({ error: 'Failed to fetch upcoming events from BetsAPI' });
    }
  });
  
  // Direct BetsAPI endpoint for odds for a specific event
  app.get('/api/betsapi/odds/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      console.log(`[BetsAPI Routes] Fetching odds for event ID ${eventId}`);
      
      const odds = await betsApiService.fetchEventOdds(eventId);
      return res.json(odds);
    } catch (error) {
      console.error('[BetsAPI Routes] Error fetching event odds:', error);
      return res.status(500).json({ error: 'Failed to fetch event odds from BetsAPI' });
    }
  });
  
  // Direct BetsAPI endpoint for all supported sports 
  app.get('/api/betsapi/sports', async (_req: Request, res: Response) => {
    try {
      console.log('[BetsAPI Routes] Fetching all available sports from BetsAPI');
      
      // This is a fixed list of sports supported by BetsAPI
      const supportedSports = [
        { id: 1, name: 'Soccer', betsApiId: 1 },
        { id: 2, name: 'Basketball', betsApiId: 2 },
        { id: 3, name: 'Tennis', betsApiId: 3 },
        { id: 4, name: 'Baseball', betsApiId: 4 },
        { id: 5, name: 'Hockey', betsApiId: 5 },
        { id: 6, name: 'Handball', betsApiId: 6 },
        { id: 7, name: 'Volleyball', betsApiId: 7 },
        { id: 8, name: 'Rugby', betsApiId: 8 },
        { id: 9, name: 'Cricket', betsApiId: 9 },
        { id: 10, name: 'Golf', betsApiId: 10 },
        { id: 11, name: 'Boxing', betsApiId: 11 },
        { id: 12, name: 'MMA/UFC', betsApiId: 12 },
        { id: 13, name: 'Formula 1', betsApiId: 13 },
        { id: 14, name: 'Cycling', betsApiId: 14 }
      ];
      
      return res.json(supportedSports);
    } catch (error) {
      console.error('[BetsAPI Routes] Error fetching sports:', error);
      return res.status(500).json({ error: 'Failed to fetch sports from BetsAPI' });
    }
  });
}