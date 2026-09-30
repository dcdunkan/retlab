import { command, getRequestEvent, query } from "$app/server";
import { WeblabRoutes } from "$lib/server/constants";
import { db, schema } from "$lib/server/db";
import type { OmittedAuthPk } from "$lib/server/schema";
import * as argon2 from "@node-rs/argon2";
import { error, isHttpError } from "@sveltejs/kit";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import * as crypto from "node:crypto";
import { parseSetCookie } from "set-cookie-parser";
import z from "zod";

const SESSION_ID_COOKIE_SUFFIX = "SESSIONID";
const MAX_WEB_SESSIONS = 20;

const WEB_ACCESS_KEY_LEN = 32,
	WEB_ACCESS_AES_NONCE_LEN = 12,
	WEB_ACCESS_KEY_SALT_LEN = 16;

async function deriveKey(passcode: string, salt: Uint8Array) {
	return await argon2.hashRaw(Buffer.from(passcode, "utf-8"), {
		salt: salt,
		timeCost: 4,
		parallelism: 4,
		memoryCost: 65536,
		outputLen: WEB_ACCESS_KEY_LEN,
		algorithm: 2, // argon2.Algorithm.Argon2id, // stupid verbatimmodulesyntax
		version: 1 // argon2.Version.V0x13
	});
}

export const setupWebAccess = command(
	z.object({
		password: z.string().nonempty("Password is empty").max(128, "That seems a bit too long..."),
		passcode: z
			.string()
			.length(6, "Passcode must be 6 characters long")
			.toUpperCase()
			.regex(/^[A-Z0-9]{6}$/, "Passcode can only contain numbers and letters")
	}),
	async (data) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");

		const sessionUser = event.locals.sessionUser;
		if (sessionUser.webAccessSettings != null)
			return error(400, "Web access is already enabled in this account!");

		const requestedAt = new Date();

		const hashSalt = crypto.randomBytes(WEB_ACCESS_KEY_SALT_LEN);
		const aesNonce = crypto.randomBytes(WEB_ACCESS_AES_NONCE_LEN);

		const key = await deriveKey(data.passcode, hashSalt);
		const cipher = crypto.createCipheriv("aes-256-gcm", key, aesNonce);
		const ciphertext = Buffer.concat([cipher.update(data.password, "utf-8"), cipher.final()]);
		const authtag = cipher.getAuthTag();

		key.fill(0); // zero it right after use, as Claude said.

		try {
			const sessionInitiationResponse = await loginToWeblab(
				sessionUser.college.baseUrl,
				sessionUser.account.username,
				data.password
			);
			if (!sessionInitiationResponse.success) {
				return error(400, sessionInitiationResponse.error); // yeah, blame the client
			}

			const webAccessDetails: Omit<typeof schema.webAccessSettings.$inferInsert, OmittedAuthPk> = {
				encryptedPassword: ciphertext.toString("base64"),
				encryptionAuthTag: authtag.toString("base64"),
				encryptionNonce: aesNonce.toString("base64"),
				hashSalt: hashSalt.toString("base64")
			};

			return await db.transaction(async (tx) => {
				const [inserted] = await tx
					.insert(schema.webAccessSettings)
					.values({
						accountUsername: sessionUser.account.username,
						collegeId: sessionUser.college.id,
						...webAccessDetails
					})
					.onConflictDoUpdate({
						target: [schema.webAccessSettings.collegeId, schema.webAccessSettings.accountUsername],
						set: { ...webAccessDetails }
					})
					.returning({
						setupAt: schema.webAccessSettings.setupAt
					});

				if (inserted == null) throw new Error("damn, should have been inserted");

				await tx
					.update(schema.webSessions)
					.set({ revokedAt: sql`now()` }) // note: revokedReason = null -> system revocation
					.where(
						and(
							eq(schema.webSessions.accountUsername, sessionUser.account.username),
							eq(schema.webSessions.collegeId, sessionUser.college.id),
							gte(schema.webSessions.expiresAt, sql`now()`),
							isNull(schema.webSessions.revokedAt)
						)
					);

				const sessionsToDelete = db
					.select({ id: schema.webSessions.id })
					.from(schema.webSessions)
					.where(
						and(
							eq(schema.webSessions.accountUsername, sessionUser.account.username),
							eq(schema.webSessions.collegeId, sessionUser.college.id)
						)
					)
					.orderBy(desc(schema.webSessions.loggedInAt))
					.offset(MAX_WEB_SESSIONS);
				await tx.delete(schema.webSessions).where(inArray(schema.webSessions.id, sessionsToDelete));

				const [newSession] = await tx
					.insert(schema.webSessions)
					.values({
						accountUsername: sessionUser.account.username,
						collegeId: sessionUser.college.id,
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
						requestsMade: schema.webSessions.requestsMade
					});

				return { setupAt: inserted.setupAt, webSession: newSession };
			});
		} catch (err) {
			if (isHttpError(err)) throw err;
			console.error(err);
			return error(500, "Something went wrong trying to initiate a web session.");
		}
	}
);

