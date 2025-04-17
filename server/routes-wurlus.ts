import { Request, Response } from 'express';
import { Express } from 'express';
import { wurlusService } from './services/wurlusService';

/**
 * Register routes for Wurlus protocol integration
 */
export function registerWurlusRoutes(app: Express) {
  // Connect a wallet to Wurlus protocol
  app.post("/api/wurlus/connect", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "Wallet address is required" 
        });
      }
      
      // Register the wallet with the Wurlus protocol
      const txHash = await wurlusService.registerWallet(walletAddress);
      
      // Return success response with transaction hash
      res.json({ 
        success: true, 
        txHash,
        message: "Successfully connected to Wurlus protocol" 
      });
    } catch (error: any) {
      console.error("Error connecting to Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error connecting to Wurlus protocol: " + error.message
      });
    }
  });
  
  // Check if wallet is registered with Wurlus protocol
  app.get("/api/wurlus/registration/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Check if wallet is registered
      const isRegistered = await wurlusService.isWalletRegistered(walletAddress);
      
      // Return registration status
      res.json({ 
        success: true, 
        isRegistered,
        walletAddress
      });
    } catch (error: any) {
      console.error("Error checking Wurlus protocol registration:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error checking registration: " + error.message
      });
    }
  });
  
  // Place a bet using Wurlus protocol
  app.post("/api/wurlus/bet", async (req: Request, res: Response) => {
    try {
      const { walletAddress, eventId, marketId, outcomeId, amount, tokenType } = req.body;
      
      // Validate required fields
      if (!walletAddress || !eventId || !marketId || !outcomeId || !amount) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required bet parameters" 
        });
      }
      
      // Validate token type
      const validTokenType = tokenType === 'SUI' || tokenType === 'SBETS' ? tokenType : 'SUI';
      
      // Place the bet through Wurlus protocol
      const txHash = await wurlusService.placeBet(
        walletAddress, 
        eventId, 
        marketId, 
        outcomeId, 
        amount, 
        validTokenType as 'SUI' | 'SBETS'
      );
      
      // Return success response with transaction hash
      res.json({ 
        success: true, 
        txHash,
        walletAddress,
        eventId,
        marketId,
        outcomeId,
        amount,
        tokenType: validTokenType,
        message: `Successfully placed bet with ${validTokenType}`
      });
    } catch (error: any) {
      console.error("Error placing bet with Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error placing bet: " + error.message
      });
    }
  });
  
  // Claim winnings from a bet
  app.post("/api/wurlus/claim-winnings", async (req: Request, res: Response) => {
    try {
      const { walletAddress, betId } = req.body;
      
      if (!walletAddress || !betId) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address and bet ID are required" 
        });
      }
      
      // Claim winnings through Wurlus protocol
      const txHash = await wurlusService.claimWinnings(walletAddress, betId);
      
      // Return success response
      res.json({ 
        success: true,
        txHash,
        betId,
        walletAddress,
        message: "Successfully claimed winnings"
      });
    } catch (error: any) {
      console.error("Error claiming winnings from Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error claiming winnings: " + error.message
      });
    }
  });
  
  // Get bets for a wallet
  app.get("/api/wurlus/bets/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Get bets for wallet through Wurlus protocol
      const bets = await wurlusService.getWalletBets(walletAddress);
      
      // Return the bets
      res.json({ 
        success: true,
        walletAddress,
        bets
      });
    } catch (error: any) {
      console.error("Error getting bets from Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error getting bets: " + error.message
      });
    }
  });
  
  // Get dividends for a wallet
  app.get("/api/wurlus/dividends/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Get dividends for wallet through Wurlus protocol
      const dividends = await wurlusService.getWalletDividends(walletAddress);
      
      // Return the dividends
      res.json({ 
        success: true,
        walletAddress,
        dividends
      });
    } catch (error: any) {
      console.error("Error getting dividends from Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error getting dividends: " + error.message
      });
    }
  });
  
  // Claim dividends for a wallet
  app.post("/api/wurlus/claim-dividends", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Claim dividends through Wurlus protocol
      const txHash = await wurlusService.claimDividends(walletAddress);
      
      // Return success response
      res.json({ 
        success: true,
        txHash,
        walletAddress,
        message: "Successfully claimed dividends"
      });
    } catch (error: any) {
      console.error("Error claiming dividends from Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error claiming dividends: " + error.message
      });
    }
  });
  
  // Stake tokens in Wurlus protocol
  app.post("/api/wurlus/stake", async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount, periodDays } = req.body;
      
      if (!walletAddress || !amount || !periodDays) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address, amount, and period days are required" 
        });
      }
      
      // Stake tokens through Wurlus protocol
      const txHash = await wurlusService.stakeTokens(walletAddress, amount, periodDays);
      
      // Return success response
      res.json({ 
        success: true,
        txHash,
        walletAddress,
        amount,
        periodDays,
        message: "Successfully staked tokens"
      });
    } catch (error: any) {
      console.error("Error staking tokens with Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error staking tokens: " + error.message
      });
    }
  });
}