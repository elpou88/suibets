import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SelectedBet } from "@/types";

// Helper utility for joining tailwind class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format odds to display in UI (decimal odds)
export function formatOdds(odds: number): string {
  if (!odds) return "-";
  return odds.toFixed(2);
}

// Format currency ($ format)
export function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Format date to display in UI
export function formatDate(date?: string | Date): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// Calculate potential winnings based on stake and odds
export function calculatePotentialWinnings(stake: number, odds: number): number {
  if (!stake || !odds) return 0;
  return stake * odds;
}

// Calculate parlay odds (multiple bets)
export function calculateParlayOdds(bets: { odds: number }[]): number {
  if (!bets.length) return 0;
  return bets.reduce((totalOdds, bet) => totalOdds * bet.odds, 1);
}

// Get sport-specific markets based on sport type
export function getSportMarkets(sportType: string): { name: string; code: string }[] {
  // Default markets available for all sports
  const defaultMarkets = [
    { name: "Match Result", code: "MR" },
    { name: "Draw No Bet", code: "DNB" },
    { name: "Double Chance", code: "DC" },
    { name: "Handicap", code: "HDP" },
  ];

  // Sport-specific markets
  switch (sportType) {
    case "football":
    case "soccer":
      return [
        ...defaultMarkets,
        { name: "Both Teams to Score", code: "BTTS" },
        { name: "Total Goals", code: "TG" },
        { name: "Correct Score", code: "CS" },
        { name: "Half-Time/Full-Time", code: "HTFT" },
        { name: "First Goalscorer", code: "FG" },
      ];
    case "basketball":
      return [
        ...defaultMarkets,
        { name: "Total Points", code: "TP" },
        { name: "Point Spread", code: "PS" },
        { name: "Quarter Betting", code: "QB" },
        { name: "Race to Points", code: "RTP" },
      ];
    case "tennis":
      return [
        ...defaultMarkets,
        { name: "Set Betting", code: "SB" },
        { name: "Total Games", code: "TG" },
        { name: "Games Handicap", code: "GH" },
        { name: "Player to Win a Set", code: "PWS" },
      ];
    case "boxing":
    case "mma-ufc":
      return [
        ...defaultMarkets,
        { name: "Method of Victory", code: "MOV" },
        { name: "Round Betting", code: "RB" },
        { name: "Will the Fight Go the Distance", code: "WFGD" },
        { name: "Total Rounds", code: "TR" },
      ];
    case "cricket":
      return [
        ...defaultMarkets,
        { name: "Top Batsman", code: "TB" },
        { name: "Top Bowler", code: "TBO" },
        { name: "Total Runs", code: "TR" },
        { name: "Man of the Match", code: "MOM" },
      ];
    default:
      return defaultMarkets;
  }
}

// Generate UUID for client-side IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Parse blockchain transaction hash
export function parseTransactionHash(txHash: string): string {
  if (!txHash) return "";
  // Only show first and last 6 characters of hash
  return txHash.length > 12
    ? `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 6)}`
    : txHash;
}

// Shorten wallet address for display
export function shortenAddress(address?: string): string {
  if (!address) return "";
  return address.length > 12
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : address;
}

// Calculate odds from probabilities
export function probabilityToDecimalOdds(probability: number): number {
  if (!probability || probability <= 0 || probability >= 1) return 0;
  return Number((1 / probability).toFixed(2));
}

// Validate a bet before adding it to the slip
export function validateBet(bet: SelectedBet): { valid: boolean; message?: string } {
  if (!bet.eventId) {
    return { valid: false, message: "Invalid event" };
  }
  if (!bet.odds || bet.odds <= 1) {
    return { valid: false, message: "Invalid odds" };
  }
  if (!bet.stake || bet.stake <= 0) {
    return { valid: false, message: "Stake must be greater than 0" };
  }
  return { valid: true };
}

// Get default stake amount based on user preferences 
export function getDefaultStake(): number {
  return 10; // Default stake
}

// Get blockchain network fee percentage
export function getNetworkFeePercentage(): number {
  return 0.01; // 1% network fee
}

// Calculate blockchain transaction fees
export function calculateTransactionFees(amount: number): { 
  platformFee: number, 
  networkFee: number,
  totalFees: number 
} {
  const platformFeePercentage = 0; // No platform fee as per requirements
  const networkFeePercentage = getNetworkFeePercentage();
  
  const platformFee = amount * platformFeePercentage;
  const networkFee = amount * networkFeePercentage;
  
  return {
    platformFee,
    networkFee,
    totalFees: platformFee + networkFee,
  };
}

// Wallet types for UI display - as array for mapping
export const WALLET_TYPES = [
  { key: 'SUI', name: 'Sui Wallet' },
  { key: 'ETHOS', name: 'Ethos Wallet' },
  { key: 'MARTIAN', name: 'Martian Wallet' },
  { key: 'SUIET', name: 'Suiet Wallet' },
  { key: 'WEB3AUTH', name: 'Web3Auth' },
];