import { command, form, getRequestEvent, query } from "$app/server";
import { NOTIF_ENC_PRIVATE_KEY, NOTIF_SIGN_PRIVATE_KEY } from "$env/static/private";
import { hexSha256 } from "$lib";
import { ErrorCodes, NOTIFICATION_SERVER_ERRORS, type NamespacedCodes } from "$lib/errors";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { login } from "$lib/generated/models";
import { api, generateNsToken } from "$lib/server";
import {
	createMessage,
	openMessage,
	type EncryptedEnvelope,
	type PublicKeys
} from "$lib/server/crypto";
import { db, invalidateSessionCache, schema } from "$lib/server/db";
import type { NotificationServerSettingsState } from "$lib/server/schema";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import isNetworkError from "is-network-error";
import ky, { isKyError } from "ky";
import urlJoin from "url-join";
import z, { ZodError } from "zod/v4";
import { type $ZodType } from "zod/v4/core";
import { notificationServerSchema, serverConfigSchema } from "./settings-schema";
import { redis } from "$lib/server/redis";

function isNotificationServerError(
	code: string
): code is (typeof NOTIFICATION_SERVER_ERRORS)[number] {
	return (NOTIFICATION_SERVER_ERRORS as string[]).includes(code);
}

type NsSuccessResponse<T> = {
	ok: true;
	result: T;
};
type NsFailureResponse<E = unknown> = {
	ok: false;
	code: NamespacedCodes<typeof ErrorCodes>;
	message: string;
	error?: E;
};
type NsResponse<T, E> = NsSuccessResponse<T> | NsFailureResponse<E>;

async function makeNsRequest<T extends $ZodType, E extends $ZodType = $ZodType<unknown>>(
	serverUrl: string,
	route:
		| `GET ${"health" | "keys" | "vapid-key" | `subscription/${string}` | "configuration"}`
		| `POST ${"register" | "subscribe"}`
		| `PUT ${"configuration"}`
		| `DELETE ${"unregister" | "unsubscribe"}`,
	options: {
		schema: T;
		errorSchema?: E;
		auth?: { username: string; collegeId: number; apiKey: string };
		body?: unknown;
	}
): Promise<NsResponse<z.output<T>, z.output<E>>> {
	// Resolve server keys
	let serverKeys: PublicKeys | null = null;
	try {
		// check inside cache
		const redisCachedKeysKey = `nskc:${serverUrl}`;
		const cachedKeys = await redis.get<PublicKeys>(redisCachedKeysKey);
		if (cachedKeys != null) {
			serverKeys = cachedKeys;
		} else {
			// fetch fresh keys if missed in cache:
			const response = await ky.get(urlJoin(serverUrl, "/keys")).json<{ result: PublicKeys }>();
			await redis.set<PublicKeys>(
				redisCachedKeysKey,
				{
					enc: response.result.enc,
					sign: response.result.sign
				},
				{ ex: 8 * 60 * 60 /* 8 hours (in seconds) */ }
			);
			serverKeys = response.result;
		}
	} catch (err) {
		if (
			isNetworkError(err) &&
			err.cause instanceof Error &&
			"code" in err.cause &&
			typeof err.cause.code === "string"
		) {
			return {
				ok: false,
				code: "Network:UNREACHABLE_SERVER",
				message: "Couldn't reach the notification server"
			};
		}
		return {
			ok: false,
			code: "NotificationServer:SERVER_KEYS_UNKNOWN",
			message: "Failed to fetch notification server keys"
		};
	}

	// Now actually try the route:
	try {
		const [method, ...r] = route.split(" ");
		const response = await ky<NsResponse<T, E>>(r.join(" "), {
			method: method,
			prefixUrl: serverUrl,
			throwHttpErrors: false,
			...(options.auth != null
				? {
						headers: {
							"X-Username": options.auth.username,
							"X-College-ID": options.auth.collegeId.toString(),
							"X-Api-Key": options.auth.apiKey
						}
					}
				: {}),
			...(options.body != null
				? { json: createMessage(options.body, NOTIF_SIGN_PRIVATE_KEY, serverKeys.enc) }
				: {})
		});
		if (response.ok) {
			const data = await response.json<{ ok: true; result: EncryptedEnvelope }>();
			const opened = openMessage(data.result, NOTIF_ENC_PRIVATE_KEY, serverKeys.sign);
			try {
				const parsed = z.parse(options.schema, opened); // note: failing zod schema means that server mismatch.
				return { ok: true, result: parsed };
			} catch (err) {
				if (!(err instanceof ZodError)) throw err;
				return {
					ok: false,
					code: "NotificationServer:RESPONSE_MISMATCH",
					message: "Failed to parse notification server response due to mismatch",
					error:
						options.errorSchema != null ? z.safeParse(options.errorSchema, opened).data : undefined
				};
			}
		} else {
			const data = await response.json<{
				ok: false;
				code: keyof (typeof ErrorCodes)["NotificationServer"];
				message: string;
				error?: E;
			}>();
			if (isNotificationServerError(data.code)) {
				return {
					ok: false,
					code: `NotificationServer:${data.code}`,
					message: data.message,
					...(data.code === "BAD_REQUEST" && options.errorSchema != null && data.error != null
						? { error: z.safeParse(options.errorSchema, data.error).data }
						: {})
				};
			} else {
				return {
					ok: false,
					code: "NotificationServer:UNKNOWN_ERROR",
					message: "Unknown error code!"
				};
			}
		}
	} catch (err) {
		if (isKyError(err)) {
			console.error(err);
			return {
				ok: false,
				code: "NotificationServer:REQUEST_FAILED",
				message: "Failed to make request to notification server"
			};
		}
		if (err instanceof ZodError) {
			return {
				ok: false,
				code: "NotificationServer:RESPONSE_MISMATCH",
				message: "Failed to parse notification server response due to mismatch"
				// error: options.errorSchema != null ? z.safeParse(options.errorSchema, ).data : undefined
			};
		}
		if (
			isNetworkError(err) &&
			err.cause instanceof Error &&
			"code" in err.cause &&
			typeof err.cause.code === "string"
		) {
			return {
				ok: false,
				code: "Network:UNREACHABLE_SERVER",
				message: "Couldn't reach the notification server"
			};
		}
		return {
			ok: false,
			code: "NotificationServer:DECRYPTION_FAILED",
			message: "Failed to open response from notification server"
		};
	}
}

