import { createHash } from 'node:crypto';
import { getDatabase } from '../../database/index.js';
import type { Collection, ObjectId } from 'mongodb';

export interface VoiceGenerationDoc {
  _id?: ObjectId;
  cacheKey: string; // SHA-256(voiceId + modelId + script)
  voiceId: string;
  modelId: string;
  script: string;
  /** Base64-encoded MP3 audio data */
  audioBase64: string;
  contentType: 'audio/mpeg';
  createdAt: Date;
}

export class VoiceCacheService {
  private collectionName = 'voiceGenerations';

  async getCollection(): Promise<Collection<VoiceGenerationDoc>> {
    const db = await getDatabase();
    return db.collection<VoiceGenerationDoc>(this.collectionName);
  }

  /**
   * Generates a SHA-256 cache key from the voice parameters.
   * Matches the spec: sha256(voiceId + modelId + script)
   */
  generateCacheKey(voiceId: string, modelId: string, script: string): string {
    return createHash('sha256')
      .update(`${voiceId}::${modelId}::${script}`)
      .digest('hex');
  }

  /**
   * Looks up a cached voice generation.
   * Returns null on a cache miss.
   */
  async lookup(cacheKey: string): Promise<VoiceGenerationDoc | null> {
    const collection = await this.getCollection();
    return collection.findOne({ cacheKey });
  }

  /**
   * Stores a new voice generation in the cache.
   */
  async store(data: {
    voiceId: string;
    modelId: string;
    script: string;
    audioBase64: string;
  }): Promise<VoiceGenerationDoc> {
    const collection = await this.getCollection();
    const cacheKey = this.generateCacheKey(data.voiceId, data.modelId, data.script);

    const doc: VoiceGenerationDoc = {
      cacheKey,
      voiceId: data.voiceId,
      modelId: data.modelId,
      script: data.script,
      audioBase64: data.audioBase64,
      contentType: 'audio/mpeg',
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();
    await collection.createIndex({ cacheKey: 1 }, { unique: true });
  }
}

export const voiceCacheService = new VoiceCacheService();
