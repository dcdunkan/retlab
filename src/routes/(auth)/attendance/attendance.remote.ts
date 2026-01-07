import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { attendance } from "$lib/generated/models";
import { api } from "$lib/server";
import { error } from "@sveltejs/kit";

export const getAttendance = query(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}
	const session = event.locals.session;
	const attendanceData = await api
		.post<attendance.AttendanceResponse>(
			session.account.college.base_url + ApiEndPoints.ATTENDANCE_BY_SUBJECT_URL,
			{
				json: {
					sem_id: ""
				} satisfies attendance.AttendanceRequest,
				headers: {
					Authorization: "Bearer " + session.access_token
				}
			}
		)
		.json();

	// todo: handle attendanceData.login == false
	return attendanceData.subjects.map((subject) => {
		// note: so apparently, subject.total and subject.total_subject are
		// entirely two different things. no explanation yet.
		// hack: parse total_subject to actually use it.

		const [attended, classes] = subject.total_subject.split("/").map((x) => Number(x));
		// todo: duty leave mode.
		return {
			name: subject.subject,
			// @ts-expect-error invalid types
			code: subject.code,
			classes: classes,
			attended: attended
		};
	});
	// return [
	// 	{ a: 38, t: 50 },
	// 	{ a: 3, t: 4 }
	// ].map(({ a, t }) => ({ name: "A", code: "B", classes: t, attended: a }));
});
