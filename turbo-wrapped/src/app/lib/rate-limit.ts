import { LRUCache } from 'lru-cache'
import { rateLimits, RateLimitConfig } from './rate-limit-config'

type Options = {
  uniqueTokenPerInterval?: number
}

export default function rateLimit(endpoint: string, options?: Options) {
  const config: RateLimitConfig = rateLimits[endpoint] || rateLimits.default;
  
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: config.interval,
  })

  return {
    check: (token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1])
        return { 
          success: true, 
          remaining: config.limit - 1,
          limit: config.limit,
          resetIn: config.interval
        }
      }
      if (tokenCount[0] === config.limit) {
        return { 
          success: false, 
          remaining: 0,
          limit: config.limit,
          resetIn: config.interval
        }
      }
      tokenCache.set(token, [tokenCount[0] + 1])
      return { 
        success: true, 
        remaining: config.limit - tokenCount[0] - 1,
        limit: config.limit,
        resetIn: config.interval
      }
    },
  }
}