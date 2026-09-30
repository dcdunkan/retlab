// Why not just simply export the state? Read more here:
// https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/

import { cyrb53, ETLAB_RESPONSE_FRESH_EXPIRY, ETLAB_RESPONSE_STALE_EXPIRY } from "$lib";
import { IDBStore } from "$lib/indexeddb";
import type {
	ClientWebAccessSettingsState,
	ClientNotificationServerSettingsState,
	ClientSettingsState,
	DeviceType
} from "$lib/server/schema";
import { isHttpError, isValidationError, type RemoteQueryFunction } from "@sveltejs/kit";
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

export const auth = createResolvableState<{
	session: {
		id: string;
		deviceInfo: string | null;
		deviceType: DeviceType;
		createdAt: Date;
	};
	account: {
		username: string;
		semesterId: number;
		lastUpdatedAt: Date;
	};
	college: {
		id: number;
		name: string;
		baseUrl: string;
	};
}>();

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

export const webAccessSettingsState = createResolvableState<ClientWebAccessSettingsState>();

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
			if (!resolved) {
				resolved = true;
			}
		}
	} as {
		resolve(): void;
		set(newValue: T): void;
	} & ({ readonly resolved: true; readonly value: T } | { readonly resolved: false });
}

type CacheUserInfo = {
	college: {
		id: number;
	};
	account: {
		username: string;
	};
};

export type CachedLoadData<RQ> =
	RQ extends RemoteQueryFunction<infer I, infer O>
		? {
				readonly loading: boolean;
				readonly error: unknown;
				readonly data: O | undefined;
				load(user: CacheUserInfo, input: I): Promise<void>;
			}
		: never;

// todo: include user info in cache key
// todo: make sure to clear idb on logout
export function cachedGracefulRemoteQuery<I, O>(
	cacheInfo: {
		name: string;
		version: number;
	},
	remoteQuery: RemoteQueryFunction<I, O>
): CachedLoadData<RemoteQueryFunction<I, O>> {
	let loading = $state.raw<boolean>(true);
	let data = $state<O>();
	let error = $state.raw<unknown>();

	function computeCacheKey(cacheUser: CacheUserInfo, stringifiedInput: string) {
		return (
			`${cacheUser.college.id}-${cacheUser.account.username}:${cacheInfo.name}:${cacheInfo.version}` +
			(typeof stringifiedInput !== "string" ? "" : ":" + cyrb53(stringifiedInput))
		);
	}

	async function loadFn(cacheUser: CacheUserInfo, input: I) {
		loading = true;
		data = undefined;
		error = undefined;

		const now = Date.now();
		const cacheKey = computeCacheKey(cacheUser, JSON.stringify(input));

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
			error = null;
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
		async load(user: CacheUserInfo, input: I) {
			return await loadFn(user, input);
		}
	};
}

// function writableState<T>(initialValue: T) {
// 	let value = $state<T>(initialValue);
// 	return {
// 		get value() {
// 			return value;
// 		},
// 		set(newValue: T) {
// 			value = newValue;
// 		}
// 	};
// }

// type BeforeInstallPromptEvent = Event & {
// 	prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
// };
// export const deferredInstallPromptEvent = writableState<BeforeInstallPromptEvent | null>(null);
