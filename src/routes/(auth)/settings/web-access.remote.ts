import { command, getRequestEvent, query } from "$app/server";
import { db, schema } from "$lib/server/db";
import { acquireNewWebSession, MAX_WEB_SESSIONS } from "$lib/server/web-access";
import { error } from "@sveltejs/kit";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

export const authenticateWebSession = command(
	z.object({
		password: z.string().nonempty("Password is empty").max(128, "That seems a bit too long...")
	}),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;

		const attempt = await acquireNewWebSession(sessionUser, args.password);
		if (!attempt.acquired) {
			return error(400, attempt.message);
		}

		return {
			id: attempt.session.id,
			lastUsedAt: attempt.session.lastUsedAt,
			expiresAt: attempt.session.expiresAt,
			loggedInAt: attempt.session.loggedInAt,
			requestedAt: attempt.session.requestedAt,
			requestsMade: attempt.session.requestsMade,
			revokedAt: attempt.session.revokedAt,
			revokedReason: attempt.session.revokedReason
		};
	}
);

// todo: logoout
// async function logoutWeblab(collegeBaseUrl: string, cookieString: string) {
// 	const logoutUrl = new URL(WeblabRoutes.LOGOUT_URL, collegeBaseUrl);
// 	const response = await fetch(logoutUrl, {
// 		headers: { Cookie: cookieString },
// 		redirect: "follow"
// 	});
// 	console.log(response);
// }

export const revokeWebSession = command(
	z.object({
		id: z.string().nonempty().max(128),
		reason: z
			.string()
			.nonempty()
			.max(120)
			.transform((t) => t.replace(/\s+/g, " "))
	}),
	async (details) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;

		const [webSession] = await db
			.select({
				cookieString: schema.webSessions.cookieString,
				revokedAt: schema.webSessions.revokedAt,
				expiresAt: schema.webSessions.expiresAt
			})
			.from(schema.webSessions)
			.where(
				and(
					eq(schema.webSessions.accountUsername, sessionUser.account.username),
					eq(schema.webSessions.collegeId, sessionUser.college.id),
					eq(schema.webSessions.id, details.id)
				)
			)
			.limit(1);

		if (webSession == null) return error(400, "You don't have such a web session");
		if (webSession.revokedAt != null) return error(400, "This session has already been revoked!");
		if (webSession.expiresAt <= new Date())
			return error(400, "This session has already been expired!");

		// todo: no need to call logout, as we won't ever re-use expired ones.
		// but good to have the logging out enabled as well.
		// await logoutWeblab(sessionUser.college.baseUrl, webSession.cookieString);

		const [revoked] = await db
			.update(schema.webSessions)
			.set({
				revokedAt: sql`now()`,
				revokedReason: details.reason
			})
			.where(
				and(
					eq(schema.webSessions.accountUsername, sessionUser.account.username),
					eq(schema.webSessions.collegeId, sessionUser.college.id),
					eq(schema.webSessions.id, details.id)
				)
			)
			.returning({
				id: schema.webSessions.id,
				revokedAt: schema.webSessions.revokedAt,
				revokedReason: schema.webSessions.revokedReason,
				expiresAt: schema.webSessions.expiresAt,
				loggedInAt: schema.webSessions.loggedInAt,
				requestedAt: schema.webSessions.requestedAt,
				lastUsedAt: schema.webSessions.lastUsedAt,
				requestsMade: schema.webSessions.requestsMade
			});

		return revoked;
	}
);

export const getMyWebSessions = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const sessionUser = event.locals.sessionUser;

	const wsessions = await db
		.select({
			id: schema.webSessions.id,
			revokedAt: schema.webSessions.revokedAt,
			revokedReason: schema.webSessions.revokedReason,
			expiresAt: schema.webSessions.expiresAt,
			loggedInAt: schema.webSessions.loggedInAt,
			requestedAt: schema.webSessions.requestedAt,
			lastUsedAt: schema.webSessions.lastUsedAt,
			requestsMade: schema.webSessions.requestsMade
		})
		.from(schema.webSessions)
		.where(
			and(
				eq(schema.webSessions.accountUsername, sessionUser.account.username),
				eq(schema.webSessions.collegeId, sessionUser.college.id)
			)
		)
		.orderBy(desc(schema.webSessions.loggedInAt))
		.limit(MAX_WEB_SESSIONS);

	const now = new Date();

	type Sesh = (typeof wsessions)[number];

	const grouped: Record<"active" | "expired", Sesh[]> = {
		active: [],
		expired: []
	};
	for (const wsesh of wsessions) {
		if (wsesh.expiresAt <= now || wsesh.revokedAt != null) {
			grouped.expired.push(wsesh);
		} else {
			grouped.active.push(wsesh);
		}
	}
	return grouped;
});
