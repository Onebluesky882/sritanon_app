// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { schema } from "../db/schema";


export function createAuth(db: any) {
  return betterAuth({
    trustedOrigins: ["https://sritanon-service.onebluesky882.workers.dev"],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema
    }),
    emailAndPassword: {
      enabled: true,
    },
  });
}