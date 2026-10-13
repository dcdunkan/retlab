import { getRequestEvent, query } from "$app/server";
import { WeblabRoutes } from "$lib/server/constants";
import { addRequestsMade, findActiveWebSession } from "$lib/server/web-access";
import { parseAcademicAnalysisPage } from "$lib/server/weblab-parsers/academic-analysis";
import { error } from "@sveltejs/kit";
import { waitUntil } from "@vercel/functions";

export const getAcademicAnalysis = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;

	const activeSession = await findActiveWebSession(sessionUser);
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
	waitUntil(addRequestsMade(sessionUser, activeSession.id, 1));

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
