import type { ClientSettingsState } from "$lib/server/schema";

export const DEFAULT_SETTINGS: ClientSettingsState = {
	attendancePercentMin: 75,
	attendancePercentMax: 85,
	showAttendanceBarByDefault: false,
	expandAttendanceSubjects: "critical",
	invalidAttendanceMarker: "double-hyphen"
};
