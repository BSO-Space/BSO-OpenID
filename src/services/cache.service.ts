import { createClient, RedisClientType } from 'redis';
import { envConfig } from '../config/env.config';

class CacheService {
  private client: RedisClientType<any>;

  constructor() {
    this.client = createClient({
      socket: {
        host: envConfig.REDIS_HOST,
        port: parseInt(envConfig.REDIS_PORT, 10),
      },
      password: envConfig.REDIS_PASSWORD || undefined,
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.connect().catch((err) => console.error('Failed to connect to Redis:', err));
  }

  /**
   * Set a value in the cache with an optional expiration time.
   * @param key - The cache key.
   * @param value - The value to cache.
   * @param ttl - Time-to-live in seconds (optional).
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, stringValue, { EX: ttl });
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error(`Error setting cache for key "${key}":`, error);
      throw new Error('Failed to set cache');
    }
  }

  /**
   * Get a value from the cache.
   * @param key - The cache key.
   * @returns The cached value or null if not found.
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error retrieving cache for key "${key}":`, error);
      throw new Error('Failed to get cache');
    }
  }

  /**
   * Delete a value from the cache.
   * @param key - The cache key.
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting cache for key "${key}":`, error);
      throw new Error('Failed to delete cache');
    }
  }

  /**
   * Clear all cache entries.
   */
  public async clearAll(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Error clearing all cache:', error);
      throw new Error('Failed to clear cache');
    }
  }
}

export default new CacheService();
