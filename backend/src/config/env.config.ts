import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from .env
dotenv.config();

const envSchema = z.object({
  PORT: z.preprocess((val) => Number(val ?? 5000), z.number().int().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().min(1, { message: 'OPENAI_API_KEY is required' }),
  ALLOWED_ORIGIN: z.string().url().default('http://localhost:3000'),
});

const parseEnv = () => {
  // In testing environments, if OPENAI_API_KEY is missing, we populate a mock value
  // to prevent validation failures since we'll mock the provider.
  if (process.env.NODE_ENV === 'test' && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'mock-openai-key-for-test';
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables Configuration:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  return parsed.data;
};

export const env = parseEnv();
