// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ErrorCode } from "$lib/errors";

// for information about these interfaces
declare global {
	// defined values from vite-config, more like build variables
	const __GIT_SHA__: string;
	const __GIT_SHORT_SHA__: string;
	const __EXPERIMENTAL_WEB_TOGGLES__: ExperimentalWebToggles;

	type ExperimentalWebToggles = {
		upload_assignment_mode: "app" | "web";
		delete_assignment_mode: "app" | "web";
	};

	// sveltekit App
	namespace App {
		interface Error {
			code?: ErrorCode;
			message: string;
			errors?:
				| {
						type: "server-sent-validation-errors";
						errors: Record<string, string[]>;
				  }
				| {
						type: "schema-mismatch";
						input: unknown;
				  };
		}
		// i forgot why exactly I wrote this shit
		interface Error {
			code: "NotificationServer:RESPONSE_MISMATCH";
			message: string;
		}
		interface Locals {
			sessionId: string | null;
			sessionUser: {
				session: {
					id: string;
					accessToken: string;
					deviceInfo: string | null;
					deviceType: "LAPTOP" | "MOBILE" | "UNKNOWN";
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
				settings: {
					attendancePercentMax: number;
					attendancePercentMin: number;
					expandAttendanceSubjects: ExpandAttendanceSubjectCardsOption;
					invalidAttendanceMarker: "double-hyphen" | "single-hyphen" | "mdash" | "ndash";
					showAttendanceBarByDefault: boolean;
				} | null;
				notificationServerSettings: {
					url: string;
					apiKey: string;
					authToken: string;
					vapidKey: string;
					etlabAccessToken: string;
				} | null;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	export type SessionUser = NonNullable<App.Locals["sessionUser"]>;
}

export {};
