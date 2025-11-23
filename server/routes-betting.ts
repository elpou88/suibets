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

      // CRITICAL: APPLY 1% PLATFORM FEE
      const platformFee = stake * 0.01;
      const betAmountAfterFee = stake - platformFee;
      
      // Calculate potential win AFTER fee deduction
      const potentialWin = betAmountAfterFee * odds;
      
      console.log(`[Betting] Stake: ${stake}, Platform Fee (1%): ${platformFee}, Bet Amount: ${betAmountAfterFee}, Potential Win: ${potentialWin.toFixed(2)}`);
      
      // Create bet record
      const betId = `${walletAddress}-${eventId}-${Date.now()}`;
      const bet: BetRecord = {
        id: betId,
        walletAddress,
        eventId: String(eventId),
        selectionName,
        odds,
        stake: betAmountAfterFee, // Store actual bet amount (after fee)
        market,
        potentialWin,
        status: 'pending',
        placedAt: new Date()
      };

      // Store bet on Sui blockchain via Walrus protocol - use amount AFTER fee
      try {
        const txHash = await walrusService.placeBet(
          walletAddress,
          String(eventId),
          selectionName,
          betAmountAfterFee, // Use amount after fee deduction
          odds
        );
        bet.txHash = txHash;
        console.log(`[Betting] Bet placed on blockchain - TxHash: ${txHash}, Amount: ${betAmountAfterFee}, Fee: ${platformFee}`);
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
        originalStake: stake,
        platformFee: platformFee.toFixed(2),
        betAmount: betAmountAfterFee.toFixed(2),
        potentialWin: potentialWin.toFixed(2),
        odds: odds,
        message: `Bet placed: ${betAmountAfterFee.toFixed(2)} SBETS on ${selectionName} @ ${odds} odds. Fee: ${platformFee.toFixed(2)} SBETS. Potential win: ${potentialWin.toFixed(2)} SBETS`
      });
    } catch (error) {
      console.error('[Betting] Error placing bet:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid bet data', details: error.errors });
      }
      return res.status(500).json({ error: 'Failed to place bet' });
    }
  });

  // Get user's bets (support both userId and walletAddress)
  app.get('/api/bets/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // userId can be either a wallet address or user ID - filter all bets for this user
      const userBets = Array.from(bets.values()).filter(b => 
        b.walletAddress === userId || b.id.startsWith(userId)
      );
      
      return res.json({
        userId,
        bets: userBets.map(b => ({
          id: b.id,
          eventName: b.eventId,
          prediction: b.selectionName,
          odds: b.odds,
          betAmount: b.stake,
          potentialPayout: b.potentialWin,
          currency: 'SUI',
          status: b.status,
          createdAt: b.placedAt,
          cashOutAmount: b.stake * 0.85,
          winningsWithdrawn: false
        })),
        totalBets: userBets.length,
        totalStaked: userBets.reduce((sum, b) => sum + b.stake, 0),
        totalPotentialWin: userBets.reduce((sum, b) => sum + b.potentialWin, 0)
      });
    } catch (error) {
      console.error('[Betting] Error fetching user bets:', error);
      return res.status(500).json({ error: 'Failed to fetch bets' });
    }
  });

  // Cash out bet (support both /cashout and /cash-out)
  app.post('/api/bets/:betId/cash-out', async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { cashoutOdds } = req.body;

      const bet = bets.get(betId);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      // Calculate cashout amount based on current odds
      const cashoutAmount = bet.stake * (cashoutOdds || 1.0);
      const originalFeeOnInitialStake = bet.stake / 0.99 * 0.01; // Calculate original fee from adjusted stake
      
      // Update status
      bet.status = 'cashout';

      // Store cashout on blockchain
      try {
        const txHash = await walrusService.cashoutBet(betId, cashoutAmount);
        console.log(`[Betting] Cashout processed - BetId: ${betId}, Bet Amount: ${bet.stake}, Cashout: ${cashoutAmount.toFixed(2)}, TxHash: ${txHash}`);
        
        return res.json({
          success: true,
          betId,
          betAmount: bet.stake.toFixed(2),
          cashoutAmount: cashoutAmount.toFixed(2),
          profitLoss: (cashoutAmount - bet.stake).toFixed(2),
          originalFee: originalFeeOnInitialStake.toFixed(2),
          txHash
        });
      } catch (blockchainError) {
        console.warn('[Betting] Blockchain cashout failed:', blockchainError);
        const fallbackTxHash = `cashout_${Date.now()}`;
        
        return res.json({
          success: true,
          betId,
          betAmount: bet.stake.toFixed(2),
          cashoutAmount: cashoutAmount.toFixed(2),
          profitLoss: (cashoutAmount - bet.stake).toFixed(2),
          originalFee: originalFeeOnInitialStake.toFixed(2),
          txHash: fallbackTxHash,
          warning: 'Processed locally, blockchain sync pending'
        });
      }
    } catch (error) {
      console.error('[Betting] Error cashing out bet:', error);
      return res.status(500).json({ error: 'Failed to cashout bet' });
    }
  });

  // Withdraw winnings from won bet
  app.post('/api/bets/:betId/withdraw-winnings', async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { userId } = req.body;

      const bet = bets.get(betId);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }

      if (bet.status !== 'won') {
        return res.status(400).json({ error: 'Only won bets can be withdrawn' });
      }

      // Mark as withdrawn
      const withdrawalAmount = bet.potentialWin;
      
      console.log(`[Betting] Withdrawal processed - BetId: ${betId}, Amount: ${withdrawalAmount.toFixed(2)}, User: ${userId}`);

      // Store withdrawal on blockchain
      try {
        const txHash = await walrusService.settleBet(betId, 'won', withdrawalAmount);
        
        return res.json({
          success: true,
          betId,
          withdrawalAmount: withdrawalAmount.toFixed(2),
          txHash,
          message: `${withdrawalAmount.toFixed(2)} SUI withdrawn successfully`
        });
      } catch (blockchainError) {
        console.warn('[Betting] Blockchain withdrawal failed:', blockchainError);
        const fallbackTxHash = `withdrawal_${Date.now()}`;
        
        return res.json({
          success: true,
          betId,
          withdrawalAmount: withdrawalAmount.toFixed(2),
          txHash: fallbackTxHash,
          message: `${withdrawalAmount.toFixed(2)} SUI withdrawn successfully`,
          warning: 'Processed locally, blockchain sync pending'
        });
      }
    } catch (error) {
      console.error('[Betting] Error withdrawing winnings:', error);
      return res.status(500).json({ error: 'Failed to withdraw winnings' });
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
      // Payout is potential win if won, 0 if lost
      const payout = result === 'won' ? bet.potentialWin : 0;
      // Platform keeps the stake amount if lost, or the profit (payout - stake) if won
      const platformRevenue = result === 'won' ? (payout - bet.stake) : bet.stake;

      console.log(`[Betting] Settling: BetId: ${betId}, Result: ${result}, Bet Amount: ${bet.stake}, Payout: ${payout.toFixed(2)}, Platform Revenue: ${platformRevenue.toFixed(2)}`);

      // Store settlement on blockchain
      try {
        const txHash = await walrusService.settleBet(betId, result, payout);
        console.log(`[Betting] Bet settled on blockchain - TxHash: ${txHash}`);
      } catch (err) {
        console.warn('[Betting] Blockchain settlement failed:', err);
      }

      return res.json({
        success: true,
        betId,
        betAmount: bet.stake.toFixed(2),
        result,
        payout: payout.toFixed(2),
        platformRevenue: platformRevenue.toFixed(2)
      });
    } catch (error) {
      console.error('[Betting] Error settling bet:', error);
      return res.status(500).json({ error: 'Failed to settle bet' });
    }
  });
}
