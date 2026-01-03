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
