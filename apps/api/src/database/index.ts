import { MongoClient, Db } from 'mongodb';
import { config } from '../config/index.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

export async function getDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  const uri = config.mongodb?.uri;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in configuration.');
  }

  if (!connectionPromise) {
    const pendingClient = new MongoClient(uri);
    connectionPromise = pendingClient.connect().then(
      () => {
        client = pendingClient;
        console.log('[MongoDB]: Connected successfully to MongoDB Atlas.');
        return pendingClient;
      },
      (error: unknown) => {
        connectionPromise = null;
        throw error;
      }
    );
  }

  const connectedClient = await connectionPromise;
  if (!dbInstance) {
    const dbName = config.mongodb?.dbName || 'explobook';
    dbInstance = connectedClient.db(dbName);
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    connectionPromise = null;
    console.log('[MongoDB]: Connection closed.');
  }
}

export function isDatabaseConnected(): boolean {
  return dbInstance !== null;
}