async function getServerHealth(serverUrl: string) {
	return await makeNsRequest(serverUrl, "GET health", { schema: z.literal(true) });
}

export const checkNotificationServerHealth = command(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;
	if (sessionUser.notificationServerSettings == null)
		return error(400, "You are not registered in a notification server.");

	const response = await getServerHealth(sessionUser.notificationServerSettings.url);

	if (response.ok) {
		return true;
	}

	return error(500, response.message);
});

export const getNotificationServerVapidKey = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;
	if (sessionUser.notificationServerSettings == null)
		return error(400, "You are not registered in a notification server.");

	const response = await makeNsRequest(
		sessionUser.notificationServerSettings.url,
		"GET vapid-key",
		{
			schema: z.object({ vapidKey: z.string() })
		}
	);

	if (response.ok) {
		if (
			sessionUser.notificationServerSettings.vapidKey != null &&
			response.result.vapidKey !== sessionUser.notificationServerSettings.vapidKey
		) {
			await db
				.update(schema.notificationServerSettings)
				.set({ vapidKey: response.result.vapidKey })
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
		}

		return response.result.vapidKey;
	}

	return error(500, response.message);
});

export const registerNotificationServer = form(notificationServerSchema, async (data) => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;
	if (sessionUser.notificationServerSettings != null)
		return error(400, "You are already registered in a notification server.");

	// const serverHealthResponse = await getServerHealth(data.serverUrl);
	// if (!serverHealthResponse.ok || !serverHealthResponse.result) {
	// 	return error(400, {
	// 		code: ErrorCodes.NotificationServer.HEALTH_CHECK_FAILED,
	// 		message: "Are you sure the server is OK?"
	// 	});
	// }

	const vapidKeyResponse = await makeNsRequest(data.serverUrl, "GET vapid-key", {
		schema: z.object({ vapidKey: z.string() })
	});
	if (!vapidKeyResponse.ok || !vapidKeyResponse.result.vapidKey) {
		return error(400, {
			code: ErrorCodes.NotificationServer.HEALTH_CHECK_FAILED,
			message: "Are you sure the server is OK?"
		});
	}

	const loginDetails = await api
		.post<login.LoginResponse>(sessionUser.college.baseUrl + ApiEndPoints.LOGIN_URL, {
			json: {
				username: sessionUser.account.username,
				password: data.accountPassword
				// todo: is hostel support needed??
			} satisfies login.LoginRequest,
			throwHttpErrors: true
		})
		.json()
		.catch(() => error(500, "Failed to login to Etlab"));

	if (loginDetails.login == false || loginDetails.error != null)
		return error(400, `Failed to login: ${loginDetails.error}`);
	if (loginDetails.access_token == null)
		return error(500, "Etlab server messed up the expected response");

	const generatedAuthToken = await generateNsToken();

	const response = await makeNsRequest(data.serverUrl, "POST register", {
		schema: z.object({
			apiKey: z.string().nonempty()
		}),
		body: {
			collegeId: sessionUser.college.id,
			username: sessionUser.account.username,
			authToken: generatedAuthToken
		}
	});

	if (response.ok) {
		const updated: NotificationServerSettingsState = {
			url: data.serverUrl,
			apiKey: response.result.apiKey,
			vapidKey: vapidKeyResponse.result.vapidKey,
			etlabAccessToken: loginDetails.access_token,
			authToken: generatedAuthToken
		};

		await db
			.insert(schema.notificationServerSettings)
			.values({
				collegeId: sessionUser.college.id,
				accountUsername: sessionUser.account.username,
				...updated
			})
			.onConflictDoUpdate({
				set: updated,
				target: [
					schema.notificationServerSettings.collegeId,
					schema.notificationServerSettings.accountUsername
				]
			});
		await invalidateSessionCache(sessionUser.session.id).catch(console.error);

		return {
			serverUrl: data.serverUrl,
			vapidKey: vapidKeyResponse.result.vapidKey
		};
	}

	return error(500, response.message);
});

