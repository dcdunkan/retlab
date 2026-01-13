import type { Settings } from "$lib/prisma/client";
import type { SettingsCreateWithoutAccountInput } from "$lib/prisma/models";

type SettingsState = Pick<Settings, keyof SettingsCreateWithoutAccountInput>;

export const settingsState = createSettings();

function createSettings() {
	let resolved = $state(false);
	let value = $state<SettingsState>({
		attendance_percent_min: 75,
		attendance_percent_max: 90
	});

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
