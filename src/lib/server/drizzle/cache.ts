import "dotenv/config";
import * as schema from "../schema";
import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle } from "drizzle-orm/node-postgres";

export function sessionCacheTag(sessionId: schema.Session["id"]) {
	return `dz:s:${sessionId}`;
}

const db = drizzle(process.env.DATABASE_URL!, {
	cache: upstashCache({
		url: process.env.UPSTASH_REDIS_REST_URL!,
		token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		global: false,
		config: { ex: 60 }
	}),
	schema: schema,
	casing: "snake_case"
});

const sessions = await db.select({ id: schema.sessions.id }).from(schema.sessions);
console.log("total sessions:", sessions.length);

await db.$cache.invalidate({ tags: sessions.map((s) => sessionCacheTag(s.id)) });
