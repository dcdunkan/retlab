import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment, result } from "$lib/generated/models";
import { makeSessionBoundProxy, parseAssignmentsResponse } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";
import z from "zod";

// todo: merge this with ../dashboard.remote.ts::getDueAssignments()
export const getAssignments = query(
	z.object({
		semester_id: z.number()
	}),
	async (arg) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) {
			return error(401, "Unauthorized");
		}
		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const assignments = await etproxy<assignment.AssignmentResponse>({
			endpoint: ApiEndPoints.ASSIGNMENT_URL,
			method: "POST",
			body: {
				filter: "",
				sem_id: arg.semester_id.toString(),
				sort: ""
			} satisfies assignment.AssignmentRequest
		});

		if (!assignments.ok) {
			return error(assignments.statusCode, assignments.message);
		}

		return parseAssignmentsResponse(assignments.data, new URL(sessionUser.college.baseUrl).origin);
	}
);

export const getAssignmentResults = query(
	z.object({
		semester_id: z.number()
	}),
	async (arg) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) {
			return error(401, "Unauthorized");
		}

		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const assignmentResults = await etproxy<result.ResultAssignment>({
			endpoint: ApiEndPoints.RESULT_ASSIGNMENT_URL,
			method: "POST",
			body: {
				// todo: no types? need to improve retlab-generate
				sem_id: arg.semester_id.toString() // not working as of 26/12/25
			}
		});

		if (!assignmentResults.ok) {
			return error(assignmentResults.statusCode, assignmentResults.message);
		}

		return assignmentResults.data; // todo: handle cache state in frontend
	}
);
