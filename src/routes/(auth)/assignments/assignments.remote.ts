import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment, result } from "$lib/generated/models";
import { api } from "$lib/server";
import { parseAssignmentsResponse } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";
import z from "zod";

// todo: possibly merge this with ../dashboard.remote.ts::getDueAttendance()
export const getAssignments = query(
	z.object({
		semester_id: z.number()
	}),
	async (arg) => {
		const event = getRequestEvent();
		if (event.locals.session == null) {
			return error(401, "Unauthorized");
		}
		const session = event.locals.session;

		const assignments = await api
			.post<assignment.AssignmentResponse>(
				session.account.college.baseUrl + ApiEndPoints.ASSIGNMENT_URL,
				{
					json: {
						filter: "",
						sem_id: arg.semester_id.toString(), // todo: implement semester chooser
						sort: ""
					} satisfies assignment.AssignmentRequest,
					headers: { Authorization: "Bearer " + session.accessToken }
				}
			)
			.json();

		return parseAssignmentsResponse(assignments, new URL(session.account.college.baseUrl).origin);
	}
);

export const getAssignmentResults = query(
	z.object({
		semester_id: z.number()
	}),
	async (arg) => {
		const event = getRequestEvent();
		if (event.locals.session == null) {
			return error(401, "Unauthorized");
		}

		const session = event.locals.session;
		const assignmentResults = await api
			.post<result.ResultAssignment>(
				session.account.college.baseUrl + ApiEndPoints.RESULT_ASSIGNMENT_URL,
				{
					json: {
						// todo: no types? need to improve retlab-generate
						sem_id: arg.semester_id.toString() // not working as of 26/12/25
					},
					headers: { Authorization: "Bearer" + session.accessToken }
				}
			)
			.json();
		return assignmentResults;
	}
);
