import { executeRecommendationWorkflow } from '../services/mastra.js';
import { getDatabase } from '../database/index.js';

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await getDatabase();
  console.log('MongoDB Connected.\n');

  console.log('=== TEST 1: Initial Recommendation (Mastra + Gemma 3 4B) ===');
  const start1 = Date.now();
  const res1 = await executeRecommendationWorkflow({
    query: 'nature exploration and solitude',
    limit: 1,
  });
  const dur1 = ((Date.now() - start1) / 1000).toFixed(2);
  const book1 = res1.result.recommendations[0];

  console.log(`Duration: ${dur1}s`);
  console.log(`gemmaStatus: ${res1.result.gemmaStatus}`);
  console.log(`retrievalMethod: ${res1.result.retrievalMethod}`);
  console.log(`Model Used: ${res1.result.modelUsed}`);
  console.log(`Book 1: "${book1.book.title}" (ID: ${book1.book.id}) by ${book1.book.authors.join(', ')}`);
  console.log(`Reasoning:`);
  console.log(`  Explanation: ${book1.reasoning.explanation}`);
  console.log(`  Touch Grass: ${book1.reasoning.touchGrassReason}`);
  console.log(`  Atmosphere:  ${book1.reasoning.suggestedAtmosphere}\n`);

  console.log('=== TEST 2: "Try Another" with excludeBookIds: [book1.id] ===');
  const start2 = Date.now();
  const res2 = await executeRecommendationWorkflow({
    query: 'nature exploration and solitude',
    limit: 1,
    excludeBookIds: [book1.book.id],
  });
  const dur2 = ((Date.now() - start2) / 1000).toFixed(2);
  const book2 = res2.result.recommendations[0];

  console.log(`Duration: ${dur2}s`);
  console.log(`gemmaStatus: ${res2.result.gemmaStatus}`);
  console.log(`Book 2: "${book2.book.title}" (ID: ${book2.book.id}) by ${book2.book.authors.join(', ')}`);
  console.log(`Different from Book 1? ${book2.book.id !== book1.book.id ? 'YES ✅' : 'NO ❌'}`);
  console.log(`Reasoning:`);
  console.log(`  Explanation: ${book2.reasoning.explanation}`);
  console.log(`  Touch Grass: ${book2.reasoning.touchGrassReason}`);
  console.log(`  Atmosphere:  ${book2.reasoning.suggestedAtmosphere}\n`);

  console.log('=== TEST 3: Third Recommendation with excludeBookIds: [book1.id, book2.id] ===');
  const start3 = Date.now();
  const res3 = await executeRecommendationWorkflow({
    query: 'nature exploration and solitude',
    limit: 1,
    excludeBookIds: [book1.book.id, book2.book.id],
  });
  const dur3 = ((Date.now() - start3) / 1000).toFixed(2);
  const book3 = res3.result.recommendations[0];

  console.log(`Duration: ${dur3}s`);
  console.log(`gemmaStatus: ${res3.result.gemmaStatus}`);
  console.log(`Book 3: "${book3.book.title}" (ID: ${book3.book.id}) by ${book3.book.authors.join(', ')}`);
  console.log(`Different from Book 1 and Book 2? ${book3.book.id !== book1.book.id && book3.book.id !== book2.book.id ? 'YES ✅' : 'NO ❌'}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
