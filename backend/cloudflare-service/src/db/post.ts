import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import { sql } from "drizzle-orm";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID

  user : text('user').notNull().references( () => user.id ),

  title: text("title").notNull(),

  content: text("content").notNull(),

  category: text("category"), // NEW

  subCategory: text("sub_category"), // NEW

createdAt: integer("created_at", { mode: "timestamp" })

  .default(sql`(unixepoch())`)

  .notNull(),

updatedAt: integer("updated_at", { mode: "timestamp" })

  .$onUpdate(() => new Date())

  .notNull(),
 
});