import { MongoClient, Db } from 'mongodb';
import { config } from '../config/index.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function getDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  const uri = config.mongodb?.uri;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in configuration.');
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log('[MongoDB]: Connected successfully to MongoDB Atlas.');
  }

  const dbName = config.mongodb?.dbName || 'explobook';
  dbInstance = client.db(dbName);
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('[MongoDB]: Connection closed.');
  }
}

export function isDatabaseConnected(): boolean {
  return dbInstance !== null;
}
