import {    DrizzleD1Database } from "drizzle-orm/d1";
import { posts } from "@/db/post";
import {  CreatePost } from "./type";
import { eq } from "drizzle-orm";

export async function findMany(db: DrizzleD1Database) {
  return db.select().from(posts)
}

export async function create(db: DrizzleD1Database, data: CreatePost ) {
  const result =  await db.insert(posts).values( {
    title : data.title,
    content : data.content,
  user  : data.user,

  }).returning();

  return result;

}

export async function update( db: DrizzleD1Database, data: CreatePost , id : string) {

    const result =  await db.update(posts).set( {
    title : data.title,
    content : data.content,
  user  : data.user,

  }).where(eq(posts.id , id)).returning();

  return result[0] ?? null;

}