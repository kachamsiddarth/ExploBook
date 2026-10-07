import { bookRepository, type BookDoc } from '../repositories/book.repository.js';
import { embeddingService } from './embedding.service.js';
import { gemmaService } from './gemma.service.js';
import type { ReaderProfile, BookRecommendationItem, RecommendationResponse } from '@explobook/shared';

export interface GetRecommendationsOptions {
  query?: string;
  genre?: string;
  limit?: number;
  readerProfile?: Partial<ReaderProfile>;
}

export class RecommendationOrchestrator {
  /**
   * Main recommendation workflow:
   * 1. Check if books have embeddings; embed missing if Ollama is accessible.
   * 2. Build query vector from query text or reader preference text.
   * 3. Perform vector retrieval against book repository ($vectorSearch or cosine fallback).
   * 4. If vector retrieval yields insufficient candidates, supplement with genre/catalogue fallback.
   * 5. Ground top candidates using Gemma 3 4B reasoning emphasizing "Touch Grass".
   * 6. Format and return typed recommendations.
   */
  async getRecommendations(options: GetRecommendationsOptions): Promise<RecommendationResponse> {
    const limit = Math.min(10, Math.max(1, options.limit ?? 3));
    const queryText = options.query?.trim();

    let candidateScored: Array<{ book: BookDoc; score: number }> = [];
    let source: 'vector_search' | 'reader_dna' | 'catalogue_fallback' = 'catalogue_fallback';
    let retrievalMethod: 'atlas_vector_search' | 'in_memory_cosine_fallback' | 'database_filter_fallback' =
      'database_filter_fallback';
    let gemmaStatus: 'gemma_grounded' | 'fallback_offline' = 'fallback_offline';

    // 1. Ensure seed books have embeddings populated if embedding model is ready
    await this.ensureCatalogueEmbeddings(5);

    // 2. Vector search via query text or Reader DNA
    let searchPrompt = queryText;
    if (!searchPrompt && options.readerProfile) {
      searchPrompt = embeddingService.buildReaderPreferenceText(options.readerProfile);
    }

    if (searchPrompt) {
      const embeddingResult = await embeddingService.generateEmbedding(searchPrompt);
      if (embeddingResult?.embedding) {
        try {
          const filter = options.genre ? { genres: { $in: [new RegExp(options.genre, 'i')] } } : undefined;
          const vectorSearchResult = await bookRepository.vectorSearch(embeddingResult.embedding, {
            limit,
            filter,
          });

          if (vectorSearchResult.results.length > 0) {
            candidateScored = vectorSearchResult.results;
            source = queryText ? 'vector_search' : 'reader_dna';
            retrievalMethod = vectorSearchResult.method;
          }
        } catch {
          // Vector search unavailable; fall through to catalogue search
        }
      }
    }

    // 3. Fallback to catalogue search if vector candidates are empty
    if (candidateScored.length === 0) {
      try {
        const { books } = await bookRepository.find({
          genre: options.genre,
          q: queryText,
          limit,
        });

        candidateScored = books.map((b) => ({ book: b, score: 0.8 }));
        source = 'catalogue_fallback';
        retrievalMethod = 'database_filter_fallback';
      } catch (dbErr) {
        console.warn('[RecommendationOrchestrator]: DB unavailable during catalogue fallback.');
      }
    }

    // 4. Ground each book with Gemma 3 4B and verify it strictly exists in catalogue
    const recommendationItems: BookRecommendationItem[] = [];

    for (const item of candidateScored.slice(0, limit)) {
      // Verification: Book must be genuine from catalogue with non-empty ID
      if (!item.book._id) {
        continue;
      }

      const { reasoning, status } = await gemmaService.generateGroundedReasoning(
        item.book,
        options.readerProfile,
        options.query
      );

      if (status === 'gemma_grounded') {
        gemmaStatus = 'gemma_grounded';
      }

      recommendationItems.push({
        book: {
          id: item.book._id.toString(),
          title: item.book.title,
          subtitle: item.book.subtitle,
          authors: item.book.authors,
          description: item.book.description,
          genres: item.book.genres,
          themes: item.book.themes,
          language: item.book.language,
          pageCount: item.book.pageCount,
          publicationYear: item.book.publicationYear,
          difficultyScore: item.book.difficultyScore,
          publicDomain: item.book.publicDomain,
          coverImageUrl: item.book.coverImageUrl,
          source: item.book.source,
          metadataQuality: item.book.metadataQuality,
          externalIds: item.book.externalIds,
        },
        score: item.score,
        reasoning,
      });
    }

    return {
      recommendations: recommendationItems,
      source,
      retrievalMethod,
      gemmaStatus,
      modelUsed: 'gemma3:4b-it-q4_K_M',
    };
  }

  /**
   * Lazily computes embeddings for catalogue books that lack vectors.
   */
  async ensureCatalogueEmbeddings(batchSize = 5): Promise<number> {
    try {
      const missing = await bookRepository.findMissingEmbeddings(batchSize);
      if (missing.length === 0) return 0;

      let embeddedCount = 0;
      for (const book of missing) {
        if (!book._id) continue;
        const text = embeddingService.buildBookEmbeddingText(book);
        const res = await embeddingService.generateEmbedding(text);
        if (res?.embedding) {
          await bookRepository.updateEmbedding(book._id, res.embedding, res.model);
          embeddedCount++;
        }
      }
      return embeddedCount;
    } catch {
      return 0;
    }
  }
}

export const recommendationOrchestrator = new RecommendationOrchestrator();
