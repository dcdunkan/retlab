import { getRequestEvent, query } from "$app/server";
import { strictNum } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { result } from "$lib/generated/models";
import {
	makeSessionBoundProxy,
	parseCombinedMarkString,
	parseSubjectString
} from "$lib/server/etlab";
import { error } from "@sveltejs/kit";
import z from "zod";

export const getSessionalResults = query(
	z.object({
		semester_id: z.int(),
		session: z.int().min(1).max(8)
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const resultsReq = await etproxy<result.ResultSeasonal[]>({
			endpoint: ApiEndPoints.RESULT_SEASONAL_URL,
			method: "POST",
			body: {
				sem_id: args.semester_id.toString(),
				session: args.session.toString()
			} satisfies result.SeasonRequest
		});

		if (!resultsReq.ok) {
			return error(resultsReq.statusCode, resultsReq.message);
		}

		return resultsReq.data.map((result) => {
			return {
				subject: result.subject,
				max_mark: result.max_mark,
				obtained_mark: result.obtained_mark,
				_parsed: {
					subject: parseSubjectString(result.subject),
					maxMark: strictNum(result.max_mark),
					obtainedMark: strictNum(result.obtained_mark)
				}
			};
		});
	}
);

export const getInternalResults = query(
	z.object({
		semester_id: z.int()
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const resultsReq = await etproxy<result.ResultInternal[]>({
			endpoint: ApiEndPoints.RESULT_INTERNAL_URL,
			method: "POST",
			body: {
				sem_id: args.semester_id.toString()
			} // todo: why no types??
		});

		if (!resultsReq.ok) {
			return error(resultsReq.statusCode, resultsReq.message);
		}

		return resultsReq.data.map((result) => {
			return {
				subject: result.subject,
				max_mark: result.max_mark,
				obtained_mark: result.obtained_mark,
				_parsed: {
					subject: parseSubjectString(result.subject),
					maxMark: strictNum(result.max_mark),
					obtainedMark: strictNum(result.obtained_mark)
				}
			};
		});
	}
);

export const getModuleTestResults = query(
	z.object({
		semester_id: z.int()
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const resultsReq = await etproxy<result.moduletest.ResultModuleTestResponse>({
			endpoint: ApiEndPoints.RESULT_MODULE_TEST_URL,
			method: "POST",
			body: {
				sem_id: args.semester_id.toString()
			} // todo: why no types??
		});

		if (!resultsReq.ok) {
			return error(resultsReq.statusCode, resultsReq.message);
		}

		return resultsReq.data.module_test.map((result) => {
			return {
				name: result.name,
				subject: result.subject,
				mark: result.mark,
				_parsed: {
					subject: parseSubjectString(result.subject),
					mark: parseCombinedMarkString(result.mark)
				}
			};
		});
	}
);
