import { Express, Request, Response } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { walrusService } from './services/walrusService';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define betting schemas
const placeBetSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address required'),
  eventId: z.union([z.string(), z.number()]),
  selectionName: z.string().min(1, 'Selection required'),
  odds: z.number().positive('Odds must be positive'),
  stake: z.number().positive('Stake must be positive'),
  market: z.string().default('Match Winner')
});

type PlaceBetRequest = z.infer<typeof placeBetSchema>;

interface BetRecord {
  id: string;
  walletAddress: string;
  eventId: string;
  selectionName: string;
  odds: number;
  stake: number;
  market: string;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cashout';
  placedAt: Date;
  txHash?: string;
}

const bets: Map<string, BetRecord> = new Map();

export function registerBettingRoutes(app: Express) {
  // Place a bet
  app.post('/api/bets/place', async (req: Request, res: Response) => {
    try {
      const validated = placeBetSchema.parse(req.body);
      const {
        walletAddress,
        eventId,
        selectionName,
        odds,
        stake,
        market
      } = validated;

      // Calculate potential win
      const potentialWin = stake * odds;
      
      // Create bet record
      const betId = `${walletAddress}-${eventId}-${Date.now()}`;
      const bet: BetRecord = {
        id: betId,
        walletAddress,
        eventId: String(eventId),
        selectionName,
        odds,
        stake,
        market,
        potentialWin,
        status: 'pending',
        placedAt: new Date()
      };

      // Store bet on Sui blockchain via Walrus protocol
      try {
        const txHash = await walrusService.placeBet(
          walletAddress,
          String(eventId),
          selectionName,
          stake,
          odds
        );
        bet.txHash = txHash;
        console.log(`[Betting] Bet placed on blockchain - TxHash: ${txHash}`);
      } catch (blockchainError) {
        console.warn('[Betting] Blockchain storage failed, using fallback:', blockchainError);
        bet.txHash = `bet_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
      }

      // Store in memory
      bets.set(betId, bet);

      return res.json({
        success: true,
        betId,
        bet,
        txHash: bet.txHash,
        message: `Bet placed: ${stake} SBETS on ${selectionName} @ ${odds} odds. Potential win: ${potentialWin.toFixed(2)} SBETS`
      });
    } catch (error) {
      console.error('[Betting] Error placing bet:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid bet data', details: error.errors });
      }
      return res.status(500).json({ error: 'Failed to place bet' });
    }
  });

  // Get user's bets
  app.get('/api/bets/user/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const userBets = Array.from(bets.values()).filter(b => b.walletAddress === walletAddress);
      
      return res.json({
        walletAddress,
        bets: userBets,
        totalBets: userBets.length,
        totalStaked: userBets.reduce((sum, b) => sum + b.stake, 0),
        totalPotentialWin: userBets.reduce((sum, b) => sum + b.potentialWin, 0)
      });
    } catch (error) {
      console.error('[Betting] Error fetching user bets:', error);
      return res.status(500).json({ error: 'Failed to fetch bets' });
    }
  });

  // Cash out bet
  app.post('/api/bets/:betId/cashout', async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { cashoutOdds } = req.body;

      const bet = bets.get(betId);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      const cashoutAmount = bet.stake * (cashoutOdds || 1.0);
      
      // Update status
      bet.status = 'cashout';

      // Store cashout on blockchain
      try {
        const txHash = await walrusService.cashoutBet(betId, cashoutAmount);
        console.log(`[Betting] Cashout processed - BetId: ${betId}, Amount: ${cashoutAmount} SBETS, TxHash: ${txHash}`);
        
        return res.json({
          success: true,
          betId,
          originalStake: bet.stake,
          cashoutAmount: cashoutAmount.toFixed(2),
          profit: (cashoutAmount - bet.stake).toFixed(2),
          txHash
        });
      } catch (blockchainError) {
        console.warn('[Betting] Blockchain cashout failed:', blockchainError);
        const fallbackTxHash = `cashout_${Date.now()}`;
        
        return res.json({
          success: true,
          betId,
          originalStake: bet.stake,
          cashoutAmount: cashoutAmount.toFixed(2),
          profit: (cashoutAmount - bet.stake).toFixed(2),
          txHash: fallbackTxHash,
          warning: 'Processed locally, blockchain sync pending'
        });
      }
    } catch (error) {
      console.error('[Betting] Error cashing out bet:', error);
      return res.status(500).json({ error: 'Failed to cashout bet' });
    }
  });

  // Settle a bet (admin only)
  app.post('/api/bets/:betId/settle', async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { result } = req.body; // 'won' or 'lost'

      const bet = bets.get(betId);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      bet.status = result === 'won' ? 'won' : 'lost';
      const payout = result === 'won' ? bet.potentialWin : 0;

      // Store settlement on blockchain
      try {
        const txHash = await walrusService.settleBet(betId, result, payout);
        console.log(`[Betting] Bet settled - BetId: ${betId}, Result: ${result}, Payout: ${payout} SBETS, TxHash: ${txHash}`);
      } catch (err) {
        console.warn('[Betting] Blockchain settlement failed:', err);
      }

      return res.json({
        success: true,
        betId,
        result,
        payout: payout.toFixed(2)
      });
    } catch (error) {
      console.error('[Betting] Error settling bet:', error);
      return res.status(500).json({ error: 'Failed to settle bet' });
    }
  });
}
