import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment } from "$lib/generated/models";
import { L1_CACHE_ARGS } from "$lib/server";
import { makeSessionBoundProxy, parseAssignmentsResponse } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";
import z from "zod";

// note: _l1 = use L1 cache (redis)

export const getDueAssignments = query(
	z.object({
		...L1_CACHE_ARGS.shape
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) {
			return error(401, "Unauthorized");
		}
		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const assignments = await etproxy<assignment.AssignmentResponse>(
			{
				method: "POST",
				endpoint: ApiEndPoints.ASSIGNMENT_URL,
				body: {
					filter: "",
					sem_id: "",
					sort: ""
				} satisfies assignment.AssignmentRequest
			},
			{ readL1Cached: args._l1 }
		);

		if (!assignments.ok) {
			return error(assignments.statusCode, assignments.message);
		}

		return parseAssignmentsResponse(
			assignments.data,
			new URL(sessionUser.college.baseUrl).origin
		).filter((assignment) => assignment._parsed.is_due);
	}
);
