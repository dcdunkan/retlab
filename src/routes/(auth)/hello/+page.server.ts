import { error, redirect } from "@sveltejs/kit";

export const load = (event) => {
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}
	const sessionUser = event.locals.sessionUser;

	// if the user is already onboarded...
	if (sessionUser.account.onboardedAt != null) {
		return redirect(301, "/");
	}
};
