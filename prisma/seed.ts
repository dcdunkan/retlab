import "dotenv/config";
import { institutions } from "../src/lib/generated/models";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/lib/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const currentCollegeList = await fetch("https://etlab.in/api/collegelistandroid.json")
	.then((response) => response.json() as Promise<institutions.Institution>)
	.then((l) => new Map(l.colleges.map((c) => [Number.parseInt(c.clgId), c])));

await prisma.$transaction(async (tx) => {
	const existingCollegeList = await tx.college
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
		await tx.college.deleteMany({
			where: { id: { in: Array.from(toDelete) } }
		});
	}

	if (toCreate.length > 0) {
		await tx.college.createMany({
			data: toCreate.map((x) => ({
				id: Number.parseInt(x.clgId),
				name: x.clgName,
				base_url: x.base_url
			})),
			skipDuplicates: true
		});
	}

	await Promise.all(
		toUpdate.map((college) => {
			const id = Number.parseInt(college.clgId);
			return tx.college.update({
				where: { id: id },
				data: {
					id: id,
					name: college.clgName,
					base_url: college.base_url
				}
			});
		})
	);
});

await prisma.$disconnect();
