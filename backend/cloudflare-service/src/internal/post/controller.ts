
import { Context } from 'hono';
import * as service from './service'
import { D1Database } from "@cloudflare/workers-types";
import { createDB } from '@/db';
import { log } from 'node:console';
import { Bindings } from '@/db/types';
import {   CreatePost } from './type';
 
export async function list(c : Context<{ Bindings: Bindings }>) {
 const db = createDB(c.env.DATABASE);
  const posts = await service.list(db)
  return c.json({
    success : "ok",
    data : posts,
     
  },201)
  
}

export async function create( c: Context<{ Bindings: Bindings }>) {

const body = await c.req.json<CreatePost>();
 const db = createDB(c.env.DATABASE);


   try {

    const result = await service.create(db, body);


    return c.json({ success: true, data: result }, 201);

  } catch (err) {


    return c.json({ error: String(err) }, 500);

  }
 
 

}


export async function update( c: Context<{ Bindings: Bindings }>) {

const body = await c.req.json<CreatePost>();
 const db = createDB(c.env.DATABASE);
  const id = c.req.param("id");
   if (!id) {

    return c.json({ error: "Missing id" }, 400);

  }

   try {
 

    const result = await service.update(db, body ,id);


    return c.json({ success: true, data: result }, 200);

  } catch (err) {


    return c.json({ error: String(err) }, 500);

  }
 
 

}