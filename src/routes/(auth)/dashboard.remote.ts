import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment } from "$lib/generated/models";
import { makeSessionBoundProxy, parseAssignmentsResponse } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";

export const getDueAssignments = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}
	const sessionUser = event.locals.sessionUser;
	const etproxy = makeSessionBoundProxy(sessionUser);

	const assignments = await etproxy<assignment.AssignmentResponse>({
		method: "POST",
		endpoint: ApiEndPoints.ASSIGNMENT_URL,
		body: {
			filter: "",
			sem_id: "",
			sort: ""
		} satisfies assignment.AssignmentRequest
	});

	if (!assignments.ok) {
		return error(assignments.statusCode, assignments.message);
	}

	return parseAssignmentsResponse(
		assignments.data,
		new URL(sessionUser.college.baseUrl).origin
	).filter((assignment) => assignment._parsed.is_due);
});
