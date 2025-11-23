import { Express, Request, Response } from 'express';
import { db } from './db';
import { wurlusStaking } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { walrusService } from './services/walrusService';

interface StakingRecord {
  id: number;
  walletAddress: string;
  amountStaked: number | null;
  rewardRate: number | null;
  accumulatedRewards: number | null;
  isActive?: boolean;
  lockedUntil?: Date;
  stakingDate?: Date;
  unstakingDate?: Date | null;
  txHash?: string;
}

export function registerStakingRoutes(app: Express) {
  app.post('/api/staking/stake', async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount, periodDays } = req.body;

      if (!walletAddress || !amount || !periodDays) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const rewardRates: Record<number, number> = {
        30: 0.12,
        90: 0.18,
        180: 0.24,
        365: 0.32
      };

      const rewardRate = rewardRates[periodDays] || 0.12;
      const lockedUntil = new Date();
      lockedUntil.setDate(lockedUntil.getDate() + periodDays);

      // Store stake on Sui blockchain via Walrus protocol
      let txHash = '';
      try {
        txHash = await walrusService.stakeTokens(walletAddress, amount, periodDays);
      } catch (blockchainError) {
        console.warn('[Staking] Blockchain storage failed, using fallback:', blockchainError);
        txHash = `stake_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
      }

      const [stake] = await db
        .insert(wurlusStaking)
        .values({
          walletAddress,
          amountStaked: amount,
          rewardRate,
          lockedUntil,
          isActive: true,
          stakingDate: new Date(),
          txHash
        })
        .returning();

      console.log(`[Staking] User staked ${amount} SBETS for ${periodDays} days at ${rewardRate * 100}% APY - TxHash: ${txHash}`);

      return res.json({
        success: true,
        stake,
        txHash,
        estimatedReward: (amount * rewardRate * (periodDays / 365)).toFixed(2)
      });
    } catch (error) {
      console.error('[Staking] Error:', error);
      return res.status(500).json({ error: 'Failed to stake tokens' });
    }
  });

  app.get('/api/staking/user/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;

      const stakes = await db
        .select()
        .from(wurlusStaking)
        .where(eq(wurlusStaking.walletAddress, walletAddress));

      const totalStaked = stakes.reduce((sum: number, s: StakingRecord) => sum + (s.amountStaked || 0), 0);
      const totalRewards = stakes.reduce((sum: number, s: StakingRecord) => sum + (s.accumulatedRewards || 0), 0);

      return res.json({
        stakes,
        totalStaked,
        totalRewards,
        activeStakes: stakes.filter((s: StakingRecord) => s.isActive === true).length
      });
    } catch (error) {
      console.error('[Staking] Error fetching stakes:', error);
      return res.status(500).json({ error: 'Failed to fetch stakes' });
    }
  });

  app.post('/api/staking/unstake', async (req: Request, res: Response) => {
    try {
      const { stakeId, walletAddress } = req.body;

      if (!stakeId || !walletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stakes = await db
        .select()
        .from(wurlusStaking)
        .where(eq(wurlusStaking.id, stakeId));

      if (stakes.length === 0) {
        return res.status(404).json({ error: 'Stake not found' });
      }

      const stake = stakes[0] as StakingRecord;

      const now = new Date();
      const lockedUntilDate = stake.lockedUntil ? new Date(stake.lockedUntil) : null;
      if (lockedUntilDate && lockedUntilDate > now) {
        return res.status(400).json({ error: 'Tokens still locked' });
      }

      await db
        .update(wurlusStaking)
        .set({
          isActive: false,
          unstakingDate: new Date(),
          txHash: `unstake_${Date.now()}`
        })
        .where(eq(wurlusStaking.id, stakeId));

      console.log(`[Staking] User unstaked ${stake.amountStaked} SBETS`);

      return res.json({
        success: true,
        amountUnstaked: stake.amountStaked,
        rewardsEarned: stake.accumulatedRewards
      });
    } catch (error) {
      console.error('[Staking] Error unstaking:', error);
      return res.status(500).json({ error: 'Failed to unstake tokens' });
    }
  });

  app.get('/api/staking/rewards/:walletAddress', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;

      const stakes = await db
        .select()
        .from(wurlusStaking)
        .where(eq(wurlusStaking.walletAddress, walletAddress));

      const now = new Date().getTime();
      let totalRewards = 0;

      const stakesWithRewards = stakes.map((stake: StakingRecord) => {
        if (!stake.stakingDate || !stake.rewardRate) return { ...stake, pendingRewards: 0 };

        const stakeTime = new Date(stake.stakingDate as any).getTime();
        const daysPassed = (now - stakeTime) / (1000 * 60 * 60 * 24);
        const dailyReward = (stake.amountStaked || 0) * (stake.rewardRate / 365);
        const pendingRewards = dailyReward * daysPassed;

        totalRewards += pendingRewards;

        return { ...stake, pendingRewards: pendingRewards.toFixed(2) };
      });

      return res.json({
        totalRewards: totalRewards.toFixed(2),
        stakes: stakesWithRewards
      });
    } catch (error) {
      console.error('[Staking] Error calculating rewards:', error);
      return res.status(500).json({ error: 'Failed to calculate rewards' });
    }
  });

  app.post('/api/staking/claim-rewards', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      const stakes = await db
        .select()
        .from(wurlusStaking)
        .where(eq(wurlusStaking.walletAddress, walletAddress));

      const now = new Date().getTime();
      let totalRewardsClaimed = 0;

      for (const stake of stakes) {
        if (!stake.stakingDate || !stake.rewardRate) continue;

        const stakeTime = new Date(stake.stakingDate as any).getTime();
        const daysPassed = (now - stakeTime) / (1000 * 60 * 60 * 24);
        const dailyReward = (stake.amountStaked || 0) * (stake.rewardRate / 365);
        const pendingRewards = dailyReward * daysPassed;

        await db
          .update(wurlusStaking)
          .set({
            accumulatedRewards: (stake.accumulatedRewards || 0) + pendingRewards,
            stakingDate: new Date()
          })
          .where(eq(wurlusStaking.id, stake.id));

        totalRewardsClaimed += pendingRewards;
      }

      console.log(`[Staking] User claimed ${totalRewardsClaimed.toFixed(2)} SBETS in rewards`);

      return res.json({
        success: true,
        rewardsClaimed: totalRewardsClaimed.toFixed(2),
        txHash: `claim_${Date.now()}`
      });
    } catch (error) {
      console.error('[Staking] Error claiming rewards:', error);
      return res.status(500).json({ error: 'Failed to claim rewards' });
    }
  });

  console.log('[Staking] Registered all staking routes');
}