function findSessionIdCookieValue(response: Response, cookieNameEndsWith: string[]) {
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

export const authenticateWebAccess = command(
	z
		.string()
		.length(6, "Passcode must be 6 characters long")
		.toUpperCase()
		.regex(/^[A-Z0-9]{6}$/, "Passcode can only contain numbers and letters"),
	async (passcode) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.webAccessSettings == null)
			return error(400, "Web access is not enabled in this account!");

		const requestedAt = new Date();

		const key = await deriveKey(
			passcode,
			Buffer.from(sessionUser.webAccessSettings.hashSalt, "base64")
		);
		try {
			const decipher = crypto.createDecipheriv(
				"aes-256-gcm",
				key,
				Buffer.from(sessionUser.webAccessSettings.encryptionNonce, "base64")
			);
			decipher.setAuthTag(Buffer.from(sessionUser.webAccessSettings.encryptionAuthTag, "base64"));
			const passwordBuf = Buffer.concat([
				decipher.update(Buffer.from(sessionUser.webAccessSettings.encryptedPassword, "base64")),
				decipher.final() // throws if tag mismatch
			]);

			const sessionInitiationResponse = await loginToWeblab(
				sessionUser.college.baseUrl,
				sessionUser.account.username,
				passwordBuf.toString("utf8")
			);
			if (!sessionInitiationResponse.success) {
				return error(400, sessionInitiationResponse.error); // yeah, blame the client
			}

			return await db.transaction(async (tx) => {
				await tx
					.update(schema.webSessions)
					.set({ revokedAt: sql`now()` }) // note: revokedReason = null -> system revocation
					.where(
						and(
							eq(schema.webSessions.accountUsername, sessionUser.account.username),
							eq(schema.webSessions.collegeId, sessionUser.college.id),
							gte(schema.webSessions.expiresAt, sql`now()`),
							isNull(schema.webSessions.revokedAt)
						)
					);

				const sessionsToDelete = db
					.select({ id: schema.webSessions.id })
					.from(schema.webSessions)
					.where(
						and(
							eq(schema.webSessions.accountUsername, sessionUser.account.username),
							eq(schema.webSessions.collegeId, sessionUser.college.id)
						)
					)
					.orderBy(desc(schema.webSessions.loggedInAt))
					.offset(MAX_WEB_SESSIONS);
				await tx.delete(schema.webSessions).where(inArray(schema.webSessions.id, sessionsToDelete));

				const [newSession] = await tx
					.insert(schema.webSessions)
					.values({
						accountUsername: sessionUser.account.username,
						collegeId: sessionUser.college.id,
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
						requestsMade: schema.webSessions.requestsMade
					});

				return newSession;
			});
		} catch {
			return error(400, "Wrong passcode!"); // note: don't leak whether it was tag-fail vs other error
		} finally {
			key.fill(0);
		}
	}
);

export const disableWebAccess = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const sessionUser = event.locals.sessionUser;
	if (sessionUser.webAccessSettings == null)
		return error(400, "Web access is not enabled in this account!");

	await db.transaction(async (tx) => {
		await tx
			.update(schema.webSessions)
			.set({ revokedAt: sql`now()` }) // note: revokedReason = null -> system revocation
			.where(
				and(
					eq(schema.webSessions.accountUsername, sessionUser.account.username),
					eq(schema.webSessions.collegeId, sessionUser.college.id),
					gte(schema.webSessions.expiresAt, sql`now()`),
					isNull(schema.webSessions.revokedAt)
				)
			);

		await tx
			.delete(schema.webAccessSettings)
			.where(
				and(
					eq(schema.webAccessSettings.accountUsername, sessionUser.account.username),
					eq(schema.webAccessSettings.collegeId, sessionUser.college.id)
				)
			);
	});
});

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
		if (sessionUser.webAccessSettings == null)
			return error(400, "Web access is not enabled in this account!");

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
	// if (sessionUser.webAccessSettings == null)
	// 	return error(400, "Web access is not enabled in this account!");

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
