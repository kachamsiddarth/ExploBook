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
  excludeBookIds?: string[];
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

    if (options.excludeBookIds && options.excludeBookIds.length > 0) {
      const validObjIds = options.excludeBookIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (validObjIds.length > 0) {
        query._id = { $nin: validObjIds };
      }
    }

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

  async updateEmbedding(
    id: ObjectId | string,
    embedding: number[],
    model: string,
    version = '1.0'
  ): Promise<boolean> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await collection.updateOne(
      { _id: objId },
      {
        $set: {
          embedding,
          embeddingModel: model,
          embeddingVersion: version,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }

  async findMissingEmbeddings(limit = 50): Promise<BookDoc[]> {
    const collection = await this.getCollection();
    return collection
      .find({
        $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
      })
      .limit(limit)
      .toArray();
  }

  /**
   * Performs vector similarity retrieval.
   * If Atlas Search Index is present, runs $vectorSearch.
   * If Atlas vector index is unavailable or unconfigured, falls back to in-memory cosine comparison.
   * Returns candidates along with the exact retrieval method used.
   */
  async vectorSearch(
    queryVector: number[],
    options: {
      limit?: number;
      minScore?: number;
      filter?: Filter<BookDoc>;
      excludeBookIds?: string[];
    } = {}
  ): Promise<{ results: Array<{ book: BookDoc; score: number }>; method: 'atlas_vector_search' | 'in_memory_cosine_fallback' }> {
    const collection = await this.getCollection();
    const limit = options.limit ?? 5;
    const excludedObjIds = (options.excludeBookIds || [])
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    try {
      const vectorSearchStage: Record<string, unknown> = {
        index: 'vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: (limit + excludedObjIds.length) * 10,
        limit: limit + excludedObjIds.length,
      };

      if (options.filter && Object.keys(options.filter).length > 0) {
        vectorSearchStage.filter = options.filter;
      }

      const matchStage: Record<string, unknown> = {};
      if (excludedObjIds.length > 0) {
        matchStage._id = { $nin: excludedObjIds };
      }

      const pipeline: Record<string, unknown>[] = [
        {
          $vectorSearch: vectorSearchStage,
        },
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $limit: limit,
        },
        {
          $project: {
            title: 1,
            subtitle: 1,
            authors: 1,
            description: 1,
            genres: 1,
            themes: 1,
            language: 1,
            pageCount: 1,
            publicationYear: 1,
            difficultyScore: 1,
            publicDomain: 1,
            coverImageUrl: 1,
            source: 1,
            metadataQuality: 1,
            externalIds: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ];

      const results = await collection.aggregate<BookDoc & { score: number }>(pipeline).toArray();
      if (results.length > 0) {
        return {
          results: results.map((r) => ({
            book: r,
            score: r.score ?? 1.0,
          })),
          method: 'atlas_vector_search',
        };
      }
    } catch (atlasErr) {
      // Atlas $vectorSearch index may not be configured in local test or unindexed cluster
      console.warn('[BookRepository]: Atlas $vectorSearch failed or unindexed, utilizing fallback.');
    }

    // In-memory cosine fallback (isolated for dev/offline/test scenarios)
    const fallbackFilter: Filter<BookDoc> = {
      embedding: { $exists: true, $ne: [] },
      ...(options.filter || {}),
    };
    if (excludedObjIds.length > 0) {
      fallbackFilter._id = { $nin: excludedObjIds };
    }

    const embeddedBooks = await collection
      .find(fallbackFilter)
      .limit(100)
      .toArray();

    if (embeddedBooks.length === 0) {
      return { results: [], method: 'in_memory_cosine_fallback' };
    }

    const scored = embeddedBooks
      .map((book) => {
        const score = cosineSimilarity(queryVector, book.embedding || []);
        return { book, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { results: scored, method: 'in_memory_cosine_fallback' };
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ genres: 1 });
    await collection.createIndex({ difficultyScore: 1 });
    await collection.createIndex({ authors: 1 });
    await collection.createIndex({ title: 'text', description: 'text' });

    try {
      const existingSearchIndexes = await collection.listSearchIndexes().toArray();
      const hasVectorIndex = existingSearchIndexes.some((idx) => idx.name === 'vector_index');
      if (!hasVectorIndex) {
        await collection.createSearchIndex({
          name: 'vector_index',
          type: 'vectorSearch',
          definition: {
            fields: [
              {
                type: 'vector',
                path: 'embedding',
                numDimensions: 768,
                similarity: 'cosine',
              },
            ],
          },
        });
        console.log('[BookRepository]: Created Atlas Vector Search index: vector_index');
      }
    } catch {
      // listSearchIndexes/createSearchIndex not supported on local standalone mongodb; safe to ignore
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const bookRepository = new BookRepository();
