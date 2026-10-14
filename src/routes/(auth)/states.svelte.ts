// Why not just simply export the state? Read more here:
// https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/

import { cyrb53, ETLAB_RESPONSE_FRESH_EXPIRY, ETLAB_RESPONSE_STALE_EXPIRY } from "$lib";
import { IDBStore } from "$lib/indexeddb";
import type {
	ClientNotificationServerSettingsState,
	ClientSettingsState,
	DeviceType
} from "$lib/server/schema";
import type { ExpandAttendanceSubjectCardsOption } from "$lib/types";
import { isHttpError, isValidationError, type RemoteQueryFunction } from "@sveltejs/kit";
import { getContext, setContext } from "svelte";
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

export type ClientSessionUser = {
	session: {
		id: string;
		deviceInfo: string | null;
		deviceType: DeviceType;
		createdAt: Date;
	};
	account: {
		username: string;
		semesterId: number;
		profileName: string;
		displayName: string;
		lastUpdatedAt: Date;
	};
	college: {
		id: number;
		name: string;
		baseUrl: string;
	};
	notificationServerSettings: {
		url: string;
		vapidKey: string;
	} | null;
	settings: {
		attendancePercentMax: number;
		attendancePercentMin: number;
		expandAttendanceSubjects: ExpandAttendanceSubjectCardsOption;
		invalidAttendanceMarker: "double-hyphen" | "single-hyphen" | "mdash" | "ndash";
		showAttendanceBarByDefault: boolean;
	} | null;
};

const CLIENT_SESSION_USER_CONTEXT_KEY = Symbol("client-session-user");

export function setClientSessionUser(getData: () => ClientSessionUser): ClientSessionUser {
	const proxied = $state(getData());

	// pick up fresh server data after invalidate()/navigation
	$effect.pre(() => {
		Object.assign(proxied, getData());
	});

	setContext(CLIENT_SESSION_USER_CONTEXT_KEY, proxied);
	return proxied;
}

export function getClientSessionUser(): ClientSessionUser {
	const data = getContext<ClientSessionUser | undefined>(CLIENT_SESSION_USER_CONTEXT_KEY);
	if (data == null)
		throw new Error("getClientSessionUser() called outside an authenticated layout");
	return data;
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
				load(
					user: CacheUserInfo,
					input: I,
					options?: {
						readIdbCache?: boolean;
						writeIdbCache?: boolean;
					}
				): Promise<void>;
			}
		: never;

// todo: include user info in cache key
// todo: make sure to clear idb on logout
export function cachedGracefulRemoteQuery<I, O>(
	cacheInfo: {
		name: string | (() => string);
		version: number;
	},
	remoteQuery: RemoteQueryFunction<I, O>
): CachedLoadData<RemoteQueryFunction<I, O>> {
	let loading = $state.raw<boolean>(true);
	let data = $state<O>();
	let error = $state.raw<unknown>();

	const cacheInfoNameFn =
		typeof cacheInfo.name === "string" ? () => cacheInfo.name : cacheInfo.name;

	function computeCacheKey(cacheUser: CacheUserInfo, stringifiedInput: string) {
		return (
			`${cacheUser.college.id}-${cacheUser.account.username}:${cacheInfoNameFn()}:${cacheInfo.version}` +
			(typeof stringifiedInput !== "string" ? "" : ":" + cyrb53(stringifiedInput))
		);
	}

	async function loadFn(
		cacheUser: CacheUserInfo,
		input: I,
		options?: {
			readIdbCache?: boolean;
			writeIdbCache?: boolean;
		}
	): Promise<void> {
		loading = true;
		data = undefined;
		error = undefined;

		const skipCacheRead = options?.readIdbCache === false;
		const skipCacheWrite = options?.writeIdbCache === false;

		const now = Date.now();
		const cacheKey = computeCacheKey(cacheUser, JSON.stringify(input));

		if (!skipCacheRead && idb.resolved) {
			const cached = await idb.value.etlabResponseCache.get(cacheKey);
			if (cached != null && cached.timestamp + ETLAB_RESPONSE_FRESH_EXPIRY > now) {
				data = cached.data as O;
				loading = false;
				return;
			}
		}

		try {
			data = await remoteQuery(input);
			if (!skipCacheWrite && idb.resolved) {
				await idb.value.etlabResponseCache.put({
					key: cacheKey,
					data: data,
					timestamp: now
				});
			}
			error = null;
		} catch (err) {
			error = err;
			if (!skipCacheRead && !isHttpError(err) && !isValidationError(err) && idb.resolved) {
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
		async load(
			user: CacheUserInfo,
			input: I,
			options?: {
				readIdbCache?: boolean;
				writeIdbCache?: boolean;
			}
		): Promise<void> {
			return await loadFn(user, input, options);
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
