import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/index.js';
import type {
  Expedition,
  ExpeditionType,
  ExpeditionStatus,
  ExpeditionPlace,
  ExpeditionReflection,
  ExpeditionReflectionAnalysis,
} from '@explobook/shared';

export interface ExpeditionDoc {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  readingSessionId?: ObjectId;
  type: ExpeditionType;
  title: string;
  durationMinutes: number;
  objective: string;
  instructions: string[];
  bookConnection: string;
  place?: ExpeditionPlace;
  status: ExpeditionStatus;
  reflection?: ExpeditionReflection;
  reflectionAnalysis?: ExpeditionReflectionAnalysis;
  xpAwarded?: number;
  orbId?: ObjectId;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpeditionRepository {
  private collectionName = 'expeditions';

  async getCollection(): Promise<Collection<ExpeditionDoc>> {
    const db = await getDatabase();
    return db.collection<ExpeditionDoc>(this.collectionName);
  }

  async findById(id: string | ObjectId): Promise<ExpeditionDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objId });
  }

  async findCurrentByUserId(userId: string | ObjectId): Promise<ExpeditionDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection.findOne({
      userId: objId,
      status: { $in: ['GENERATED', 'READY', 'STARTED', 'AWAY', 'RETURNED', 'REFLECTION_PENDING'] },
    });
  }

  async findByUserId(userId: string | ObjectId, limit = 20): Promise<ExpeditionDoc[]> {
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
    readingSessionId?: string | ObjectId;
    type: ExpeditionType;
    title: string;
    durationMinutes: number;
    objective: string;
    instructions: string[];
    bookConnection: string;
    place?: ExpeditionPlace;
  }): Promise<ExpeditionDoc> {
    const collection = await this.getCollection();
    const now = new Date();
    const doc: ExpeditionDoc = {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      bookId: typeof data.bookId === 'string' ? new ObjectId(data.bookId) : data.bookId,
      readingSessionId: data.readingSessionId
        ? typeof data.readingSessionId === 'string'
          ? new ObjectId(data.readingSessionId)
          : data.readingSessionId
        : undefined,
      type: data.type,
      title: data.title,
      durationMinutes: data.durationMinutes,
      objective: data.objective,
      instructions: data.instructions,
      bookConnection: data.bookConnection,
      place: data.place,
      status: 'READY',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async update(
    id: string | ObjectId,
    update: Partial<Omit<ExpeditionDoc, '_id' | 'userId' | 'createdAt'>>
  ): Promise<ExpeditionDoc | null> {
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
    await collection.createIndex({ userId: 1, bookId: 1 });
  }

  toDomain(doc: ExpeditionDoc): Expedition {
    return {
      id: doc._id!.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      readingSessionId: doc.readingSessionId?.toString(),
      type: doc.type,
      title: doc.title,
      durationMinutes: doc.durationMinutes,
      objective: doc.objective,
      instructions: doc.instructions,
      bookConnection: doc.bookConnection,
      place: doc.place,
      status: doc.status,
      reflection: doc.reflection,
      reflectionAnalysis: doc.reflectionAnalysis,
      xpAwarded: doc.xpAwarded,
      orbId: doc.orbId?.toString(),
      startedAt: doc.startedAt?.toISOString(),
      completedAt: doc.completedAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const expeditionRepository = new ExpeditionRepository();
