import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "SBETS") {
  // Use 4 decimal places for SUI (smaller value) and 2 for SBETS
  const decimals = currency === "SUI" ? 4 : 2;
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${formattedValue} ${currency}`;
}

export function formatOdds(odds: number) {
  return odds.toFixed(2);
}

export function formatDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function calculatePotentialWinnings(stake: number, odds: number): number {
  // Ensure we handle edge cases with proper validation
  if (isNaN(stake) || stake <= 0 || isNaN(odds) || odds <= 0) {
    return 0;
  }
  // Round to 2 decimal places to avoid floating point issues
  return Math.round((stake * odds) * 100) / 100;
}

export function calculateParlayOdds(selections: { odds: number }[]): number {
  if (!selections || selections.length === 0) {
    return 0;
  }
  
  // Multiply all odds together for parlay calculation
  const totalOdds = selections.reduce((acc, selection) => {
    const odds = selection.odds || 0;
    // Skip invalid odds
    if (odds <= 0) return acc;
    return acc * odds;
  }, 1);
  
  // Round to 2 decimal places for consistency
  return Math.round(totalOdds * 100) / 100;
}

export const WALLET_TYPES = [
  { id: 'sui', name: 'Sui Wallet', color: 'bg-blue-500' },
  { id: 'suiet', name: 'Suiet Wallet', color: 'bg-purple-500' },
  { id: 'nightly', name: 'Nightly Wallet', color: 'bg-indigo-500' },
  { id: 'walletconnect', name: 'Wallet Connect', color: 'bg-green-500' }
];

// Calculate correct score odds based on sport type
export function calculateCorrectScoreOdds(sport: string, homeScore: number, awayScore: number, baseOdds: number = 5.0): number {
  // Different calculation logics for different sports
  switch(sport.toLowerCase()) {
    case 'football':
    case 'soccer':
      // Soccer/Football: lower scores are more common
      const totalGoals = homeScore + awayScore;
      return baseOdds * (1 + (totalGoals / 2));
      
    case 'basketball':
      // Basketball: higher scores are normal, so use different logic
      const scoreDiff = Math.abs(homeScore - awayScore);
      // Close games are more likely than blowouts
      return baseOdds * (1 + (scoreDiff / 10));
      
    case 'tennis':
      // Tennis scoring (sets)
      return baseOdds * (1 + (Math.max(homeScore, awayScore) * 0.5));
      
    case 'baseball':
      // Baseball: moderate scoring
      return baseOdds * (1 + ((homeScore + awayScore) / 5));
      
    case 'hockey':
      // Hockey: low scoring
      return baseOdds * (1 + ((homeScore + awayScore) * 0.8));
      
    case 'cricket':
      // Cricket: high scoring
      return baseOdds * (1 + (Math.abs(homeScore - awayScore) / 50));
      
    case 'rugby-league':
    case 'rugby-union':
      // Rugby: moderate to high scoring
      return baseOdds * (1 + ((homeScore + awayScore) / 15));
      
    case 'boxing':
    case 'mma-ufc':
      // Boxing/MMA: rounds/decisions or KO
      // For these sports, scores might represent rounds won or method of victory
      return baseOdds * (1 + (Math.abs(homeScore - awayScore) * 0.5));
      
    default:
      // Default calculation for other sports
      return baseOdds * (1 + ((homeScore + awayScore) / 4));
  }
}

// Get sport-specific market types
export function getSportMarkets(sportType: string): string[] {
  const baseMarkets = ['Match Winner', 'Double Chance', 'Total'];
  
  switch(sportType.toLowerCase()) {
    case 'football':
    case 'soccer':
      return [...baseMarkets, 'Correct Score', 'Both Teams to Score', 'First Goal Scorer', 'Half-Time/Full-Time'];
      
    case 'basketball':
      return [...baseMarkets, 'Point Spread', 'Player Points', 'First Quarter Winner', 'Race to 20 Points'];
      
    case 'tennis':
      return [...baseMarkets, 'Set Betting', 'Total Games', 'Player to Win a Set', 'Correct Set Score'];
      
    case 'baseball':
      return [...baseMarkets, 'Run Line', 'Total Runs', 'First Team to Score', 'Innings Betting'];
      
    case 'boxing':
    case 'mma-ufc':
      return ['Fight Winner', 'Method of Victory', 'Round Betting', 'Fight to Go the Distance', 'Total Rounds'];
      
    case 'hockey':
      return [...baseMarkets, 'Puck Line', 'Total Goals', 'Period Betting', 'Team to Score First'];
      
    case 'cricket':
      return ['Match Winner', 'Top Batsman', 'Top Bowler', 'Total Match Runs', 'Method of Dismissal'];
      
    case 'rugby-league':
    case 'rugby-union':
      return [...baseMarkets, 'Handicap', 'First Try Scorer', 'Total Tries', 'Winning Margin'];
      
    default:
      return baseMarkets;
  }
}
