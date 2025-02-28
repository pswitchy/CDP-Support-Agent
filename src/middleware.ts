import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter } from './lib/utils/rate-limiter';
import { SYSTEM_CONSTANTS } from './lib/utils/constants';
import { ActivityLogger } from './lib/utils/activity-logger';

const rateLimiter = new RateLimiter();

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    try {
      // Get client IP from headers or connection
      const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0];
      const realIp = request.headers.get('x-real-ip');
      const connectionRemote = request.headers.get('x-vercel-proxied-for') || 
                             request.headers.get('x-vercel-ip');
      
      const clientIp = forwardedFor || 
                      realIp || 
                      connectionRemote || 
                      'unknown';

      if (!clientIp || clientIp === 'unknown') {
        ActivityLogger.logError(new Error('Undefined IP address detected'), {
          operation: 'rate_limit_check',
          timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
          path: request.nextUrl.pathname,
          headers: Object.fromEntries(request.headers.entries())
        });

        return new NextResponse(
          JSON.stringify({
            error: 'Unable to determine client IP address',
            code: 'ERR_UNDEFINED_IP',
            timestamp: SYSTEM_CONSTANTS.CURRENT_TIME
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Check rate limit
      if (rateLimiter.isRateLimited(clientIp)) {
        const resetTime = rateLimiter.getResetTime(clientIp);
        const remaining = rateLimiter.getRemainingRequests(clientIp);

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            resetTime,
            remaining,
            timestamp: SYSTEM_CONSTANTS.CURRENT_TIME
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': resetTime.toISOString(),
              'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
            }
          }
        );
      }

      // Validate content type for POST requests
      if (request.method === 'POST') {
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          return new NextResponse(
            JSON.stringify({
              error: 'Content-Type must be application/json',
              timestamp: SYSTEM_CONSTANTS.CURRENT_TIME
            }),
            {
              status: 415,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }

      // Continue with the request if all checks pass
      const response = NextResponse.next();

      // Add rate limit headers to response
      const remaining = rateLimiter.getRemainingRequests(clientIp);
      const resetTime = rateLimiter.getResetTime(clientIp);
      
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
      response.headers.set('X-Client-IP', clientIp);

      return response;

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'middleware_error',
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        path: request.nextUrl.pathname,
        headers: Object.fromEntries(request.headers.entries())
      });

      return new NextResponse(
        JSON.stringify({
          error: 'Internal server error',
          code: 'ERR_INTERNAL',
          timestamp: SYSTEM_CONSTANTS.CURRENT_TIME
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }

  // Continue with the request for non-chat API routes
  return NextResponse.next();
}

// Configure middleware to only run on API routes
export const config = {
  matcher: '/api/:path*'
};