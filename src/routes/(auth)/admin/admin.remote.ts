import { getRequestEvent, query } from "$app/server";
import { env } from "$env/dynamic/private";
import { db, schema } from "$lib/server/db";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export const getAccountCreationDates = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;

	if (
		sessionUser.college.id.toString() !== env.ADMIN_COLLEGE_ID ||
		sessionUser.account.username !== env.ADMIN_ACCOUNT_USERNAME
	) {
		return error(403, "Forbidden: not for your eyes!");
	}

	return await db
		.select({
			createdAt: schema.accounts.createdAt,
			hasEnabledNotifications: schema.notificationServerSettings.url
		})
		.from(schema.accounts)
		.leftJoin(
			schema.notificationServerSettings,
			and(
				eq(schema.accounts.collegeId, schema.notificationServerSettings.collegeId),
				eq(schema.accounts.username, schema.notificationServerSettings.accountUsername)
			)
		);
});
