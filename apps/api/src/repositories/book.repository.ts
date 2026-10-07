import { Collection, ObjectId, Filter } from 'mongodb';
import { getDatabase } from '../database/index.js';
import type { BookExternalIds } from '@explobook/shared';

export interface BookDoc {
  _id?: ObjectId;
  title: string;
  subtitle?: string;
  authors: string[];
  description: string;
  genres: string[];
  themes: string[];
  language: string;
  pageCount?: number;
  publicationYear?: number;
  difficultyScore: number;
  publicDomain: boolean;
  coverImageUrl?: string;
  source: 'seed' | 'openlibrary' | 'googlebooks' | 'manual' | 'other';
  metadataQuality: number;
  externalIds?: BookExternalIds;
  embedding?: number[];
  embeddingModel?: string;
  embeddingVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookFilterOptions {
  q?: string;
  genre?: string;
  difficulty?: number;
  minPages?: number;
  maxPages?: number;
  skip?: number;
  limit?: number;
}

export class BookRepository {
  private collectionName = 'books';

  async getCollection(): Promise<Collection<BookDoc>> {
    const db = await getDatabase();
    return db.collection<BookDoc>(this.collectionName);
  }

  async findById(id: string | ObjectId): Promise<BookDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objId });
  }

  async find(options: BookFilterOptions = {}): Promise<{ books: BookDoc[]; total: number }> {
    const collection = await this.getCollection();
    const query: Filter<BookDoc> = {};

    if (options.genre) {
      query.genres = { $in: [new RegExp(options.genre, 'i')] };
    }

    if (options.difficulty) {
      query.difficultyScore = options.difficulty;
    }

    if (options.minPages || options.maxPages) {
      query.pageCount = {};
      if (options.minPages) query.pageCount.$gte = options.minPages;
      if (options.maxPages) query.pageCount.$lte = options.maxPages;
    }

    if (options.q) {
      const regex = new RegExp(options.q, 'i');
      query.$or = [
        { title: regex },
        { authors: { $in: [regex] } },
        { description: regex },
        { themes: { $in: [regex] } },
      ];
    }

    const skip = options.skip ?? 0;
    const limit = options.limit ?? 20;

    const [books, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);

    return { books, total };
  }

  async insertMany(books: Omit<BookDoc, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const collection = await this.getCollection();
    const now = new Date();
    const docs = books.map((b) => ({
      ...b,
      createdAt: now,
      updatedAt: now,
    }));
    const result = await collection.insertMany(docs);
    return result.insertedCount;
  }

  async count(): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments();
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ genres: 1 });
    await collection.createIndex({ difficultyScore: 1 });
    await collection.createIndex({ authors: 1 });
    await collection.createIndex({ title: 'text', description: 'text' });
  }
}

export const bookRepository = new BookRepository();
