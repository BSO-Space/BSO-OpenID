import { createClient, RedisClientType } from 'redis';
import { envConfig } from './env.config';

class RedisClientSingleton {
  private static instance: RedisClientType<any>;

  private constructor() {
  }

  public static getInstance(): RedisClientType<any> {
    if (!RedisClientSingleton.instance) {
      const client: RedisClientType<any> = createClient({
        socket: {
          host: envConfig.REDIS_HOST,
          port: parseInt(envConfig.REDIS_PORT, 10),
        },
        password: envConfig.REDIS_PASSWORD,
      });

      client.on('error', (err) => console.error('Redis Client Error:', err));
      RedisClientSingleton.instance = client;

      (async () => {
        try {
          await client.connect();
          console.log('Connected to Redis with authentication');
        } catch (error) {
          console.error('Failed to connect to Redis:', error);
        }
      })();
    }

    return RedisClientSingleton.instance;
  }
}

export default RedisClientSingleton;
