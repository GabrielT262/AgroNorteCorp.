import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as dns from 'dns';

// Force IPv4 resolution for compatibility with some networks
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in your .env file');
}

let connectionString = process.env.DATABASE_URL;

// When connecting to a Supabase database with connection pooling (PgBouncer),
// sslmode=require is necessary. This error often occurs in serverless environments like Vercel
// or when running drizzle-kit locally.
if (connectionString && !/sslmode=/.test(connectionString)) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString = `${connectionString}${separator}sslmode=require`;
}

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  }
});
