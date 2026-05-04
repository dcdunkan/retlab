import { LoadState, type LoadPending, type LoadRejected, type LoadResolved } from "./types";

export const l = {
	pending: (message: string): LoadPending => ({
		state: LoadState.Pending,
		message: message
	}),
	resolved: <T>(data: T): LoadResolved<T> => ({
		state: LoadState.Resolved,
		data: data
	}),
	rejected: (message: string): LoadRejected => ({
		state: LoadState.Rejected,
		message: message
	})
};

export const routes = {
	login: "/login",
	dashboard: "/"
} as const;

export const SECOND = 1000,
	MINUTE = 60 * SECOND,
	HOUR = 60 * MINUTE,
	DAY = 24 * HOUR;

export const ETLAB_RESPONSE_FRESH_EXPIRY = 15 * SECOND;
export const ETLAB_RESPONSE_STALE_EXPIRY = 30 * DAY;

export function safeDivision(numerator: number, denominator: number): number {
	return denominator == 0 ? 0 : numerator / denominator;
}

export function cutePercent(percent: number, decimals: number = 2): number {
	return Number.parseFloat(percent.toFixed(decimals));
}

export function pluralize(count: number, singular: string, plural: string): string {
	return count == 1 ? singular : plural;
}

export function parseServerDateString(dateString: string): Date {
	// const makeSearchString = (i: number) => "-" + i.toString().padStart(4, "0");
	// let counter = 1,
	// 	searchString = makeSearchString(counter);
	// while (dateString.search(searchString) != -1) {
	// 	console.log("replacing", counter);
	// 	dateString = dateString.replaceAll(searchString, `${new Date().getFullYear() - counter}`);
	// 	counter++;
	// 	searchString = makeSearchString(counter);
	// }

	const fixedDateString = dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1");
	return new Date(fixedDateString);
}

export function isValidDate(d: Date): boolean {
	return d instanceof Date && !isNaN(d.getTime());
}

// export function parseSubjectString(str: string) {

// }

export function negateFn<T extends unknown[]>(
	fn: (...args: T) => boolean
): (...args: T) => boolean {
	return (...args: T) => !fn(...args);
}

// source: https://www.xaymar.com/articles/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
// Pre-Init
const LUT_HEX_4b = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
	LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`;
}
// End Pre-Init
function toHex(buffer: Uint8Array) {
	let out = "";
	for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
		out += LUT_HEX_8b[buffer[idx]];
	}
	return out;
}
export async function hexSha256(data: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
	return toHex(new Uint8Array(hashBuffer));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeJson(obj: any) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: any = {};
	for (const k of Object.keys(obj).sort()) {
		const v = obj[k];
		result[k] =
			v && typeof v === "object" && !Array.isArray(v)
				? normalizeJson(v)
				: Array.isArray(v)
					? v.map(normalizeJson)
					: v;
	}
	return result;
}

// Source - https://stackoverflow.com/a/52171480
// Posted by bryc, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-04, License - CC BY-SA 4.0
export const cyrb53 = (str: string, seed = 0) => {
	let h1 = 0xdeadbeef ^ seed,
		h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
};

export const PROXY_RESPONSE_CACHE_STATUS = {
	Fresh: 0,
	Cached: 1,
	Stale: 2
} as const;

export function bearer(token: string) {
	return "Bearer " + token;
}
