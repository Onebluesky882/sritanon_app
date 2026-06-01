import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";
import { posts } from "./post";


export const comments = sqliteTable("comments", {
 id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID

  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),

  userId: text("user_id").notNull(),

  content: text("content").notNull(),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }),
  updatedAt: integer("updated_at", {
  mode: "timestamp",
}),
});