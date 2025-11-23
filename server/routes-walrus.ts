import { Request, Response } from 'express';
import { Express } from 'express';
import { walrusService } from './services/walrusService';

/**
 * Register routes for Walrus protocol integration
 */
export function registerWalrusRoutes(app: Express) {
  // Connect a wallet to Walrus protocol
  app.post("/api/walrus/connect", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "Wallet address is required" 
        });
      }
      
      // Register the wallet with the Walrus protocol
      const txHash = await walrusService.registerWallet(walletAddress);
      
      // Return success response with transaction hash
      res.json({ 
        success: true, 
        txHash,
        message: "Successfully connected to Walrus protocol" 
      });
    } catch (error: any) {
      console.error("Error connecting to Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error connecting to Walrus protocol: " + error.message
      });
    }
  });
  
  // Check if wallet is registered with Walrus protocol
  app.get("/api/walrus/registration/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Check if wallet is registered
      const isRegistered = await walrusService.isWalletRegistered(walletAddress);
      
      // Return registration status
      res.json({ 
        success: true, 
        isRegistered,
        walletAddress
      });
    } catch (error: any) {
      console.error("Error checking Walrus protocol registration:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error checking registration: " + error.message
      });
    }
  });
  
  // Place a bet using Walrus protocol
  app.post("/api/walrus/bet", async (req: Request, res: Response) => {
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
      
      // CALCULATE 1% PLATFORM FEE
      const platformFee = amount * 0.01;
      const betAmountAfterFee = amount - platformFee;
      
      console.log(`[Walrus Bet] Amount: ${amount}, Platform Fee (1%): ${platformFee}, After Fee: ${betAmountAfterFee}`);
      
      // Place the bet through Walrus protocol with fee deducted
      const txHash = await walrusService.placeBet(
        walletAddress, 
        eventId, 
        marketId, 
        outcomeId, 
        betAmountAfterFee, // Use amount after fee
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
        betAmount: amount,
        platformFee: platformFee,
        betAmountAfterFee: betAmountAfterFee,
        tokenType: validTokenType,
        message: `Successfully placed bet with ${validTokenType}. Fee: ${platformFee} ${validTokenType}`
      });
    } catch (error: any) {
      console.error("Error placing bet with Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error placing bet: " + error.message
      });
    }
  });
  
  // Claim winnings from a bet
  app.post("/api/walrus/claim-winnings", async (req: Request, res: Response) => {
    try {
      const { walletAddress, betId } = req.body;
      
      if (!walletAddress || !betId) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address and bet ID are required" 
        });
      }
      
      // Claim winnings through Walrus protocol
      const txHash = await walrusService.claimWinnings(walletAddress, betId);
      
      // Return success response
      res.json({ 
        success: true,
        txHash,
        betId,
        walletAddress,
        message: "Successfully claimed winnings"
      });
    } catch (error: any) {
      console.error("Error claiming winnings from Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error claiming winnings: " + error.message
      });
    }
  });
  
  // Get bets for a wallet
  app.get("/api/walrus/bets/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Get bets for wallet through Walrus protocol
      const bets = await walrusService.getWalletBets(walletAddress);
      
      // Return the bets
      res.json({ 
        success: true,
        walletAddress,
        bets
      });
    } catch (error: any) {
      console.error("Error getting bets from Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error getting bets: " + error.message
      });
    }
  });
  
  // Get dividends for a wallet
  app.get("/api/walrus/dividends/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Get dividends for wallet through Walrus protocol
      const dividends = await walrusService.getWalletDividends(walletAddress);
      
      // Return the dividends
      res.json({ 
        success: true,
        walletAddress,
        dividends
      });
    } catch (error: any) {
      console.error("Error getting dividends from Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error getting dividends: " + error.message
      });
    }
  });
  
  // Claim dividends for a wallet
  app.post("/api/walrus/claim-dividends", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      // Claim dividends through Walrus protocol
      const txHash = await walrusService.claimDividends(walletAddress);
      
      // Return success response
      res.json({ 
        success: true,
        txHash,
        walletAddress,
        message: "Successfully claimed dividends"
      });
    } catch (error: any) {
      console.error("Error claiming dividends from Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error claiming dividends: " + error.message
      });
    }
  });
  
  // Stake tokens in Walrus protocol
  app.post("/api/walrus/stake", async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount, periodDays } = req.body;
      
      if (!walletAddress || !amount || !periodDays) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address, amount, and period days are required" 
        });
      }
      
      // Stake tokens through Walrus protocol
      const txHash = await walrusService.stakeTokens(walletAddress, amount, periodDays);
      
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
      console.error("Error staking tokens with Walrus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error staking tokens: " + error.message
      });
    }
  });
}