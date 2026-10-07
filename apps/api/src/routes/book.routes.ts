import { Router } from 'express';
import { bookRepository } from '../repositories/book.repository.js';
import { BookSearchParamsSchema } from '@explobook/shared';

const bookRouter = Router();

// GET /api/v1/books - List or search books with filters
bookRouter.get('/', async (req, res, next) => {
  try {
    const params = BookSearchParamsSchema.parse(req.query);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filterOptions: Parameters<typeof bookRepository.find>[0] = {
      q: typeof params.q === 'string' ? params.q : undefined,
      genre: typeof params.genre === 'string' ? params.genre : undefined,
      difficulty: params.difficulty ? Number(params.difficulty) : undefined,
      minPages: params.minPages ? Number(params.minPages) : undefined,
      maxPages: params.maxPages ? Number(params.maxPages) : undefined,
      skip,
      limit,
    };

    const { books, total } = await bookRepository.find(filterOptions);

    res.status(200).json({
      success: true,
      data: {
        books: books.map((b) => ({
          id: b._id?.toString(),
          title: b.title,
          subtitle: b.subtitle,
          authors: b.authors,
          description: b.description,
          genres: b.genres,
          themes: b.themes,
          language: b.language,
          pageCount: b.pageCount,
          publicationYear: b.publicationYear,
          difficultyScore: b.difficultyScore,
          publicDomain: b.publicDomain,
          coverImageUrl: b.coverImageUrl,
          source: b.source,
          metadataQuality: b.metadataQuality,
          externalIds: b.externalIds,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/books/:bookId - Get book details by ID
bookRouter.get('/:bookId', async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await bookRepository.findById(bookId);

    if (!book) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BOOK_NOT_FOUND',
          message: `Book with ID ${bookId} was not found.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: book._id?.toString(),
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors,
        description: book.description,
        genres: book.genres,
        themes: book.themes,
        language: book.language,
        pageCount: book.pageCount,
        publicationYear: book.publicationYear,
        difficultyScore: book.difficultyScore,
        publicDomain: book.publicDomain,
        coverImageUrl: book.coverImageUrl,
        source: book.source,
        metadataQuality: book.metadataQuality,
        externalIds: book.externalIds,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default bookRouter;
