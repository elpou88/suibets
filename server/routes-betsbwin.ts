import { Express, Request, Response } from "express";
import { betsBwinApiService } from "./services/betsBwinApi";

/**
 * Register dedicated BetsAPI BWin routes to ensure all sports data is properly fetched
 */
export function registerBetsBwinRoutes(app: Express) {
  // Direct BetsAPI BWin endpoint for live events across all sports
  app.get('/api/betsbwin/live', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      console.log(`[BetsBwin Routes] Fetching live events for sport ID ${sportId || 'all'}`);
      
      const liveEvents = await betsBwinApiService.getLiveEvents(sportId);
      return res.json(liveEvents);
    } catch (error) {
      console.error('[BetsBwin Routes] Error fetching live events:', error);
      return res.status(500).json({ error: 'Failed to fetch live events from BetsAPI BWin' });
    }
  });
  
  // Direct BetsAPI BWin endpoint for upcoming events across all sports
  app.get('/api/betsbwin/upcoming', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 3;
      console.log(`[BetsBwin Routes] Fetching upcoming events for sport ID ${sportId || 'all'}`);
      
      const upcomingEvents = await betsBwinApiService.getUpcomingEvents(sportId);
      return res.json(upcomingEvents);
    } catch (error) {
      console.error('[BetsBwin Routes] Error fetching upcoming events:', error);
      return res.status(500).json({ error: 'Failed to fetch upcoming events from BetsAPI BWin' });
    }
  });
  
  // Direct BetsAPI BWin endpoint for event details
  app.get('/api/betsbwin/event/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.eventId;
      console.log(`[BetsBwin Routes] Fetching details for event ID ${eventId}`);
      
      const eventDetails = await betsBwinApiService.fetchEventDetails(eventId);
      return res.json(eventDetails);
    } catch (error) {
      console.error('[BetsBwin Routes] Error fetching event details:', error);
      return res.status(500).json({ error: 'Failed to fetch event details from BetsAPI BWin' });
    }
  });
  
  // Direct BetsAPI BWin endpoint for all supported sports 
  app.get('/api/betsbwin/sports', async (_req: Request, res: Response) => {
    try {
      console.log('[BetsBwin Routes] Fetching all available sports from BetsAPI BWin');
      
      const sports = await betsBwinApiService.fetchSports();
      return res.json(sports);
    } catch (error) {
      console.error('[BetsBwin Routes] Error fetching sports:', error);
      return res.status(500).json({ error: 'Failed to fetch sports from BetsAPI BWin' });
    }
  });
}