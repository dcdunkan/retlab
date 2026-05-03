import { db } from "$lib/server/db";

export const load = async () => {
	const colleges = await db.query.colleges.findMany({
		columns: {
			id: true,
			name: true
		}
	});

	return {
		colleges: colleges
	};
};

export const prerender = true;
