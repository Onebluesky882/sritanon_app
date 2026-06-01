import { Hono } from "hono";
import { createDb } from "./db";
import { posts } from "./db/schema";


type Bindings = {

  DB: D1Database;

};
const app = new Hono<{ Bindings: Bindings }>();

 

app.get("/posts", async (c) => {

  const db = createDb(c.env.DB);

  const result = await db

    .select()

    .from(posts);

  return c.json(result);

});

 
 
export default app;
