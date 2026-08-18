import cors, { CorsOptions } from 'cors';
import { env } from '../config/env.js';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      // In development, check against allowed origins or allow local
      const isAllowed =
        env.CORS_ORIGIN.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');
      if (isAllowed) {
        return callback(null, true);
      }
    } else {
      // In production, strictly check configured allowed origins
      if (env.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
    }

    return callback(new Error('CORS policy: Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const corsMiddleware = cors(corsOptions);