export const unregisterFromNotificationServer = command(
	z.object({ force: z.boolean().default(false) }),
	async (args) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.notificationServerSettings == null)
			return error(400, "You are not registered in a notification server.");

		const response = await makeNsRequest(
			sessionUser.notificationServerSettings.url,
			"DELETE unregister",
			{
				schema: z.literal(true),
				auth: {
					collegeId: sessionUser.college.id,
					username: sessionUser.account.username,
					apiKey: sessionUser.notificationServerSettings.apiKey
				}
			}
		);

		if (response.ok) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return true;
		}

		if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return error(400, {
				code: ErrorCodes.NotificationServer.UNAUTHORIZED,
				message: "Must be registered in the notification server"
			});
		}

		// question: doesnt this prevent the flexibility of force unsubscription??
		//   like in case where the NS is down or permanently stopped, then, how should i unsubscribe?
		// answer: force-able unregister request (only for unregistration because, thats what makes sense)
		//   if any other requests fail for the same reason, go unregister!
		if (args.force) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return true;
		}

		if (response.code === ErrorCodes.Network.UNREACHABLE_SERVER) {
			return error(400, {
				code: ErrorCodes.Network.UNREACHABLE_SERVER,
				message: "Unable to reach the notification server"
			});
		}

		return error(500, response.message);
	}
);

export const subscribeToNotificationServer = command(
	z.object({
		endpoint: z.string().nonempty(),
		expirationTime: z.number().nullable(),
		keys: z.record(z.string(), z.string()).optional()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.notificationServerSettings == null)
			return error(400, "You are not registered in a notification server.");

		const response = await makeNsRequest(
			sessionUser.notificationServerSettings.url,
			"POST subscribe",
			{
				schema: z.literal(true),
				auth: {
					collegeId: sessionUser.college.id,
					username: sessionUser.account.username,
					apiKey: sessionUser.notificationServerSettings.apiKey
				},
				body: {
					subscription: {
						endpoint: data.endpoint,
						expirationTime: data.expirationTime,
						keys: data.keys
					}
				}
			}
		);

		if (response.ok) {
			return true;
		}

		// note: should handle all known status codes manually & gracefully.
		if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return error(400, {
				code: ErrorCodes.NotificationServer.UNAUTHORIZED,
				message: "Must be registered in the notification server"
			});
		}

		return error(500, response.message);
	}
);

export const hasSubscribedToNSWithEndpoint = command(
	z.object({ endpoint: z.string().nonempty() }),
	async (data) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.notificationServerSettings == null)
			return error(400, "You are not registered in a notification server.");

		const response = await makeNsRequest(
			sessionUser.notificationServerSettings.url,
			`GET subscription/${await hexSha256(data.endpoint)}`,
			{
				schema: z.boolean(),
				auth: {
					collegeId: sessionUser.college.id,
					username: sessionUser.account.username,
					apiKey: sessionUser.notificationServerSettings.apiKey
				}
			}
		);

		if (response.ok) {
			return response.result;
		}

		if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return error(400, {
				code: ErrorCodes.NotificationServer.UNAUTHORIZED,
				message: "Must be registered in the notification server"
			});
		}

		return error(500, response.message);
	}
);

