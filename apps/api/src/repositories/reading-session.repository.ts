import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/index.js';
import type { ReadingSession, ReadingSessionStatus, ReadingReflection } from '@explobook/shared';

export interface ReadingSessionDoc {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  status: ReadingSessionStatus;
  pagesRead: number;
  durationSeconds: number;
  reflection?: ReadingReflection;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ReadingSessionRepository {
  private collectionName = 'reading_sessions';

  async getCollection(): Promise<Collection<ReadingSessionDoc>> {
    const db = await getDatabase();
    return db.collection<ReadingSessionDoc>(this.collectionName);
  }

  async findById(id: string | ObjectId): Promise<ReadingSessionDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objId });
  }

  async findActiveByUserId(userId: string | ObjectId): Promise<ReadingSessionDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection.findOne({
      userId: objId,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    });
  }

  async findByUserId(userId: string | ObjectId, limit = 20): Promise<ReadingSessionDoc[]> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection
      .find({ userId: objId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async create(data: {
    userId: string | ObjectId;
    bookId: string | ObjectId;
    pagesRead?: number;
  }): Promise<ReadingSessionDoc> {
    const collection = await this.getCollection();
    const now = new Date();
    const doc: ReadingSessionDoc = {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      bookId: typeof data.bookId === 'string' ? new ObjectId(data.bookId) : data.bookId,
      status: 'ACTIVE',
      pagesRead: data.pagesRead || 0,
      durationSeconds: 0,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async update(
    id: string | ObjectId,
    update: Partial<Omit<ReadingSessionDoc, '_id' | 'userId' | 'createdAt'>>
  ): Promise<ReadingSessionDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOneAndUpdate(
      { _id: objId },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ userId: 1, createdAt: -1 });
    await collection.createIndex({ userId: 1, status: 1 });
    await collection.createIndex({ bookId: 1 });
  }

  toDomain(doc: ReadingSessionDoc): ReadingSession {
    return {
      id: doc._id!.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      status: doc.status,
      pagesRead: doc.pagesRead,
      durationSeconds: doc.durationSeconds,
      reflection: doc.reflection,
      startedAt: doc.startedAt.toISOString(),
      pausedAt: doc.pausedAt?.toISOString(),
      completedAt: doc.completedAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const readingSessionRepository = new ReadingSessionRepository();
