import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as dns from 'dns';

// Force IPv4 resolution for compatibility with some networks
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in your .env file');
}

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  }
});
