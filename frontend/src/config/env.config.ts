import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5000'),
});

const parseEnv = () => {
  const data = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  const parsed = envSchema.safeParse(data);

  if (!parsed.success) {
    console.error('❌ Invalid Frontend Environment Config:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    if (process.env.NODE_ENV === 'development') {
      throw new Error('Invalid frontend environment configuration.');
    }
  }

  return parsed.success ? parsed.data : { NEXT_PUBLIC_API_URL: 'http://localhost:5000' };
};

export const env = parseEnv();
