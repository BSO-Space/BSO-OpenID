import * as dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  DOMAIN: string;
  APP_PORT: string;
  FRONTEND_URL: string;
  MAX_RATE_LIMIT_PER_IP: string;
  MAX_RATE_LIMIT_WINDOW_MS: string;
  APP_URL: string;
  DATABASE_URL: string;
  DB_PORT: string;
  PG_USER: string;
  PG_PASSWORD: string;
  PG_DATABASE: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_PASSWORD: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_CALLBACK_URL: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_CALLBACK_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
}

const requiredConfig: (keyof EnvConfig)[] = [
  "NODE_ENV",
  "DOMAIN",
  "APP_PORT",
  "FRONTEND_URL",
  "APP_URL",
  "MAX_RATE_LIMIT_PER_IP",
  "MAX_RATE_LIMIT_WINDOW_MS",
  "DATABASE_URL",
  "DB_PORT",
  "PG_USER",
  "PG_PASSWORD",
  "PG_DATABASE",
  "REDIS_HOST",
  "REDIS_PASSWORD",
  "REDIS_PORT",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_CALLBACK_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "JWT_SECRET",
  "SESSION_SECRET",
];

export const envConfig: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_PORT: process.env.APP_PORT || "3000",
  DOMAIN: process.env.DOMAIN || "localhost",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  MAX_RATE_LIMIT_PER_IP: process.env.MAX_RATE_LIMIT_PER_IP || "100",
  MAX_RATE_LIMIT_WINDOW_MS: process.env.MAX_RATE_LIMIT_WINDOW_MS || "900000",
  APP_URL: process.env.APP_URL || "http://localhost:3005",
  DATABASE_URL: process.env.DATABASE_URL || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  PG_USER: process.env.PG_USER || "postgres",
  PG_PASSWORD: process.env.PG_PASSWORD || "password",
  PG_DATABASE: process.env.PG_DATABASE || "database",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
  DISCORD_CALLBACK_URL: process.env.DISCORD_CALLBACK_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "session_secret_key",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",
};

requiredConfig.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  envConfig[key] = value;
});
