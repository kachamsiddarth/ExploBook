import { Router } from 'express';
import authRouter from './auth.routes.js';
import readerRouter from './reader.routes.js';
import bookRouter from './book.routes.js';
import recommendationRouter from './recommendation.routes.js';
import sessionRouter from './session.routes.js';
import expeditionRouter from './expedition.routes.js';
import orbRouter from './orb.routes.js';
import dashboardRouter from './dashboard.routes.js';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/reader', readerRouter);
v1Router.use('/books', bookRouter);
v1Router.use('/recommendations', recommendationRouter);
v1Router.use('/sessions', sessionRouter);
v1Router.use('/expeditions', expeditionRouter);
v1Router.use('/orbs', orbRouter);
v1Router.use('/dashboard', dashboardRouter);

v1Router.get('/status', (_req, res) => {
  res.status(200).json({ status: 'ok', version: 'v1' });
});

export default v1Router;
