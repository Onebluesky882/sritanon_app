
import * as repo from "./repository";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { CreatePost } from "./type";

export async function list(db :DrizzleD1Database) {
  return repo.findMany(db);
}


export async function create(db : DrizzleD1Database, data: CreatePost) {
  return repo.create(db, data);
}

export async function update(db : DrizzleD1Database, data: CreatePost ,postId : string)  {
  return repo.update(db, data, postId );
}