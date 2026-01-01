import { error } from "@sveltejs/kit";

export const load = (event) => {
	if (event.locals.session == null) error(401, "Unauthorized");

	return {
		account: event.locals.session.account
	};
};
