// Why not just simply export the state? Read more here:
// https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/

import type {
	ClientNotificationServerSettingsState,
	ClientSettingsState
} from "$lib/server/schema";
import { isHttpError, isValidationError, type RemoteQueryFunction } from "@sveltejs/kit";
import { DEFAULT_SETTINGS } from "./settings/default-settings";
import { cyrb53, ETLAB_RESPONSE_FRESH_EXPIRY, ETLAB_RESPONSE_STALE_EXPIRY } from "$lib";
import { IDBStore } from "$lib/indexeddb";

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

export const idb = createResolvableState<{
	cacheStorageIdb: IDBDatabase;
	etlabResponseCache: IDBStore<{
		key: string;
		data: unknown;
		timestamp: number;
	}>;
}>();

function createResolvableState<T>() {
	let value = $state<T>();
	let resolved = $state(false);

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
		set(newValue: T) {
			value = newValue;
			if (!resolved) idb.resolve();
		}
	} as {
		resolve(): void;
		set(newValue: T): void;
	} & (
		| { readonly resolved: true; readonly value: T }
		| { readonly resolved: false; readonly value: undefined }
	);
}

export function cachedGracefulRemoteQuery<I, O>(
	cacheInfo: { name: string; version: number },
	remoteQuery: RemoteQueryFunction<I, O>
) {
	let loading = $state.raw<boolean>(true);
	let data = $state.raw<O>();
	let error = $state.raw<unknown>();

	function computeCacheKey(stringifiedInput: string) {
		return (
			`${cacheInfo.name}:${cacheInfo.version}` +
			(typeof stringifiedInput !== "string" ? "" : ":" + cyrb53(stringifiedInput))
		);
	}

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get data() {
			return data;
		},
		async load(input: I) {
			loading = true;
			data = undefined;
			error = undefined;

			const now = Date.now();
			const cacheKey = computeCacheKey(JSON.stringify(input));

			if (idb.resolved) {
				const cached = await idb.value.etlabResponseCache.get(cacheKey);
				if (cached != null && cached.timestamp + ETLAB_RESPONSE_FRESH_EXPIRY > now) {
					data = cached.data as O;
					loading = false;
					return;
				}
			}

			try {
				data = await remoteQuery(input);
				if (idb.resolved) {
					await idb.value.etlabResponseCache.put({
						key: cacheKey,
						data: data,
						timestamp: now
					});
				}
			} catch (err) {
				error = err;
				if (!isHttpError(err) && !isValidationError(err) && idb.resolved) {
					const cached = await idb.value.etlabResponseCache.get(cacheKey);
					if (cached != null) {
						if (cached.timestamp + ETLAB_RESPONSE_STALE_EXPIRY > now) {
							data = cached.data as O;
							return;
						} else {
							await idb.value.etlabResponseCache.delete(cacheKey);
						}
					}
				}
			} finally {
				loading = false;
			}
		}
	};
}
