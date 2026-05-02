// Why not just simply export the state? Read more here:
// https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/

import type {
	ClientNotificationServerSettingsState,
	ClientSettingsState
} from "$lib/server/schema";
import { DEFAULT_SETTINGS } from "./settings/default-settings";

export const settingsState = createSettings();

function createSettings() {
	let resolved = $state(false);
	let value = $state<ClientSettingsState>(DEFAULT_SETTINGS);

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
		set(settings: Partial<ClientSettingsState>) {
			value = {
				...value,
				...settings
			};
		}
	};
}

export const notificationServerSettingsState = createNotificationSettings();

function createNotificationSettings() {
	let resolved = $state(false);
	let value = $state<ClientNotificationServerSettingsState>(null);

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
		set(notificationServerSettings: ClientNotificationServerSettingsState) {
			value = notificationServerSettings;
		}
	};
}
