import { getRequestEvent, query } from "$app/server";
import { WeblabRoutes } from "$lib/server/constants";
import { db, schema } from "$lib/server/db";
import { parseAcademicAnalysisPage } from "$lib/server/weblab-parsers/academic-analysis";
import { error } from "@sveltejs/kit";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

export const getAcademicAnalysis = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;

	const [activeSession] = await db
		.update(schema.webSessions)
		.set({ requestsMade: sql`${schema.webSessions.requestsMade} + 1`, lastUsedAt: sql`now()` })
		.where(
			and(
				eq(schema.webSessions.accountUsername, sessionUser.account.username),
				eq(schema.webSessions.collegeId, sessionUser.college.id),
				isNull(schema.webSessions.revokedAt),
				gte(schema.webSessions.expiresAt, sql`now()`)
			)
		)
		.returning({
			cookieString: schema.webSessions.cookieString
		});
	if (activeSession == null)
		return error(400, {
			message: "No active sessions found!",
			code: "WebAccess:NO_ACTIVE_SESSION"
		});

	const parsedCollegeBaseUrl = new URL(sessionUser.college.baseUrl);
	const academicAnalysisUrl = new URL(WeblabRoutes.ACADEMIC_ANALYSIS_URL, parsedCollegeBaseUrl);
	const response = await fetch(academicAnalysisUrl, {
		redirect: "manual",
		headers: { Cookie: activeSession.cookieString }
	});
	if (!response.ok) {
		return error(500, "Something went wrong!");
	}
	try {
		const parsed = parseAcademicAnalysisPage(await response.text());
		return parsed;
	} catch {
		return error(500, "Failed to parse academic analysis page");
	}
});
