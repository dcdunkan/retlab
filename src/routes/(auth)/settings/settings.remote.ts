import { command, getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { dash, login } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { error } from "@sveltejs/kit";
import z from "zod";
import { settingsSchema } from "./settings-schema";
import type { SettingsState } from "$lib/server/drizzle/schema";
import { db, schema } from "$lib/server/db";
import { and, eq } from "drizzle-orm";

export const updateSettings = command(settingsSchema, async (data) => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const session = event.locals.session;

	const updated: SettingsState = {
		attendancePercentMax: data.attendancePercentMax,
		attendancePercentMin: data.attendancePercentMin,
		expandAttendanceSubjects: data.expandAttendanceSubjects,
		invalidAttendanceMarker: data.invalidAttendanceMarker,
		showAttendanceBarByDefault: data.showAttendanceBarByDefault
	};

	await db
		.insert(schema.settings)
		.values({
			collegeId: session.account.collegeId,
			accountUsername: session.account.username,
			...updated
		})
		.onConflictDoUpdate({
			set: updated,
			target: [schema.settings.collegeId, schema.settings.accountUsername]
		});

	// event.locals.session.account.settings = settings; // note for myself: wont work, use shared states
});

export const getSessions = query(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const session = event.locals.session;

	return await db.query.sessions.findMany({
		where: and(
			eq(schema.sessions.collegeId, session.collegeId),
			eq(schema.sessions.accountUsername, session.accountUsername)
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
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}
	const session = event.locals.session;

	const response = await api.get<dash.DashResponse>(
		session.account.college.baseUrl + ApiEndPoints.DASH_URL,
		{ headers: { Authorization: "Bearer " + session.accessToken } }
	);
	if (response.ok) {
		const parsed: dash.DashResponse = await response.json();
		if (parsed.login == false) {
			// todo: logout
			return error(401, "Seems logged out?"); // wont ever really happen
		} else {
			const [account] = await db
				.update(schema.accounts)
				.set({
					batchId: Number.parseInt(parsed.batch_id),
					semesterId: Number.parseInt(parsed.sem_id),
					studentId: Number.parseInt(parsed.student_id),
					// @ts-expect-error invalid types
					profileName: parsed.name,
					courseName: parsed.course,
					semesterName: parsed.curnt_sem,
					imageUrl: parsed.url,
					// @ts-expect-error invalid types
					regNo: String(parsed.register_no),
					// @ts-expect-error invalid types
					rollNo: String(parsed.roll_no),
					lastUpdatedAt: new Date()
				})
				.where(
					and(
						eq(schema.accounts.collegeId, session.account.college.id),
						eq(schema.accounts.username, session.account.username)
					)
				)
				.returning();

			event.locals.session.account = {
				...account,
				college: session.account.college,
				settings: session.account.settings
			};
			return event.locals.session.account.lastUpdatedAt;
		}
	} else {
		return error(500, `Dashboard API returned ${response.status}`);
	}
});

export const logoutSession = command(z.object({ session_id: z.string() }), async (args) => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const currentSession = event.locals.session;
	const [session] = await db
		.delete(schema.sessions)
		.where(eq(schema.sessions.id, args.session_id))
		.returning();

	await api.post(currentSession.account.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + session.accessToken },
		json: {
			push_token: ""
		} satisfies login.LogoutRequest
	});
});

export const logoutCurrentSession = command(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const session = event.locals.session;
	await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
	await api.post(session.account.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + session.accessToken },
		json: {
			push_token: ""
		} satisfies login.LogoutRequest
	});

	auth.deleteTokenCookies(event);
	event.locals.sessionId = null;
	event.locals.session = null;

	return { logout: true };
});

export const destroyAccount = command(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const currentSession = event.locals.session;

	const sessions = await db
		.select()
		.from(schema.sessions)
		.where(
			and(
				eq(schema.sessions.collegeId, currentSession.collegeId),
				eq(schema.sessions.accountUsername, currentSession.accountUsername)
			)
		);
	await db
		.delete(schema.accounts)
		.where(
			and(
				eq(schema.accounts.collegeId, currentSession.account.collegeId),
				eq(schema.accounts.username, currentSession.account.username)
			)
		);

	await Promise.all(
		sessions.map((session) => {
			return api.post(currentSession.account.college.baseUrl + ApiEndPoints.LOGOUT_URL, {
				headers: { Authorization: "Bearer " + session.accessToken },
				json: {
					push_token: ""
				} satisfies login.LogoutRequest
			});
		})
	);

	auth.deleteTokenCookies(event);
	event.locals.sessionId = null;
	event.locals.session = null;

	return { logout: true };
});
