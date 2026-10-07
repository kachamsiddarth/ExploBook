import { bookRepository } from '../repositories/book.repository.js';
import { SEED_BOOKS } from './seed-books.data.js';
import { recommendationOrchestrator } from '../services/recommendation.orchestrator.js';

export async function seedBookCatalogue(): Promise<{ seeded: number; total: number }> {
  const existingCount = await bookRepository.count();

  if (existingCount > 0) {
    console.log(`[Seed]: Catalogue already contains ${existingCount} books. Skipping seed.`);
    // Lazily embed any existing books that may lack embeddings
    recommendationOrchestrator.ensureCatalogueEmbeddings(12).catch(() => {});
    return { seeded: 0, total: existingCount };
  }

  console.log(`[Seed]: Ingesting ${SEED_BOOKS.length} curated seed books...`);
  const insertedCount = await bookRepository.insertMany(SEED_BOOKS);
  await bookRepository.ensureIndexes();
  console.log(`[Seed]: Successfully seeded ${insertedCount} books and initialized indexes.`);

  // Trigger non-blocking embedding generation for newly ingested books
  recommendationOrchestrator.ensureCatalogueEmbeddings(12).catch(() => {});

  return { seeded: insertedCount, total: insertedCount };
}
