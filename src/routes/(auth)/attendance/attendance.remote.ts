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
			session.account.college.baseUrl + ApiEndPoints.ATTENDANCE_BY_SUBJECT_URL,
			{
				json: {
					sem_id: ""
				} satisfies attendance.AttendanceRequest,
				headers: {
					Authorization: "Bearer " + session.accessToken
				}
			}
		)
		.json();

	// todo: handle attendanceData.login == false

	return attendanceData.subjects.map((subject) => {
		// note: so apparently, subject.total_classes and subject.total_subject are
		// entirely two different things. no explanation yet.
		// hack: parse total_subject to actually use it.

		const normal = subject.total_subject.split("/").map((x) => Number(x));
		const duty_leave = subject.total_dutyleave.split("/").map((x) => Number(x));
		return {
			name: subject.subject,
			// @ts-expect-error invalid types
			code: subject.code,
			normal: {
				attended: normal[0],
				classes: normal[1]
			},
			duty_leave: {
				attended: duty_leave[0],
				classes: duty_leave[1]
			}
		};
	});
	// return [
	// 	{ a: 38, t: 50 },
	// 	{ a: 3, t: 4 }
	// ].map(({ a, t }) => ({ name: "A", code: "B", classes: t, attended: a }));
});
