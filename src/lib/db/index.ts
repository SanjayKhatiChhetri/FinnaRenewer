import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local — get one free at https://neon.tech",
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export const db = createDb();
