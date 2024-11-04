import * as dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  APP_PORT: string;
  APP_URL: string;
  DATABASE_URL: string;
  DB_PORT: string;
  PG_USER: string;
  PG_PASSWORD: string;
  PG_DATABASE: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_CALLBACK_URL: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
}

const requiredConfig: (keyof EnvConfig)[] = [
  "APP_PORT",
  "APP_URL",
  "DATABASE_URL",
  "DB_PORT",
  "PG_USER",
  "PG_PASSWORD",
  "PG_DATABASE",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_CALLBACK_URL",
  "JWT_SECRET",
  "SESSION_SECRET",
];

export const envConfig: EnvConfig = {
  APP_PORT: process.env.APP_PORT || "3000",
  APP_URL: process.env.APP_URL || "http://localhost:3005",
  DATABASE_URL: process.env.DATABASE_URL || "localhost",
  DB_PORT: process.env.DB_PORT || "5432",
  PG_USER: process.env.PG_USER || "postgres",
  PG_PASSWORD: process.env.PG_PASSWORD || "password",
  PG_DATABASE: process.env.PG_DATABASE || "database",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
  DISCORD_CALLBACK_URL: process.env.DISCORD_CALLBACK_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "session_secret_key",
};

requiredConfig.forEach((key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  envConfig[key] = value;
});
