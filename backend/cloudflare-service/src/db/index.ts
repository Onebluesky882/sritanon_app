import { drizzle } from "drizzle-orm/d1";

export function createDB(db: D1Database) {
  return drizzle(db);
}