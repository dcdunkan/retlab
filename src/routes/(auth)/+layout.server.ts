import { ApiEndPoints } from "$lib/generated/api-endpoints.js";
import { api } from "$lib/server/index.js";
import { error } from "@sveltejs/kit";

export const load = async (event) => {
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}
	const { account, ...session } = event.locals.session;

	const semesters = await api
		.get<
			{
				id: string;
				course_id: string;
				name: string;
				position: string;
				elective: string;
				program_elective: string;
				mooc_status: string;
				additional_elective: string;
			}[]
		>(account.college.base_url + ApiEndPoints.SEM_LIST_URL, {
			headers: { Authorization: "Bearer " + session.access_token }
		})
		.json()
		.then((semesters) =>
			semesters.map(
				(semester) =>
					({
						id: Number.parseInt(semester.id),
						course_id: Number.parseInt(semester.course_id),
						name: semester.name, // todo: parse itt!!!
						position: Number.parseInt(semester.position),
						elective: Number.parseInt(semester.elective),
						program_elective: Number.parseInt(semester.program_elective),
						mooc_status: Number.parseInt(semester.mooc_status),
						additional_elective: Number.parseInt(semester.additional_elective)
					}) satisfies Record<keyof Omit<(typeof semesters)[0], "name">, number> & { name: string } // hack: retlab-generate should technically generate this, right?
			)
		);

	return {
		semesters,
		session,
		account
	};
};
