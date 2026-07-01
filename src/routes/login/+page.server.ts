import { db, schema } from "$lib/server/db";

export const load = async () => {
	const colleges = await db
		.select({
			id: schema.colleges.id,
			name: schema.colleges.name
		})
		.from(schema.colleges)
		.$withCache();

	return { colleges };
};
