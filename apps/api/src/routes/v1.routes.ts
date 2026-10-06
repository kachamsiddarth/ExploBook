import { Router } from 'express';

const v1Router = Router();

// Future Phase API Route Groups placeholder (Phases 2-13):
// v1Router.use('/auth', authRouter);
// v1Router.use('/reader', readerRouter);
// v1Router.use('/books', bookRouter);
// v1Router.use('/recommendations', recommendationRouter);
// v1Router.use('/reading-sessions', readingSessionRouter);
// v1Router.use('/reviews', reviewRouter);

v1Router.get('/status', (_req, res) => {
  res.status(200).json({ status: 'ok', version: 'v1' });
});

export default v1Router;
