import { command, form, getRequestEvent } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import { ONBOARDING_DATA_SCHEMA } from "./onboarding.schema";
import { db, schema } from "$lib/server/db";
import { and, eq, sql } from "drizzle-orm";

export const saveDetails = form(ONBOARDING_DATA_SCHEMA, async (args) => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const sessionUser = event.locals.sessionUser;

	await db.transaction(async (tx) => {
		await tx
			.update(schema.accounts)
			.set({
				displayName: args.displayName,
				semesterId: args.semesterId,
				onboardedAt: sql`now()`,
				onboardingSkipped: false
			})
			.where(
				and(
					eq(schema.accounts.collegeId, sessionUser.college.id),
					eq(schema.accounts.username, sessionUser.account.username)
				)
			);

		await tx
			.insert(schema.settings)
			.values({
				collegeId: sessionUser.college.id,
				accountUsername: sessionUser.account.username,
				attendancePercentMax: args.attendancePercentMax,
				attendancePercentMin: args.attendancePercentMin
			})
			.onConflictDoUpdate({
				target: [schema.settings.collegeId, schema.settings.accountUsername],
				set: {
					attendancePercentMax: args.attendancePercentMax,
					attendancePercentMin: args.attendancePercentMin
				}
			});
	});

	return redirect(307, "/");
});

export const skipOnboarding = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const sessionUser = event.locals.sessionUser;

	await db
		.update(schema.accounts)
		.set({ onboardingSkipped: true })
		.where(
			and(
				eq(schema.accounts.collegeId, sessionUser.college.id),
				eq(schema.accounts.username, sessionUser.account.username)
			)
		);
});
