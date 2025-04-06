import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "$SUIBETS") {
  return `${value.toLocaleString()} ${currency}`;
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
