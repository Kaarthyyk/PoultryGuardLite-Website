import type { WeeklyEntry, Sale } from '@/types/models';

export function calculateTotalMortality(entries: WeeklyEntry[]): number {
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + (entry.mortalityCount || 0), 0);
}

export function calculateTotalBirdsSold(sales: Sale[]): number {
  if (!sales || sales.length === 0) return 0;
  return sales.reduce((sum, sale) => sum + (sale.birdsSold || 0), 0);
}

export function calculateRemainingBirds(
  initialBirds: number,
  totalMortality: number,
  totalBirdsSold: number
): number {
  const remaining = (initialBirds || 0) - (totalMortality || 0) - (totalBirdsSold || 0);
  return Math.max(0, remaining); // Prevent negative numbers just in case
}

export function calculateMortalityPercent(
  initialBirds: number,
  totalMortality: number
): string {
  if (!initialBirds || initialBirds === 0) return '0.0';
  const percent = (totalMortality / initialBirds) * 100;
  return percent.toFixed(1);
}

export function calculateSurvivalRate(
  initialBirds: number,
  remainingBirds: number
): string {
  if (!initialBirds || initialBirds === 0) return '0.0';
  const percent = (remainingBirds / initialBirds) * 100;
  return percent.toFixed(1);
}

export function calculateTotalRevenue(sales: Sale[]): number {
  if (!sales || sales.length === 0) return 0;
  return sales.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
}

export function calculateAverageBirdWeight(entries: WeeklyEntry[]): number {
  if (!entries || entries.length === 0) return 0;
  // A simple average of the entries' average weights
  const totalWeight = entries.reduce((sum, entry) => sum + (entry.averageWeightKg || 0), 0);
  const entriesWithWeight = entries.filter(e => e.averageWeightKg > 0).length;
  if (entriesWithWeight === 0) return 0;
  return totalWeight / entriesWithWeight;
}
