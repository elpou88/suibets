import { storage } from '../storage';
import balanceService from './balanceService';

interface FinishedMatch {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
  status: string;
}

interface UnsettledBet {
  id: string;
  eventId: string;
  prediction: string;
  odds: number;
  stake: number;
  potentialWin: number;
  userId: string;
  currency: string;
}

const REVENUE_WALLET = 'platform_revenue';

class SettlementWorkerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private settledEventIds = new Set<string>();
  private checkInterval = 30 * 1000; // 30 seconds

  start() {
    if (this.isRunning) {
      console.log('⚙️ SettlementWorker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 SettlementWorker started - checking for finished matches every 30s');

    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndSettleBets();
      } catch (error) {
        console.error('❌ SettlementWorker error:', error);
      }
    }, this.checkInterval);

    this.checkAndSettleBets();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ SettlementWorker stopped');
  }

  private async checkAndSettleBets() {
    console.log('🔍 SettlementWorker: Checking for finished matches...');

    try {
      const finishedMatches = await this.getFinishedMatches();
      
      if (finishedMatches.length === 0) {
        console.log('📭 SettlementWorker: No new finished matches to settle');
        return;
      }

      console.log(`📋 SettlementWorker: Found ${finishedMatches.length} finished matches`);

      const unsettledBets = await this.getUnsettledBets();
      
      if (unsettledBets.length === 0) {
        console.log('📭 SettlementWorker: No unsettled bets to process');
        return;
      }

      console.log(`🎯 SettlementWorker: Processing ${unsettledBets.length} unsettled bets`);

      for (const match of finishedMatches) {
        const betsForMatch = unsettledBets.filter(bet => 
          bet.eventId === match.eventId || 
          bet.prediction?.toLowerCase().includes(match.homeTeam.toLowerCase()) ||
          bet.prediction?.toLowerCase().includes(match.awayTeam.toLowerCase())
        );

        if (betsForMatch.length > 0) {
          console.log(`⚽ Settling ${betsForMatch.length} bets for ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
          await this.settleBetsForMatch(match, betsForMatch);
        }
      }
    } catch (error) {
      console.error('❌ SettlementWorker checkAndSettleBets error:', error);
    }
  }

  private async getFinishedMatches(): Promise<FinishedMatch[]> {
    const finishedMatches: FinishedMatch[] = [];
    
    try {
      const sportsToCheck = ['football', 'basketball', 'baseball', 'hockey', 'handball', 'volleyball', 'rugby'];
      
      for (const sport of sportsToCheck) {
        try {
          const response = await this.fetchFinishedForSport(sport);
          finishedMatches.push(...response);
        } catch (error) {
          // Silently skip failed sports
        }
      }

      return finishedMatches.filter(match => !this.settledEventIds.has(match.eventId));
    } catch (error) {
      console.error('Error fetching finished matches:', error);
      return [];
    }
  }

  private async fetchFinishedForSport(sport: string): Promise<FinishedMatch[]> {
    const finished: FinishedMatch[] = [];

    const apiKey = process.env.SPORTSDATA_API_KEY || process.env.APISPORTS_KEY || '';
    if (!apiKey) return [];

    const today = new Date().toISOString().split('T')[0];
    
    const sportEndpoints: Record<string, { url: string; params: Record<string, string> }> = {
      football: {
        url: 'https://v3.football.api-sports.io/fixtures',
        params: { date: today, status: 'FT-AET-PEN' }
      },
      basketball: {
        url: 'https://v1.basketball.api-sports.io/games',
        params: { date: today, status: 'FT' }
      },
      baseball: {
        url: 'https://v1.baseball.api-sports.io/games',
        params: { date: today, status: 'FT' }
      },
      hockey: {
        url: 'https://v1.hockey.api-sports.io/games',
        params: { date: today, status: 'FT' }
      }
    };

    const config = sportEndpoints[sport];
    if (!config) return [];

    try {
      const axios = await import('axios');
      const response = await axios.default.get(config.url, {
        params: config.params,
        headers: {
          'x-apisports-key': apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data?.response && Array.isArray(response.data.response)) {
        for (const match of response.data.response) {
          const eventId = match.fixture?.id?.toString() || match.id?.toString();
          const homeTeam = match.teams?.home?.name || '';
          const awayTeam = match.teams?.away?.name || '';
          
          let homeScore = 0;
          let awayScore = 0;
          
          if (sport === 'football') {
            homeScore = match.goals?.home || 0;
            awayScore = match.goals?.away || 0;
          } else if (sport === 'basketball') {
            homeScore = match.scores?.home?.total || 0;
            awayScore = match.scores?.away?.total || 0;
          } else {
            homeScore = match.scores?.home || 0;
            awayScore = match.scores?.away || 0;
          }

          const winner: 'home' | 'away' | 'draw' = 
            homeScore > awayScore ? 'home' : 
            awayScore > homeScore ? 'away' : 'draw';

          finished.push({
            eventId,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            winner,
            status: 'finished'
          });
        }
      }
    } catch (error) {
      // Silently handle API errors
    }

    return finished;
  }

  private settledBetIds = new Set<string>(); // Track settled bet IDs to prevent duplicates

  private async getUnsettledBets(): Promise<UnsettledBet[]> {
    try {
      // Get ALL unsettled bets from all users - not just one user
      const allBets = await storage.getAllBets('pending');
      return allBets
        .filter(bet => !this.settledBetIds.has(bet.id))
        .map(bet => ({
          id: bet.id,
          eventId: bet.eventId || '',
          prediction: bet.selection || bet.prediction || '',
          odds: bet.odds,
          stake: bet.stake || bet.betAmount,
          potentialWin: bet.potentialWin || bet.potentialPayout,
          userId: bet.walletAddress || bet.userId || 'unknown',
          currency: bet.currency || 'SUI'
        }));
    } catch (error) {
      console.error('Error getting unsettled bets:', error);
      return [];
    }
  }

  private async settleBetsForMatch(match: FinishedMatch, bets: UnsettledBet[]) {
    for (const bet of bets) {
      // DUPLICATE SETTLEMENT PREVENTION: Skip if already settled this session
      if (this.settledBetIds.has(bet.id)) {
        console.log(`⚠️ SKIPPING: Bet ${bet.id} already processed this session`);
        continue;
      }
      
      try {
        const isWinner = this.determineBetOutcome(bet, match);
        const status = isWinner ? 'won' : 'lost';
        const payout = isWinner ? bet.potentialWin : 0;

        await storage.updateBetStatus(bet.id, status, payout);

        if (isWinner && payout > 0) {
          balanceService.addWinnings(bet.userId, payout, bet.currency as 'SUI' | 'SBETS');
          console.log(`💰 WINNER: ${bet.userId} won ${payout} ${bet.currency} on ${bet.prediction}`);
        } else {
          balanceService.addRevenue(bet.stake, bet.currency as 'SUI' | 'SBETS');
          console.log(`📉 LOST: ${bet.userId} lost ${bet.stake} ${bet.currency} - added to platform revenue`);
        }

        // Mark bet as settled to prevent duplicate processing
        this.settledBetIds.add(bet.id);
        console.log(`✅ Settled bet ${bet.id}: ${status} (${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam})`);
      } catch (error) {
        console.error(`❌ Error settling bet ${bet.id}:`, error);
      }
    }

    this.settledEventIds.add(match.eventId);
  }

  private determineBetOutcome(bet: UnsettledBet, match: FinishedMatch): boolean {
    const prediction = bet.prediction.toLowerCase();
    const homeTeam = match.homeTeam.toLowerCase();
    const awayTeam = match.awayTeam.toLowerCase();

    if (prediction.includes(homeTeam) || prediction === 'home' || prediction === '1') {
      return match.winner === 'home';
    }
    
    if (prediction.includes(awayTeam) || prediction === 'away' || prediction === '2') {
      return match.winner === 'away';
    }
    
    if (prediction === 'draw' || prediction === 'x' || prediction === 'tie') {
      return match.winner === 'draw';
    }

    if (prediction.includes('over')) {
      const totalGoals = match.homeScore + match.awayScore;
      const threshold = parseFloat(prediction.replace(/[^0-9.]/g, '')) || 2.5;
      return totalGoals > threshold;
    }
    
    if (prediction.includes('under')) {
      const totalGoals = match.homeScore + match.awayScore;
      const threshold = parseFloat(prediction.replace(/[^0-9.]/g, '')) || 2.5;
      return totalGoals < threshold;
    }

    return false;
  }

  async manualSettle(betId: string, outcome: 'won' | 'lost' | 'void') {
    try {
      const bet = await storage.getBet(betId);
      if (!bet) throw new Error('Bet not found');

      const payout = outcome === 'won' ? bet.potentialPayout : 
                     outcome === 'void' ? bet.betAmount : 0;

      await storage.updateBetStatus(betId, outcome, payout);

      if (outcome === 'won' && payout > 0) {
        balanceService.addWinnings(bet.userId || 'user1', payout, (bet.feeCurrency || 'SUI') as 'SUI' | 'SBETS');
        console.log(`💰 MANUAL SETTLE: ${bet.userId} won ${payout} ${bet.feeCurrency}`);
      } else if (outcome === 'void') {
        balanceService.addWinnings(bet.userId || 'user1', payout, (bet.feeCurrency || 'SUI') as 'SUI' | 'SBETS');
        console.log(`🔄 VOIDED: Refunded ${payout} to ${bet.userId}`);
      } else {
        balanceService.addRevenue(bet.betAmount, (bet.feeCurrency || 'SUI') as 'SUI' | 'SBETS');
        console.log(`📉 MANUAL LOSS: Added ${bet.betAmount} to platform revenue`);
      }

      return { success: true, betId, outcome, payout };
    } catch (error) {
      console.error('Manual settlement error:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      settledEvents: this.settledEventIds.size,
      checkInterval: this.checkInterval / 1000
    };
  }
}

export const settlementWorker = new SettlementWorkerService();
