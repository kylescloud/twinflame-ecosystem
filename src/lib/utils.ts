import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function calculateHealthFactor(
  collateralValue: number,
  borrowValue: number,
  liquidationThreshold: number
): number {
  if (borrowValue === 0) return Infinity;
  return (collateralValue * liquidationThreshold) / borrowValue;
}

export function getHealthFactorColor(healthFactor: number): string {
  if (healthFactor >= 2) return 'text-green-500';
  if (healthFactor >= 1.5) return 'text-yellow-500';
  if (healthFactor >= 1.1) return 'text-orange-500';
  return 'text-red-500';
}

export function calculateAPY(interestRate: number, compoundFrequency: number = 365): number {
  return (Math.pow(1 + interestRate / compoundFrequency, compoundFrequency) - 1) * 100;
}

export function estimateEarnings(amount: number, apy: number, days: number): number {
  return amount * (apy / 100) * (days / 365);
}
