import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { connectMock, closeMock, dbMock, mongoClientMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  closeMock: vi.fn(),
  dbMock: vi.fn(),
  mongoClientMock: vi.fn(),
}));

vi.mock('mongodb', () => ({
  MongoClient: mongoClientMock,
}));

import { config } from '../config/index.js';
import { closeDatabase, getDatabase } from '../database/index.js';

describe('MongoDB connection lifecycle', () => {
  beforeEach(async () => {
    await closeDatabase();
    vi.clearAllMocks();
    config.mongodb!.uri = 'mongodb://unit-test.invalid/explobook';
    dbMock.mockReturnValue({ database: 'explobook' });
    mongoClientMock.mockImplementation(() => ({
      connect: connectMock,
      close: closeMock,
      db: dbMock,
    }));
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('shares an in-flight connection and caches the database after connecting', async () => {
    let finishConnect!: () => void;
    connectMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishConnect = resolve;
        })
    );

    const first = getDatabase();
    const second = getDatabase();
    expect(mongoClientMock).toHaveBeenCalledTimes(1);

    finishConnect();
    const [firstDatabase, secondDatabase] = await Promise.all([first, second]);

    expect(firstDatabase).toBe(secondDatabase);
    expect(dbMock).toHaveBeenCalledTimes(1);
    expect(await getDatabase()).toBe(firstDatabase);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh connection attempt after a failed handshake', async () => {
    connectMock
      .mockRejectedValueOnce(new Error('Atlas TLS handshake failed'))
      .mockResolvedValueOnce(undefined);

    await expect(getDatabase()).rejects.toThrow('Atlas TLS handshake failed');
    await expect(getDatabase()).resolves.toEqual({ database: 'explobook' });

    expect(mongoClientMock).toHaveBeenCalledTimes(2);
    expect(connectMock).toHaveBeenCalledTimes(2);
  });
});
