import rateLimit from 'express-rate-limit';
import { NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  handler: (_: any, res: NextApiResponse) => {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  },
});