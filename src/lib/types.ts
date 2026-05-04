import type { PROXY_RESPONSE_CACHE_STATUS } from "$lib";

export enum LoadState {
	Pending = "pending",
	Resolved = "resolved",
	Rejected = "rejected"
}

export type LoadResolved<T> = { state: LoadState.Resolved; data: T };
export type LoadPending = { state: LoadState.Pending; message: string };
export type LoadRejected = { state: LoadState.Rejected; message: string };
export type LoadData<T> = LoadPending | LoadRejected | LoadResolved<T>;

export type JWTPayloadData = {
	sessionId: string;
};

export type ExpandAttendanceSubjectCardsOption =
	| "none"
	| "critical"
	| "barely-safe"
	| "below-excellence"
	| "all";

export type ResponseCacheStatus =
	(typeof PROXY_RESPONSE_CACHE_STATUS)[keyof typeof PROXY_RESPONSE_CACHE_STATUS];

// | "double-hyphen"
// | "single-hyphen"
// | "mdash"
// | "ndash";
