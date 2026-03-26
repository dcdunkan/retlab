import { type SettingsState } from "../../drizzle/schema";

export const settingsState = createSettings();

export const DEFAULT_SETTINGS: SettingsState = {
	attendancePercentMin: 75,
	attendancePercentMax: 90,
	showAttendanceBarByDefault: false,
	expandAttendanceSubjects: "critical",
	invalidAttendanceMarker: "double-hyphen"
};

// https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/
function createSettings() {
	let resolved = $state(false);
	let value = $state<SettingsState>(DEFAULT_SETTINGS);

	return {
		get resolved() {
			return resolved;
		},
		resolve() {
			resolved = true;
		},
		get value() {
			return value;
		},
		set(settings: Partial<SettingsState>) {
			value = {
				...value,
				...settings
			};
		}
	};
}
