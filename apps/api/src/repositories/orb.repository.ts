import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/index.js';
import type { Orb, OrbRarity } from '@explobook/shared';

export interface OrbDoc {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  expeditionId: ObjectId;
  title: string;
  rarity: OrbRarity;
  theme: string;
  essenceQuote: string;
  colorHex: string;
  earnedAt: Date;
  createdAt: Date;
}

export class OrbRepository {
  private collectionName = 'orbs';

  async getCollection(): Promise<Collection<OrbDoc>> {
    const db = await getDatabase();
    return db.collection<OrbDoc>(this.collectionName);
  }

  async findById(id: string | ObjectId): Promise<OrbDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objId });
  }

  async findByUserId(userId: string | ObjectId): Promise<OrbDoc[]> {
    const collection = await this.getCollection();
    const objId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection.find({ userId: objId }).sort({ earnedAt: -1 }).toArray();
  }

  async create(data: {
    userId: string | ObjectId;
    bookId: string | ObjectId;
    expeditionId: string | ObjectId;
    title: string;
    rarity: OrbRarity;
    theme: string;
    essenceQuote: string;
    colorHex?: string;
  }): Promise<OrbDoc> {
    const collection = await this.getCollection();
    const now = new Date();
    const doc: OrbDoc = {
      userId: typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId,
      bookId: typeof data.bookId === 'string' ? new ObjectId(data.bookId) : data.bookId,
      expeditionId: typeof data.expeditionId === 'string' ? new ObjectId(data.expeditionId) : data.expeditionId,
      title: data.title,
      rarity: data.rarity,
      theme: data.theme,
      essenceQuote: data.essenceQuote,
      colorHex: data.colorHex || '#4a7c59',
      earnedAt: now,
      createdAt: now,
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ userId: 1, earnedAt: -1 });
    await collection.createIndex({ expeditionId: 1 }, { unique: true });
    await collection.createIndex({ bookId: 1 });
  }

  toDomain(doc: OrbDoc): Orb {
    return {
      id: doc._id!.toString(),
      userId: doc.userId.toString(),
      bookId: doc.bookId.toString(),
      expeditionId: doc.expeditionId.toString(),
      title: doc.title,
      rarity: doc.rarity,
      theme: doc.theme,
      essenceQuote: doc.essenceQuote,
      colorHex: doc.colorHex,
      earnedAt: doc.earnedAt.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    };
  }
}

export const orbRepository = new OrbRepository();
