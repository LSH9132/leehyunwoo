export function rateLimit({
  interval,
  uniqueTokenPerInterval,
}: {
  interval: number;
  uniqueTokenPerInterval: number;
}) {
  const tokenCache = new Map();

  return {
    check: async (request: Request, limit: number, token: string) => {
      const now = Date.now();
      const windowStart = now - interval;

      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      const tokenKey = `${clientIp}:${token}`;

      let tokenCount = tokenCache.get(tokenKey) || [];
      tokenCount = tokenCount.filter((timestamp: number) => timestamp > windowStart);

      if (tokenCount.length >= limit) {
        throw new Error('Rate limit exceeded');
      }

      tokenCount.push(now);
      tokenCache.set(tokenKey, tokenCount);

      // 캐시 크기 제한
      if (tokenCache.size > uniqueTokenPerInterval) {
        const first = tokenCache.keys().next().value;
        tokenCache.delete(first);
      }
    },
  };
} 