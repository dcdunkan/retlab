// See https://svelte.dev/docs/kit/types#app.d.ts

import type { ErrorCode } from "$lib/errors";
import type {
	Account,
	College,
	NotificationServerSettings,
	Session,
	Settings
} from "$lib/server/schema";

// import type { login } from '$lib/generated/models';

// for information about these interfaces
declare global {
	const __GIT_SHA__: string;
	const __GIT_SHORT_SHA__: string;

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
		interface Error {
			code: "NotificationServer:RESPONSE_MISMATCH";
			message: string;
		}
		interface Locals {
			sessionId: string | null;
			session:
				| (Session & {
						account: Account & {
							college: College;
							settings: Settings | null;
							notificationServerSettings: NotificationServerSettings | null;
						};
				  })
				| null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
