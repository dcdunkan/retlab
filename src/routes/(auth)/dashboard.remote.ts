import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment } from "$lib/generated/models";
import { api } from "$lib/server";
import { parseAssignmentsResponse } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";

export const getDueAssignments = query(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}
	const session = event.locals.session;

	const assignments = await api
		.post<assignment.AssignmentResponse>(
			session.account.college.base_url + ApiEndPoints.ASSIGNMENT_URL,
			{
				json: {
					filter: "",
					sem_id: "",
					sort: ""
				} satisfies assignment.AssignmentRequest,
				headers: { Authorization: "Bearer " + session.access_token }
			}
		)
		.json();

	return parseAssignmentsResponse(
		assignments,
		new URL(session.account.college.base_url).origin
	).filter((assignment) => assignment._parsed.is_due);
});
