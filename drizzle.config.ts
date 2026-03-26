import "dotenv/config"; // make sure to install dotenv package
import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;
if (typeof DATABASE_URL !== "string" || DATABASE_URL.trim().length === 0) {
	throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
	dialect: "postgresql",
	out: "./src/lib/server/drizzle",
	schema: "./src/lib/server/drizzle/schema.ts",
	dbCredentials: {
		url: DATABASE_URL
	},
	casing: "snake_case",
	verbose: true,
	strict: true
});
