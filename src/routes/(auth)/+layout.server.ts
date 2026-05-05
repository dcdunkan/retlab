import { DAY, SECOND } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints.js";
import { makeSessionBoundProxy } from "$lib/server/etlab.js";
import type {
	ClientNotificationServerSettingsState,
	ClientSettingsState
} from "$lib/server/schema.js";
import { error } from "@sveltejs/kit";

export const load = async (event) => {
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}
	const sessionUser = event.locals.sessionUser;

	const etproxy = makeSessionBoundProxy(event.locals.sessionUser);

	const semesters = await etproxy<
		{
			id: string;
			course_id: string;
			name: string;
			position: string;
			elective: string;
			program_elective: string;
			mooc_status: string;
			additional_elective: string;
		}[]
	>(
		{
			method: "GET",
			endpoint: ApiEndPoints.SEM_LIST_URL
		},
		{ useL1Cache: true, L1ExpiryInSeconds: (2 * DAY) / SECOND }
	);

	const processedSemesters = semesters.ok
		? semesters.data.map(
				(semester) =>
					({
						id: Number.parseInt(semester.id),
						course_id: Number.parseInt(semester.course_id),
						name: semester.name, // todo: parse itt!!!
						position: Number.parseInt(semester.position),
						elective: Number.parseInt(semester.elective),
						program_elective: Number.parseInt(semester.program_elective),
						mooc_status: Number.parseInt(semester.mooc_status),
						additional_elective: Number.parseInt(semester.additional_elective)
					}) satisfies Record<keyof Omit<(typeof semesters.data)[0], "name">, number> & {
						name: string;
					} // hack: retlab-generate should technically generate this, right?
			)
		: [];

	return {
		// todo: expose explicit stuff only
		semesters: processedSemesters,
		sessionUser: {
			session: {
				id: sessionUser.session.id,
				deviceInfo: sessionUser.session.deviceInfo,
				deviceType: sessionUser.session.deviceType,
				createdAt: sessionUser.session.createdAt
			},
			account: {
				username: sessionUser.account.username,
				semesterId: sessionUser.account.semesterId,
				lastUpdatedAt: sessionUser.account.lastUpdatedAt
			},
			college: {
				id: sessionUser.college.id,
				name: sessionUser.college.name,
				baseUrl: sessionUser.college.baseUrl
			},
			notificationServerSettings:
				sessionUser.notificationServerSettings == null
					? null
					: ({
							url: sessionUser.notificationServerSettings.url,
							vapidKey: sessionUser.notificationServerSettings.vapidKey
						} satisfies ClientNotificationServerSettingsState),
			settings:
				sessionUser.settings == null
					? null
					: ({
							attendancePercentMax: sessionUser.settings.attendancePercentMax,
							attendancePercentMin: sessionUser.settings.attendancePercentMin,
							expandAttendanceSubjects: sessionUser.settings.expandAttendanceSubjects,
							invalidAttendanceMarker: sessionUser.settings.invalidAttendanceMarker,
							showAttendanceBarByDefault: sessionUser.settings.showAttendanceBarByDefault
						} satisfies ClientSettingsState)
		}
	};
};
