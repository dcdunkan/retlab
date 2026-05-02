import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import type { institutions } from "$lib/generated/models";
import { eq, inArray } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!, {
	schema: schema
});

const currentCollegeList = await fetch("https://etlab.in/api/collegelistandroid.json")
	.then((response) => response.json() as Promise<institutions.Institution>)
	.then((l) => new Map(l.colleges.map((c) => [Number.parseInt(c.clgId), c])));

console.log(currentCollegeList.size);

await db.transaction(async (tx) => {
	const existingCollegeList = await tx.query.colleges
		.findMany()
		.then((l) => new Map(l.map((c) => [c.id, c])));

	const toDelete = new Set<number>();
	for (const [id] of existingCollegeList) {
		if (!currentCollegeList.has(id)) toDelete.add(id);
	}

	const toCreate: institutions.Colleges[] = [];
	const toUpdate: institutions.Colleges[] = [];

	for (const [id, college] of currentCollegeList) {
		const existing = existingCollegeList.get(id);
		if (existing == null) {
			toCreate.push(college);
		} else if (existing.baseUrl !== college.base_url || existing.name !== college.clgName) {
			toUpdate.push(college);
		}
	}

	if (toDelete.size > 0) {
		await tx.delete(schema.colleges).where(inArray(schema.colleges.id, Array.from(toDelete)));
	}

	if (toCreate.length > 0) {
		await tx
			.insert(schema.colleges)
			.values(
				toCreate.map((x) => ({
					id: Number.parseInt(x.clgId),
					name: x.clgName,
					baseUrl: x.base_url
				}))
			)
			.onConflictDoNothing();
	}

	await Promise.all(
		toUpdate.map((college) => {
			const id = Number.parseInt(college.clgId);
			return tx
				.update(schema.colleges)
				.set({
					id: id,
					name: college.clgName,
					baseUrl: college.base_url
				})
				.where(eq(schema.colleges.id, id));
		})
	);
});
