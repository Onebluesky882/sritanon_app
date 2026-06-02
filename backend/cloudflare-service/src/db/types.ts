import { drizzle } from "drizzle-orm/d1";

export type Db = ReturnType<typeof drizzle>;

export type Bindings = {

  DATABASE: D1Database;

};