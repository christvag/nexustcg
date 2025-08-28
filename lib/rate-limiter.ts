// Rate limiter for API requests
class RateLimiter {
  private queue: Array<() => void> = []
  private requestCount: number = 0
  private resetTime: number = Date.now()
  private readonly maxRequests: number
  private readonly timeWindow: number // in milliseconds
  private processing: boolean = false

  constructor(maxRequests: number = 20, timeWindowSeconds: number = 1) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowSeconds * 1000
  }

  async throttle(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve)
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      
      // Reset counter if time window has passed
      if (now - this.resetTime >= this.timeWindow) {
        this.requestCount = 0
        this.resetTime = now
      }

      // Check if we can make a request
      if (this.requestCount < this.maxRequests) {
        const resolve = this.queue.shift()
        if (resolve) {
          this.requestCount++
          resolve()
        }
      } else {
        // Wait until the next time window
        const waitTime = this.timeWindow - (now - this.resetTime)
        await new Promise(r => setTimeout(r, waitTime))
      }
    }

    this.processing = false
  }
}

// Create a singleton instance for YuGiOh API
export const yugiohRateLimiter = new RateLimiter(15, 1) // Using 15 instead of 20 for safety margin

// Debounce utility for search queries
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Request cache to reduce API calls
interface CacheEntry {
  data: any
  timestamp: number
}

class RequestCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly ttl: number // Time to live in milliseconds

  constructor(ttlSeconds: number = 60) {
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const yugiohCache = new RequestCache(60) // Cache for 60 seconds