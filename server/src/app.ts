import express, { Application } from 'express';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import routes from './routes/index.js';

export function createApp(): Application {
  const app = express();

  // Basic security and parsing middleware
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Application Routes
  app.use('/', routes);

  // 404 Route handler
  app.use(notFoundMiddleware);

  // Global Error handler
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
