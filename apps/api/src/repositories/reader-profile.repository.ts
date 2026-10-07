import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/index.js';
import type { ReaderDNA, ReaderStats } from '@explobook/shared';

export interface ReaderProfileDoc {
  _id?: ObjectId;
  userId: ObjectId;
  genres: string[];
  goals: string[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredLength: { minPages: number; maxPages: number };
  availableMinutesPerSession: number;
  language: string;
  dna: ReaderDNA;
  stats: ReaderStats;
  createdAt: Date;
  updatedAt: Date;
}

export class ReaderProfileRepository {
  private collectionName = 'readerProfiles';

  async getCollection(): Promise<Collection<ReaderProfileDoc>> {
    const db = await getDatabase();
    return db.collection<ReaderProfileDoc>(this.collectionName);
  }

  async findByUserId(userId: string | ObjectId): Promise<ReaderProfileDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection.findOne({ userId: objId });
  }

  async createDefault(userId: string | ObjectId): Promise<ReaderProfileDoc> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const now = new Date();

    const doc: ReaderProfileDoc = {
      userId: objId,
      genres: [],
      goals: ['read_more', 'touch_grass'],
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
        updatedAt: now,
      },
      stats: {
        booksCompleted: 0,
        totalReadingSeconds: 0,
        totalOutdoorSeconds: 0,
        averageRating: 0,
        currentStreak: 0,
        longestStreak: 0,
        xp: 0,
        level: 1,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async update(userId: string | ObjectId, update: Partial<ReaderProfileDoc>): Promise<ReaderProfileDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await collection.findOneAndUpdate(
      { userId: objId },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ userId: 1 }, { unique: true });
  }
}

export const readerProfileRepository = new ReaderProfileRepository();
