// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Account, College, Session } from "$lib/prisma/client";

// import type { login } from '$lib/generated/models';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string | null;
			session:
				| (Session & {
						account: Account & {
							college: College;
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
