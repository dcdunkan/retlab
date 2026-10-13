import { getRequestEvent, query } from "$app/server";
import { WeblabRoutes } from "$lib/server/constants";
import { addRequestsMade, findActiveWebSession } from "$lib/server/web-access";
import { parseAcademicAnalysisPage } from "$lib/server/weblab-parsers/academic-analysis";
import type { Weblab } from "$lib/server/weblab-parsers/types";
import { error } from "@sveltejs/kit";
import { waitUntil } from "@vercel/functions";

function areSubjectsSame(
	a: Weblab.AcademicAnalysis.SemesterSubject,
	b: Weblab.AcademicAnalysis.SemesterSubject
): boolean {
	return (
		a.code === b.code &&
		a.name === b.name &&
		a.result === b.result &&
		a.internalMarks === b.internalMarks &&
		a.grade === b.grade &&
		a.gpa === b.gpa &&
		a.earnedCredits === b.earnedCredits &&
		a.chances === b.chances &&
		a.attendance.attended === b.attendance.attended &&
		a.attendance.classes === b.attendance.classes &&
		a.seriesExams.length === b.seriesExams.length &&
		a.seriesExams.every((ase, i) => {
			const bse = b.seriesExams[i];
			return (
				ase.classAverage.max === bse.classAverage.max &&
				ase.classAverage.obtained === bse.classAverage.obtained &&
				ase.classRank === bse.classRank &&
				ase.slNo === bse.slNo &&
				ase.subject === bse.subject &&
				ase.name === bse.name &&
				ase.marks.max === bse.marks.max &&
				ase.marks.obtained === bse.marks.obtained
			);
		})
	);
}

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
		const parsed = parseAcademicAnalysisPage(await response.text()).map((semester) => {
			return {
				...semester,
				subjects: semester.subjects.filter((a, index, arr) => {
					return index === arr.findIndex((b) => areSubjectsSame(a, b));
				})
			};
		});
		return parsed;
	} catch {
		return error(500, "Failed to parse academic analysis page");
	}
});