export const unsubscribeFromNotificationServer = command(
	z.object({
		endpoint: z.string().nonempty()
	}),
	async (data) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.notificationServerSettings == null)
			return error(400, "You are not registered in a notification server.");

		const response = await makeNsRequest(
			sessionUser.notificationServerSettings.url,
			"DELETE unsubscribe",
			{
				schema: z.literal(true),
				auth: {
					collegeId: sessionUser.college.id,
					username: sessionUser.account.username,
					apiKey: sessionUser.notificationServerSettings.apiKey
				},
				body: {
					subscription: {
						id: await hexSha256(data.endpoint)
					}
				}
			}
		);

		if (response.ok) {
			return true;
		}

		if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return error(400, {
				code: ErrorCodes.NotificationServer.UNAUTHORIZED,
				message: "Must be registered in the notification server"
			});
		}

		return error(500, response.message);
	}
);

export const getConfiguration = query(async () => {
	const event = getRequestEvent();
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");
	const sessionUser = event.locals.sessionUser;
	if (sessionUser.notificationServerSettings == null)
		return error(400, "You are not registered in a notification server.");

	const response = await makeNsRequest(
		sessionUser.notificationServerSettings.url,
		"GET configuration",
		{
			auth: {
				collegeId: sessionUser.college.id,
				username: sessionUser.account.username,
				apiKey: sessionUser.notificationServerSettings.apiKey
			},
			schema: serverConfigSchema,
			errorSchema: z.unknown()
		}
	);

	if (response.ok) {
		if (response.result.serverConfig.version !== 1) {
			// note: server versions todo:
			return error(500, "Unsuppported server configuration version");
		}
		return response.result;
	}

	if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
		await db
			.delete(schema.notificationServerSettings)
			.where(
				and(
					eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
					eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
				)
			);
		await invalidateSessionCache(sessionUser.session.id).catch(console.error);
		return error(400, {
			code: ErrorCodes.NotificationServer.UNAUTHORIZED,
			message: "Must be registered in the notification server"
		});
	} else if (
		response.code === ErrorCodes.NotificationServer.RESPONSE_MISMATCH &&
		response.error != null
	) {
		return error(400, {
			message: response.message,
			code: ErrorCodes.NotificationServer.RESPONSE_MISMATCH,
			errors: {
				type: "schema-mismatch",
				input: serverConfigSchema.safeParse(response.error).error?.issues
			}
		});
	}

	return error(500, response.message);
});

export const setConfiguration = command(
	z.object({
		channels: z.record(z.string(), z.array(z.string())),
		config: z.record(z.string(), z.union([z.boolean(), z.int()]))
	}),
	async (updatedConfig) => {
		const event = getRequestEvent();
		if (event.locals.sessionUser == null) return error(401, "Unauthorized");
		const sessionUser = event.locals.sessionUser;
		if (sessionUser.notificationServerSettings == null)
			return error(400, "You are not registered in a notification server.");

		const response = await makeNsRequest(
			sessionUser.notificationServerSettings.url,
			"PUT configuration",
			{
				auth: {
					collegeId: sessionUser.college.id,
					username: sessionUser.account.username,
					apiKey: sessionUser.notificationServerSettings.apiKey
				},
				schema: z.literal(true),
				errorSchema: z.record(z.string(), z.array(z.string())),
				body: updatedConfig
			}
		);

		if (response.ok) {
			return response.result;
		}

		if (response.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
			await db
				.delete(schema.notificationServerSettings)
				.where(
					and(
						eq(schema.notificationServerSettings.collegeId, sessionUser.college.id),
						eq(schema.notificationServerSettings.accountUsername, sessionUser.account.username)
					)
				);
			await invalidateSessionCache(sessionUser.session.id).catch(console.error);
			return error(401, {
				code: ErrorCodes.NotificationServer.UNAUTHORIZED,
				message: "Must be registered in the notification server"
			});
		}

		if (response.code === ErrorCodes.NotificationServer.BAD_REQUEST && response.error != null) {
			return error(400, {
				message: response.message,
				code: ErrorCodes.NotificationServer.BAD_REQUEST,
				errors: {
					type: "server-sent-validation-errors",
					errors: response.error
				}
			});
		}

		return error(500, response.message);
	}
);
