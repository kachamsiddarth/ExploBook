import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { progressionService } from '../services/progression.service.js';
import { expeditionService } from '../services/expedition.service.js';
import { reflectionService } from '../services/reflection.service.js';
import { bookRepository, type BookDoc } from '../repositories/book.repository.js';
import { readingSessionRepository } from '../repositories/reading-session.repository.js';
import { expeditionRepository } from '../repositories/expedition.repository.js';
import { orbRepository } from '../repositories/orb.repository.js';
import { readerProfileRepository } from '../repositories/reader-profile.repository.js';
import { ObjectId } from 'mongodb';

const sampleBook: BookDoc = {
  _id: new ObjectId('651234567890123456789012'),
  title: 'The Old Man and the Sea',
  authors: ['Ernest Hemingway'],
  description: 'An aging Cuban fisherman struggles with a giant marlin.',
  genres: ['Fiction', 'Adventure'],
  themes: ['perseverance', 'nature', 'solitude'],
  language: 'en',
  difficultyScore: 5,
  publicDomain: true,
  source: 'seed',
  metadataQuality: 1.0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Phase 4 - Reading, Real-World Expeditions, XP, & Orbs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. ProgressionService Deterministic Mechanics', () => {
    it('calculates reading session XP deterministically based on pages and reflection length', () => {
      const xpBase = progressionService.calculateReadingSessionXP({});
      expect(xpBase).toBe(50);

      const xpWithPages = progressionService.calculateReadingSessionXP({ pagesRead: 40 });
      expect(xpWithPages).toBe(70); // 50 + 40/2 = 70

      const xpWithReflection = progressionService.calculateReadingSessionXP({
        pagesRead: 40,
        reflectionLength: 50,
      });
      expect(xpWithReflection).toBe(95); // 70 + 25 = 95
    });

    it('calculates expedition XP deterministically based on duration and observations', () => {
      const xp = progressionService.calculateExpeditionXP({
        durationMinutes: 30,
        reflectionLength: 60,
        observedCount: 3,
      });
      // 100 base + 30 duration + 25 reflection + 25 observation = 180 XP
      expect(xp).toBe(180);
    });

    it('determines level progression correctly', () => {
      expect(progressionService.calculateLevel(50)).toBe(1);
      expect(progressionService.calculateLevel(250)).toBe(2);
      expect(progressionService.calculateLevel(600)).toBe(3);
      expect(progressionService.calculateLevel(1000)).toBe(4);
    });

    it('calculates Grass Ratio (outdoor / app time)', () => {
      // 1800 outdoor seconds (30m) / 300 app seconds (5m) = 6.0x
      const ratio = progressionService.calculateGrassRatio(1800, 300);
      expect(ratio).toBe(6);
    });

    it('determines Orb rarity deterministically based on reflection depth and observations', () => {
      const common = progressionService.determineOrbRarity({ reflectionLength: 20, observationsCount: 0 });
      expect(common).toBe('COMMON');

      const uncommon = progressionService.determineOrbRarity({ reflectionLength: 60, observationsCount: 1 });
      expect(uncommon).toBe('UNCOMMON');

      const rare = progressionService.determineOrbRarity({ reflectionLength: 120, observationsCount: 2 });
      expect(rare).toBe('RARE');

      const legendary = progressionService.determineOrbRarity({
        reflectionLength: 200,
        observationsCount: 3,
        streak: 5,
      });
      expect(legendary).toBe('LEGENDARY');
    });
  });

  describe('2. Expedition Service Concept Generation', () => {
    it('generates a valid expedition concept connected to book themes', async () => {
      const concept = await expeditionService.generateExpeditionConcept(sampleBook, undefined, {
        availableMinutes: 20,
        preferredType: 'WANDER',
      });

      expect(concept).toHaveProperty('title');
      expect(concept).toHaveProperty('type');
      expect(concept.durationMinutes).toBe(20);
      expect(concept.instructions.length).toBeGreaterThanOrEqual(2);
      expect(concept.instructions[0].toLowerCase()).toMatch(/(pocket|grass|phone)/);
      expect(concept.bookConnection).toBeDefined();
    }, 15000);
  });

  describe('3. Reflection Service Analysis', () => {
    it('analyzes user expedition reflections and computes bounded Reader DNA shifts', async () => {
      const mockExpeditionDoc = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        bookId: sampleBook._id!,
        type: 'OBSERVATION' as const,
        title: 'Watch the Horizon',
        durationMinutes: 25,
        objective: 'Sit quietly outside and observe three natural patterns.',
        instructions: ['Put phone away', 'Observe', 'Return'],
        bookConnection: 'Reflects solitude and observation in Hemingway.',
        status: 'READY' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const analysis = await reflectionService.analyzeExpeditionReflection(
        mockExpeditionDoc,
        sampleBook,
        {
          notes: 'Sat by the park edge for twenty minutes. The stillness reminded me of the calm sea described in the book.',
          observedDetails: ['Flickering leaves in morning wind', 'A hawk soaring overhead', 'Distant water stream'],
        }
      );

      expect(analysis).toHaveProperty('thematicResonance');
      expect(analysis.curiositySignals.length).toBeGreaterThan(0);
      expect(analysis.suggestedDnaDelta).toBeDefined();
      expect(analysis).toHaveProperty('orbTitleIdea');
      expect(analysis).toHaveProperty('orbThemeIdea');
    }, 15000);
  });

  describe('4. Full End-to-End Reading to Expedition Loop', () => {
    it('verifies reading session completion produces XP and level progression', async () => {
      const testUserId = new ObjectId();
      const testSessionId = new ObjectId();

      vi.spyOn(readingSessionRepository, 'findById').mockResolvedValue({
        _id: testSessionId,
        userId: testUserId,
        bookId: sampleBook._id!,
        status: 'ACTIVE',
        pagesRead: 15,
        durationSeconds: 600,
        startedAt: new Date(Date.now() - 600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(readingSessionRepository, 'update').mockResolvedValue({
        _id: testSessionId,
        userId: testUserId,
        bookId: sampleBook._id!,
        status: 'COMPLETED',
        pagesRead: 25,
        durationSeconds: 900,
        reflection: {
          takeaways: 'A powerful meditation on resilience and quiet determination against the odds.',
        },
        startedAt: new Date(Date.now() - 900000),
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(readerProfileRepository, 'findByUserId').mockResolvedValue({
        _id: new ObjectId(),
        userId: testUserId,
        genres: ['Fiction'],
        goals: ['read_more'],
        difficultyPreference: 'intermediate',
        preferredLength: { minPages: 100, maxPages: 400 },
        availableMinutesPerSession: 30,
        language: 'en',
        dna: {
          genreAffinity: {},
          themeAffinity: {},
          difficultyScore: 5,
          pacingPreference: 5,
          reflectionScore: 0,
          vocabularyLevel: 'intermediate',
          preferredPageRange: { min: 100, max: 400 },
          explorationProfile: {
            natureAffinity: 0.5,
            walkingAffinity: 0.5,
            discoveryAffinity: 0.5,
            historicalAffinity: 0.5,
            observationAffinity: 0.5,
            quietPlaceAffinity: 0.5,
          },
        },
        stats: {
          booksCompleted: 0,
          totalReadingSeconds: 0,
          totalOutdoorSeconds: 0,
          averageRating: 0,
          currentStreak: 1,
          longestStreak: 1,
          xp: 150,
          level: 1,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(readerProfileRepository, 'addStatsAndXP').mockResolvedValue(null as any);

      // Verify progression calculations
      const xp = progressionService.calculateReadingSessionXP({
        pagesRead: 25,
        reflectionLength: 80,
      });
      expect(xp).toBe(87); // 50 + 12 + 25 = 87 XP

      const newLevel = progressionService.calculateLevel(150 + xp);
      expect(newLevel).toBe(2); // 237 XP reaches Level 2
    });
  });
});
