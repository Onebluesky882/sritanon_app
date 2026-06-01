import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { posts } from "./post";

export const postVotes = sqliteTable(
  "post_votes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),

    userId: text("user_id").notNull(),

    value: integer("value").notNull(),

    createdAt: integer("created_at", { mode: "timestamp" }),
  },
  (t) => ({
    uniq: uniqueIndex("uniq_vote").on(t.postId, t.userId),
  })
);