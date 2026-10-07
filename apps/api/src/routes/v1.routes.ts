import { Router } from 'express';
import authRouter from './auth.routes.js';
import readerRouter from './reader.routes.js';
import bookRouter from './book.routes.js';
import recommendationRouter from './recommendation.routes.js';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/reader', readerRouter);
v1Router.use('/books', bookRouter);
v1Router.use('/recommendations', recommendationRouter);

v1Router.get('/status', (_req, res) => {
  res.status(200).json({ status: 'ok', version: 'v1' });
});

export default v1Router;

