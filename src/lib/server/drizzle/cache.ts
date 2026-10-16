import "dotenv/config";
import * as schema from "../schema";
import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle } from "drizzle-orm/node-postgres";

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

await db.$cache.invalidate({ tables: [schema.accounts] });
