import { command, getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { dash, login } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { db, schema, sessionCacheTag } from "$lib/server/db";
import type { ClientSettingsState } from "$lib/server/schema";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { settingsSchema } from "./settings-schema";

export const updateTweaks = command(settingsSchema, async (data) => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}

	const sessionUser = event.locals.sessionUser;

	const updated: ClientSettingsState = {
		attendancePercentMax: data.attendancePercentMax,
		attendancePercentMin: data.attendancePercentMin,
		expandAttendanceSubjects: data.expandAttendanceSubjects,
		invalidAttendanceMarker: data.invalidAttendanceMarker,
		showAttendanceBarByDefault: data.showAttendanceBarByDefault
	};

	await db
		.insert(schema.settings)
		.values({
			collegeId: sessionUser.college.id,
			accountUsername: sessionUser.account.username,
			...updated
			// other by default nulls will be NULL
		})
		.onConflictDoUpdate({
			set: updated,
			target: [schema.settings.collegeId, schema.settings.accountUsername]
		});
});

export const getSessions = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}
	const sessionUser = event.locals.sessionUser;

	await db
		.select({
			id: schema.sessions.id,
			deviceInfo: schema.sessions.deviceInfo,
			deviceType: schema.sessions.deviceType,
			createdAt: schema.sessions.createdAt
		})
		.from(schema.sessions)
		.where(
			and(
				eq(schema.sessions.collegeId, sessionUser.college.id),
				eq(schema.sessions.accountUsername, sessionUser.account.username)
			)
		)
		.$withCache();

	return await db.query.sessions.findMany({
		where: and(
			eq(schema.sessions.collegeId, sessionUser.college.id),
			eq(schema.sessions.accountUsername, sessionUser.account.username)
		),
		columns: {
			id: true,
			deviceInfo: true,
			deviceType: true,
			createdAt: true
		}
	});
});

export const refreshHardCache = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}
	const sessionUser = event.locals.sessionUser;

	const response = await api.get<dash.DashResponse>(
		sessionUser.college.baseUrl + ApiEndPoints.DASH_URL,
		{ headers: { Authorization: "Bearer " + sessionUser.session.accessToken } }
	);
	if (response.ok) {
		const parsed: dash.DashResponse = await response.json();
		if (parsed.login == false) {
			// todo: logout
			return error(401, "Seems logged out?"); // wont ever really happen
		} else {
			const [updatedAccount] = await db
				.update(schema.accounts)
				.set({
					profileName:
						// @ts-expect-error invalid types
						parsed.name,
					imageUrl: parsed.url,

					batchId: Number.parseInt(parsed.batch_id),
					semesterId: Number.parseInt(parsed.sem_id),
					semesterName: parsed.curnt_sem,
					courseName: parsed.course,

					lastUpdatedAt: new Date()
				})
				.where(
					and(
						eq(schema.accounts.collegeId, sessionUser.college.id),
						eq(schema.accounts.username, sessionUser.account.username)
					)
				)
				.returning();

			await db.$cache.invalidate({ tags: [sessionCacheTag(sessionUser.session.id)] });

			// todo: is it really useful?
			// event.locals.session.account = {
			// 	...account,
			// 	college: session.account.college,
			// 	settings: session.account.settings,
			// 	notificationServerSettings: session.account.notificationServerSettings
			// };
			return updatedAccount.lastUpdatedAt;
		}
	} else {
		return error(500, `Dashboard API returned ${response.status}`);
	}
});

export const logoutSession = command(z.object({ session_id: z.string() }), async (args) => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}

	const sessionUser = event.locals.sessionUser;
	const [session] = await db
		.delete(schema.sessions)
		.where(eq(schema.sessions.id, args.session_id))
		.returning();

	await api.post(sessionUser.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + session.accessToken },
		json: {
			push_token: ""
		} satisfies login.LogoutRequest
	});
});

export const logoutCurrentSession = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}

	const sessionUser = event.locals.sessionUser;
	await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionUser.session.id));
	await api.post(sessionUser.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + sessionUser.session.accessToken },
		json: {
			push_token: ""
		} satisfies login.LogoutRequest
	});

	auth.deleteTokenCookies(event);
	// event.locals.sessionId = null;
	// event.locals.sessionUser = null;

	return { logout: true };
});

export const destroyAccount = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) {
		return error(401, "Unauthorized");
	}

	const sessionUser = event.locals.sessionUser;

	const sessions = await db
		.select({ accessToken: schema.sessions.accessToken })
		.from(schema.sessions)
		.where(
			and(
				eq(schema.sessions.collegeId, sessionUser.college.id),
				eq(schema.sessions.accountUsername, sessionUser.account.username)
			)
		);
	await db
		.delete(schema.accounts)
		.where(
			and(
				eq(schema.accounts.collegeId, sessionUser.college.id),
				eq(schema.accounts.username, sessionUser.account.username)
			)
		);

	await db.$cache.invalidate({ tags: [sessionCacheTag(sessionUser.session.id)] });

	await Promise.all(
		sessions.map((session) => {
			return api.post(sessionUser.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
				headers: { Authorization: "Bearer " + session.accessToken },
				json: {
					push_token: ""
				} satisfies login.LogoutRequest
			});
		})
	);

	auth.deleteTokenCookies(event);
	// event.locals.sessionId = null;
	// event.locals.sessionUser = null;

	return { logout: true };
});

export const changeAccountDisplayName = command(
	z.object({
		displayName: z
			.string()
			.trim()
			.min(1, "Display name cannot be empty")
			.max(24, "Display name must be atmost 24 characters long")
			.regex(/^[a-zA-Z0-9 ]+$/u, "Display name contains invalid characters!")
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;

		if (sessionUser.account.displayName === args.displayName)
			return error(400, "It's the same as your current display name!");

		const [updated] = await db
			.update(schema.accounts)
			.set({
				displayName: args.displayName
			})
			.where(
				and(
					eq(schema.accounts.username, sessionUser.account.username),
					eq(schema.accounts.collegeId, sessionUser.college.id)
				)
			)
			.returning({
				displayName: schema.accounts.displayName
			});

		if (updated == null) return error(400, "Something went wrong while updating display name!");

		await db.$cache.invalidate({ tags: [sessionCacheTag(sessionUser.session.id)] });

		return {
			displayName: updated.displayName
		};
	}
);
