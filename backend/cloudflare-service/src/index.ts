import { Hono } from "hono";
import { createDb } from "./db";
import { posts } from "./db/schema";
import { drizzle } from "drizzle-orm/d1";
import { createAuth } from "./lib/auth";


type Bindings = {

  DATABASE: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

};
const app = new Hono<{ Bindings: Bindings }>();

app.all("/api/auth/*", async (c) => {
  try {
    const db = drizzle(c.env.DATABASE);

    const auth = createAuth(db);

    return auth.handler(c.req.raw);
  } catch (error) {
    console.error("AUTH ERROR:", error);

    return c.json(
      {
        error: String(error),
      },
      500
    );
  }
});
 

app.get("/posts", async (c) => {

  const db = createDb(c.env.DATABASE);

  const result = await db

    .select()

    .from(posts);

  return c.json(result);

});

 
 
export default app;
