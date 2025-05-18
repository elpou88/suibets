import express, { Request, Response } from 'express';
import { blockchainStorage } from './blockchain-storage';

export function registerBetRoutes(app: express.Express) {
  // Endpoint to place a bet
  app.post('/api/bets/place', async (req: Request, res: Response) => {
    try {
      const { walletAddress, bets } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address is required' 
        });
      }
      
      if (!bets || !Array.isArray(bets) || bets.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one bet is required' 
        });
      }
      
      const results = [];
      
      for (const bet of bets) {
        const { eventId, selection, odds, stake } = bet;
        
        if (!eventId || !selection || !odds || !stake) {
          return res.status(400).json({ 
            success: false, 
            message: 'Each bet must include eventId, selection, odds, and stake' 
          });
        }
        
        // Call the blockchain storage service to place the bet
        const result = await blockchainStorage.placeBet({
          walletAddress,
          eventId,
          selection,
          odds,
          stake,
          placedAt: new Date().toISOString(),
        });
        
        results.push(result);
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Bets placed successfully', 
        results 
      });
    } catch (error: any) {
      console.error('Error placing bets:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to place bets' 
      });
    }
  });
  
  // Endpoint to get user's bet history
  app.get('/api/bets/history', async (req: Request, res: Response) => {
    try {
      const walletAddress = req.query.walletAddress as string;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address is required' 
        });
      }
      
      // Call the blockchain storage service to get user bets
      const bets = await blockchainStorage.getUserBets(walletAddress);
      
      return res.status(200).json({ 
        success: true, 
        bets 
      });
    } catch (error: any) {
      console.error('Error getting bet history:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get bet history' 
      });
    }
  });
  
  // Endpoint to get user's staking data
  app.get('/api/staking', async (req: Request, res: Response) => {
    try {
      const walletAddress = req.query.walletAddress as string;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address is required' 
        });
      }
      
      // Call the blockchain storage service to get user staking data
      const stakingData = await blockchainStorage.getUserStaking(walletAddress);
      
      return res.status(200).json({ 
        success: true, 
        stakingData 
      });
    } catch (error: any) {
      console.error('Error getting staking data:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get staking data' 
      });
    }
  });
  
  // Endpoint to get user's dividends
  app.get('/api/dividends', async (req: Request, res: Response) => {
    try {
      const walletAddress = req.query.walletAddress as string;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: 'Wallet address is required' 
        });
      }
      
      // Call the blockchain storage service to get user dividends
      const dividends = await blockchainStorage.getUserDividends(walletAddress);
      
      return res.status(200).json({ 
        success: true, 
        dividends 
      });
    } catch (error: any) {
      console.error('Error getting dividends:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to get dividends' 
      });
    }
  });
  
  console.log('[express] Betting endpoints registered');
}