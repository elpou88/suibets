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
  return stake * odds;
}

export const WALLET_TYPES = [
  { id: 'sui', name: 'Sui Wallet', color: 'bg-blue-500' },
  { id: 'suiet', name: 'Suiet Wallet', color: 'bg-purple-500' },
  { id: 'nightly', name: 'Nightly Wallet', color: 'bg-indigo-500' },
  { id: 'walletconnect', name: 'Wallet Connect', color: 'bg-green-500' }
];
