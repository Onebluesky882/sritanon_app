import { posts } from "@/db/post";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
export type SelectPost = InferSelectModel<typeof posts>;
export type CreatePost = InferInsertModel<typeof posts>;

 
