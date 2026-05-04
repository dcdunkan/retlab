import { ApiEndPoints } from "$lib/generated/api-endpoints.js";
import { makeSessionBoundProxy } from "$lib/server/etlab.js";
import type {
	ClientNotificationServerSettingsState,
	ClientSettingsState
} from "$lib/server/schema.js";
import { error } from "@sveltejs/kit";

export const load = async (event) => {
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}
	const {
		account: { settings, notificationServerSettings, ...account },
		...session
	} = event.locals.session;

	const etproxy = makeSessionBoundProxy(event.locals.session);

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
	>({
		method: "GET",
		endpoint: ApiEndPoints.SEM_LIST_URL
	});

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
		session,
		account: {
			...account,
			settings:
				settings == null
					? null
					: ({
							attendancePercentMax: settings.attendancePercentMax,
							attendancePercentMin: settings.attendancePercentMin,
							expandAttendanceSubjects: settings.expandAttendanceSubjects,
							invalidAttendanceMarker: settings.invalidAttendanceMarker,
							showAttendanceBarByDefault: settings.showAttendanceBarByDefault
						} satisfies ClientSettingsState),
			notificationServerSettings:
				notificationServerSettings == null
					? null
					: ({
							url: notificationServerSettings.url,
							vapidKey: notificationServerSettings.vapidKey
						} satisfies ClientNotificationServerSettingsState)
		}
	};
};
