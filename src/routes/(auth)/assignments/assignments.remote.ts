import { command, getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { assignment, result } from "$lib/generated/models";
import { L1_CACHE_ARGS } from "$lib/server";
import { WeblabRoutes } from "$lib/server/constants";
import { makeSessionBoundProxy, parseAssignmentsResponse } from "$lib/server/etlab";
import {
	acquireNewWebSession,
	addRequestsMade,
	findActiveWebSession
} from "$lib/server/web-access";
import { error } from "@sveltejs/kit";
import { waitUntil } from "@vercel/functions";
import z from "zod";

// todo: merge this with ../dashboard.remote.ts::getDueAssignments()
export const getAssignments = query(
	z.object({
		semester_id: z.number(),
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
				endpoint: ApiEndPoints.ASSIGNMENT_URL,
				method: "POST",
				body: {
					filter: "",
					sem_id: args.semester_id.toString(),
					sort: ""
				} satisfies assignment.AssignmentRequest
			},
			{ readL1Cached: args._l1 }
		);

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

		const assignmentResults = await etproxy<result.ResultAssignment[]>({
			endpoint: ApiEndPoints.RESULT_ASSIGNMENT_URL,
			method: "POST",
			body: {
				// todo: no types? need to improve retlab-generate
				sem_id: arg.semester_id.toString() // not working as of 26/12/2025, 03/10/2026
			}
		});

		if (!assignmentResults.ok) {
			return error(assignmentResults.statusCode, assignmentResults.message);
		}

		return assignmentResults.data; // todo: handle cache state in frontend
	}
);

export const deleteAssignment = command(
	z.object({
		assignmentId: z.string().nonempty().max(256),
		password: z.string().nonempty().max(256)
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;

		if (__EXPERIMENTAL_WEB_TOGGLES__["delete_assignment_mode"] === "app") {
			const etproxy = makeSessionBoundProxy(sessionUser);
			const response = await etproxy(
				{
					endpoint: ApiEndPoints.DELETE_ASSIGNMENT_URL,
					method: "POST",
					type: "x-www-form-urlencoded",
					body: {
						id: args.assignmentId.toString()
					}
				},
				{ readL1Cached: false, readL2Cached: false, writeL1Cache: false, writeL2Cache: false }
			);

			console.log(response);
			if (!response.ok) return error(response.statusCode, response.message);
			return { deleted: true };
		} else if (__EXPERIMENTAL_WEB_TOGGLES__["delete_assignment_mode"] === "web") {
			let webSession = await findActiveWebSession(sessionUser);
			if (webSession == null) {
				// silently obtain one
				const attempt = await acquireNewWebSession(sessionUser, args.password);
				if (!attempt.acquired) return error(400, attempt.message);
				webSession = {
					id: attempt.session.id,
					cookieString: attempt.session.cookieString
				};
			}

			const parsedCollegeBaseUrl = new URL(sessionUser.college.baseUrl);
			const deleteAssignmentUrl = new URL(
				WeblabRoutes.DELETE_SUBMITTED_ASSIGNMENT_URL(args.assignmentId),
				parsedCollegeBaseUrl
			);

			const response = await fetch(deleteAssignmentUrl, {
				method: "GET",
				headers: { Cookie: webSession.cookieString, Referer: deleteAssignmentUrl.href },
				redirect: "manual"
			});
			waitUntil(addRequestsMade(sessionUser, webSession.id, 1));

			if (response.status === 302 && response.headers.has("location")) {
				const location = response.headers.get("location");
				const expectedSuccessRedirectUrl = new URL(
					WeblabRoutes.VIEW_ASSIGNMENT_URL(args.assignmentId),
					sessionUser.college.baseUrl
				);

				if (location != null && location === expectedSuccessRedirectUrl.href) {
					return { deleted: true };
				}
			}

			console.log(response.status, response);
			return error(
				400,
				"Could not delete the submitted assignment (or deleted, but can't figure out this), please report!"
			);
		} else {
			throw new Error("unknown assignment delete mode defined in build");
		}
	}
);
