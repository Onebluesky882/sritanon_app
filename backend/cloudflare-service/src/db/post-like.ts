import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";
import { posts } from "./post";

export const postLikes = sqliteTable("post_likes", {

  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID

  postId: text("post_id")

    .notNull()

    .references(() => posts.id, { onDelete: "cascade" }),

  userId: text("user_id").notNull(), // from Better Auth users

  createdAt: integer("created_at", {

    mode: "timestamp",

  }),

});