import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database/index.js';

export interface UserDoc {
  _id?: ObjectId;
  clerkUserId: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  private collectionName = 'users';

  async getCollection(): Promise<Collection<UserDoc>> {
    const db = await getDatabase();
    return db.collection<UserDoc>(this.collectionName);
  }

  async findByClerkUserId(clerkUserId: string): Promise<UserDoc | null> {
    const collection = await this.getCollection();
    return collection.findOne({ clerkUserId });
  }

  async findById(id: string | ObjectId): Promise<UserDoc | null> {
    const collection = await this.getCollection();
    const objId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objId });
  }

  async create(data: { clerkUserId: string; email: string; displayName: string }): Promise<UserDoc> {
    const collection = await this.getCollection();
    const now = new Date();
    const doc: UserDoc = {
      clerkUserId: data.clerkUserId,
      email: data.email,
      displayName: data.displayName,
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ clerkUserId: 1 }, { unique: true });
    await collection.createIndex({ email: 1 });
  }
}

export const userRepository = new UserRepository();
