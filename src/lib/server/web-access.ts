import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { parseSetCookie, type Cookie } from "set-cookie-parser";
import { WeblabRoutes } from "./constants";

const SESSION_ID_COOKIE_SUFFIX = "SESSIONID";
export const MAX_WEB_SESSIONS = 20;

export async function findActiveWebSession(
	user: SessionUser
): Promise<{ id: string; cookieString: string }> {
	const [activeSession] = await db
		.select({
			id: schema.webSessions.id,
			cookieString: schema.webSessions.cookieString
		})
		.from(schema.webSessions)
		.where(
			and(
				eq(schema.webSessions.accountUsername, user.account.username),
				eq(schema.webSessions.collegeId, user.college.id),
				isNull(schema.webSessions.revokedAt),
				gte(schema.webSessions.expiresAt, sql`now()`)
			)
		);

	return activeSession;
}

export async function addRequestsMade(
	user: SessionUser,
	sessionId: string,
	count: number
): Promise<void> {
	await db
		.update(schema.webSessions)
		.set({
			requestsMade: sql`${schema.webSessions.requestsMade} + ${count}`,
			lastUsedAt: sql`now()`
		})
		.where(
			and(
				eq(schema.webSessions.accountUsername, user.account.username),
				eq(schema.webSessions.collegeId, user.college.id),
				eq(schema.webSessions.id, sessionId)
			)
		)
		.returning({
			cookieString: schema.webSessions.cookieString
		});
}

function findSessionIdCookieValue(
	response: Response,
	cookieNameEndsWith: string[]
): Cookie | undefined {
	const cookies = response.headers.getSetCookie();
	const parsed = parseSetCookie(cookies, { decodeValues: true });
	for (const suffix of cookieNameEndsWith) {
		const cookie = parsed.find((c) => c.name.endsWith(suffix));
		if (cookie != null) return cookie;
	}
}

async function loginToWeblab(
	collegeBaseUrl: string,
	username: string,
	password: string
): Promise<{ success: true; name: string; value: string } | { success: false; error: string }> {
	const parsedCollegeBaseUrl = new URL(collegeBaseUrl);
	const loginUrl = new URL(WeblabRoutes.LOGIN_URL, parsedCollegeBaseUrl);
	const authCheckUrl = new URL(WeblabRoutes.STUDENT_REMARKS_URL, parsedCollegeBaseUrl); // note: keep it light as possible, remarks will load in a minimum time.

	const r1 = await fetch(loginUrl);
	if (!r1.ok) return { success: false, error: "Could not fetch the login page" };

	const hostnameParts = parsedCollegeBaseUrl.hostname.split(".");
	const targetCookieEndsWith: string[] = [SESSION_ID_COOKIE_SUFFIX];
	if (
		hostnameParts.length === 3 &&
		hostnameParts[1] === "etlab" &&
		(hostnameParts[2] === "in" || hostnameParts[2] === "app")
	) {
		const collegeShortname = hostnameParts[0].toUpperCase();
		targetCookieEndsWith.unshift(collegeShortname + SESSION_ID_COOKIE_SUFFIX);
	}
	const c1 = findSessionIdCookieValue(r1, targetCookieEndsWith);
	if (c1 == null)
		return { success: false, error: "Could not extract session ID cookie from initial request" };

	const formdata = new FormData();
	formdata.append("LoginForm[username]", username);
	formdata.append("LoginForm[password]", password);

	const r2 = await fetch(loginUrl, {
		method: "POST",
		body: formdata,
		redirect: "manual",
		headers: { Cookie: `${c1.name}=${c1.value}` }
	});
	if (r2.status !== 302) {
		return {
			success: false,
			error: "Failed to login, are you sure your password is correct?"
		};
	}

	const c2 = findSessionIdCookieValue(r2, targetCookieEndsWith);
	if (c2 == null)
		return { success: false, error: "Could not extract session ID cookie from login request" };

	const r3 = await fetch(authCheckUrl, {
		headers: { Cookie: `${c2.name}=${c2.value}` }
	});
	if (r3.status !== 200) {
		return { success: false, error: "Seems like login didn't work" };
	}
	return { success: true, name: c2.name, value: c2.value };
}

export async function acquireNewWebSession(
	user: SessionUser,
	password: string
): Promise<
	| { acquired: false; message: string }
	| {
			acquired: true;
			session: {
				id: string;
				revokedAt: Date | null;
				revokedReason: string | null;
				expiresAt: Date;
				loggedInAt: Date;
				requestedAt: Date;
				lastUsedAt: Date;
				requestsMade: number;
				cookieString: string;
			};
	  }
> {
	const requestedAt = new Date();

	const sessionInitiationResponse = await loginToWeblab(
		user.college.baseUrl,
		user.account.username,
		password
	);
	if (!sessionInitiationResponse.success) {
		return {
			acquired: false,
			message: sessionInitiationResponse.error
		}; // yeah, blame the client
	}

	const newSession = await db.transaction(async (tx) => {
		const sessionsToDelete = db
			.select({ id: schema.webSessions.id })
			.from(schema.webSessions)
			.where(
				and(
					eq(schema.webSessions.accountUsername, user.account.username),
					eq(schema.webSessions.collegeId, user.college.id)
				)
			)
			.orderBy(desc(schema.webSessions.loggedInAt))
			.offset(MAX_WEB_SESSIONS);
		await tx.delete(schema.webSessions).where(inArray(schema.webSessions.id, sessionsToDelete));

		await tx
			.update(schema.webSessions)
			.set({ revokedAt: sql`now()` }) // note: revokedReason = null -> system revocation
			.where(
				and(
					eq(schema.webSessions.accountUsername, user.account.username),
					eq(schema.webSessions.collegeId, user.college.id),
					gte(schema.webSessions.expiresAt, sql`now()`),
					isNull(schema.webSessions.revokedAt)
				)
			);

		const [newSession] = await tx
			.insert(schema.webSessions)
			.values({
				accountUsername: user.account.username,
				collegeId: user.college.id,
				cookieString: `${sessionInitiationResponse.name}=${sessionInitiationResponse.value}`,
				lastUsedAt: sql`now()`,
				requestedAt: requestedAt,
				expiresAt: sql`now() + interval '30 minute'`,
				requestsMade: 0
			})
			.returning({
				id: schema.webSessions.id,
				revokedAt: schema.webSessions.revokedAt,
				revokedReason: schema.webSessions.revokedReason,
				expiresAt: schema.webSessions.expiresAt,
				loggedInAt: schema.webSessions.loggedInAt,
				requestedAt: schema.webSessions.requestedAt,
				lastUsedAt: schema.webSessions.lastUsedAt,
				requestsMade: schema.webSessions.requestsMade,
				cookieString: schema.webSessions.cookieString
			});

		return newSession;
	});

	return {
		acquired: true,
		session: newSession
	};
}
