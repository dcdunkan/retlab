import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "$lib/server/schema";
import { upstashCache } from "drizzle-orm/cache/upstash";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const db = drizzle(env.DATABASE_URL, {
	cache: upstashCache({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
		global: false,
		config: { ex: 60 }
	}),
	schema: schema,
	casing: "snake_case"
});

export function sessionCacheTag(sessionId: schema.Session["id"]) {
	return `dz:s:${sessionId}`;
}

// todo: do the following and brand id-s:
// export async function invalidateSessionCache(session: { id: schema.Session["id"] }) {
export async function invalidateSessionCache(sessionId: schema.Session["id"]) {
	await db.$cache.invalidate({ tags: sessionCacheTag(sessionId) });
}

export { db, schema };
