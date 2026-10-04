import { getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { attendance } from "$lib/generated/models";
import { makeSessionBoundProxy } from "$lib/server/etlab";
import { error } from "@sveltejs/kit";
import z from "zod";

export const getAttendance = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const sessionUser = event.locals.sessionUser;
	const etproxy = makeSessionBoundProxy(sessionUser);

	const attendanceData = await etproxy<attendance.AttendanceResponse>({
		endpoint: ApiEndPoints.ATTENDANCE_BY_SUBJECT_URL,
		method: "POST",
		body: {
			sem_id: ""
		} satisfies attendance.AttendanceRequest
	});

	if (!attendanceData.ok) {
		return error(attendanceData.statusCode, attendanceData.message);
	}

	// todo: handle attendanceData.login == false

	return attendanceData.data.subjects.map((subject) => {
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

export const getMonthlyAttendance = query(
	z.object({
		month: z.int().min(1).max(12),
		year: z.int().min(2020).max(2050)
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;
		const etproxy = makeSessionBoundProxy(sessionUser);

		const attendanceData = await etproxy<attendance.AttendanceNewResponse>({
			endpoint: ApiEndPoints.ATTENDANCE_BY_DAY_URL_NEW,
			method: "POST",
			body: {
				month: args.month.toString(),
				semester: sessionUser.account.semesterId.toString(),
				year: args.year.toString()
			} satisfies attendance.AttendanceRequestNew
		});

		if (!attendanceData.ok) return error(attendanceData.statusCode, attendanceData.message);

		return attendanceData.data.attends
			.map((day) => {
				return {
					date: day.date,
					holiday: !!day.holiday,
					periods: day.periods.filter(
						(period) =>
							period.subject != null &&
							period.subject !== "" &&
							(period.attendance === "absent" || period.attendance === "present")
					),
					totalPeriods: day.totalperiod
				};
			})
			.filter((day) => day.holiday || day.periods.length > 0)
			.reduce(
				(p, c) => {
					p[c.date] = c;
					return p;
				},
				{} as Record<
					string,
					{
						date: string;
						holiday: boolean;
						periods: attendance.AttendancePeriod[];
						totalPeriods: number | undefined;
					}
				>
			);
	}
);
