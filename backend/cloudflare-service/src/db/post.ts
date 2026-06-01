import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), // UUID

  title: text("title").notNull(),

  content: text("content").notNull(),

  category: text("category"), // NEW
  subCategory: text("sub_category"), // NEW

  createdAt: integer("created_at", {
    mode: "timestamp",
  }),
  
updatedAt: integer("updated_at", {
  mode: "timestamp",
}),
});