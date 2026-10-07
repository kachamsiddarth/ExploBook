import type { OrbRarity } from '@explobook/shared';

export interface XPCalculationInput {
  baseType: 'READING_SESSION' | 'EXPEDITION';
  durationSeconds?: number;
  pagesRead?: number;
  reflectionLength?: number;
  isDetailedReflection?: boolean;
}

export class ProgressionService {
  /**
   * Deterministically calculates XP earned for a reading session.
   * Rule:
   * - 50 base XP
   * - +1 XP per 2 pages read
   * - +10 XP if thoughtful reflection included
   */
  calculateReadingSessionXP(input: { pagesRead?: number; reflectionLength?: number }): number {
    let xp = 50;
    if (input.pagesRead && input.pagesRead > 0) {
      xp += Math.min(100, Math.floor(input.pagesRead / 2));
    }
    if (input.reflectionLength && input.reflectionLength >= 20) {
      xp += 25;
    }
    return xp;
  }

  /**
   * Deterministically calculates XP earned for an expedition.
   * Rule:
   * - 100 base XP for stepping away and returning
   * - Duration bonus: +10 XP per 10 minutes (max 50)
   * - Reflection bonus: +25 XP if thoughtful reflection provided
   * - High observation bonus: +25 XP if observed details reported
   */
  calculateExpeditionXP(input: {
    durationMinutes?: number;
    reflectionLength?: number;
    observedCount?: number;
  }): number {
    let xp = 100;
    const minutes = input.durationMinutes || 20;
    xp += Math.min(50, Math.floor(minutes / 10) * 10);

    if (input.reflectionLength && input.reflectionLength >= 30) {
      xp += 25;
    }
    if (input.observedCount && input.observedCount >= 2) {
      xp += 25;
    }
    return xp;
  }

  /**
   * Deterministic Level Calculation:
   * Tiered thresholds:
   * Level 1: 0 - 199 XP
   * Level 2: 200 - 499 XP
   * Level 3: 500 - 899 XP
   * Level 4: 900 - 1399 XP
   * Level N: floor(sqrt(xp / 100)) + 1
   */
  calculateLevel(totalXP: number): number {
    if (totalXP < 200) return 1;
    if (totalXP < 500) return 2;
    if (totalXP < 900) return 3;
    if (totalXP < 1400) return 4;
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  /**
   * Deterministically calculates Grass Ratio:
   * Grass Ratio = Time Outside / Time Spent In Application
   * Note: In early sessions or if app time is small, clamp denominator to a min of 60 seconds.
   */
  calculateGrassRatio(totalOutdoorSeconds: number, totalReadingOrAppSeconds: number): number {
    const denom = Math.max(60, totalReadingOrAppSeconds);
    const ratio = totalOutdoorSeconds / denom;
    return Number(ratio.toFixed(2));
  }

  /**
   * Deterministically assigns Orb rarity based on reflection quality and streak.
   */
  determineOrbRarity(input: {
    reflectionLength: number;
    observationsCount: number;
    streak?: number;
  }): OrbRarity {
    const streak = input.streak || 0;
    if (input.reflectionLength > 150 && input.observationsCount >= 3 && streak >= 5) {
      return 'LEGENDARY';
    }
    if (input.reflectionLength > 100 && input.observationsCount >= 2) {
      return 'RARE';
    }
    if (input.reflectionLength > 50) {
      return 'UNCOMMON';
    }
    return 'COMMON';
  }

  /**
   * Selects an earthy/mineral hex color matching the orb theme.
   */
  getOrbColor(rarity: OrbRarity, theme?: string): string {
    const palette: Record<OrbRarity, string> = {
      COMMON: '#4a7c59',      // Earthy Forest Green
      UNCOMMON: '#3d7068',    // Deep Pine / Teal
      RARE: '#2b5876',        // Mineral Ocean Blue
      EPIC: '#6b4c9a',        // Twilight Amethyst
      LEGENDARY: '#b8860b',   // Ancient Golden Amber
    };
    return palette[rarity] || '#4a7c59';
  }
}

export const progressionService = new ProgressionService();
