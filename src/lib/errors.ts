export const NOTIFICATION_SERVER_ERRORS = [
	"UNAUTHORIZED",
	"BAD_REQUEST",
	"NOT_FOUND",
	"INTERNAL_SERVER_ERROR"
] as const satisfies string[];

export const ErrorCodes = makeErrorCodes({
	Network: ["INTERNAL_SERVER_ERROR", "UNREACHABLE_SERVER"],
	Core: ["UNKNOWN_ERROR"],
	NotificationServer: [
		// from server
		...NOTIFICATION_SERVER_ERRORS,

		// internally resolved
		"SERVER_KEYS_UNKNOWN",
		"UNKNOWN_ERROR",
		"REQUEST_FAILED",
		"RESPONSE_MISMATCH",
		"DECRYPTION_FAILED",
		"HEALTH_CHECK_FAILED"
	]
} as const);

export type ErrorCode = NamespacedCodes<typeof ErrorCodes>;

type MakeErrorCodes<T extends Record<string, readonly string[]>> = {
	readonly [N in keyof T]: {
		readonly [K in T[N][number]]: `${N & string}:${K}`;
	};
};

export type NamespacedCodes<T> = {
	[N in keyof T]: { [K in keyof T[N]]: T[N][K] }[keyof T[N]];
}[keyof T];

function makeErrorCodes<T extends Record<string, readonly string[]>>(input: T): MakeErrorCodes<T> {
	const result = {} as Record<string, Record<string, string>>;

	for (const namespace in input) {
		result[namespace] = {};
		for (const key of input[namespace]) {
			if (key in result[namespace]) {
				throw new Error(`Duplicate error code key "${key}" in namespace "${namespace}"`);
			}
			result[namespace][key] = `${namespace}:${key}`;
		}
	}

	return result as MakeErrorCodes<T>;
}
