import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load environment variables from .env or server/.env if present
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) {
        throw new Error(`Invalid PORT value: ${val}`);
      }
      return parsed;
    }),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:5173,http://localhost:8081')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('placeholder-secret-for-dev-only'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variable configuration:');
    console.error(result.error.format());
    throw new Error('Environment configuration validation failed');
  }

  return result.data;
}

export const env = loadConfig();
