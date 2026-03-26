import { env } from "$env/dynamic/private";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = neon(env.DATABASE_URL);
const db = drizzle(client, { schema, casing: "snake_case" });

export { db, schema };
