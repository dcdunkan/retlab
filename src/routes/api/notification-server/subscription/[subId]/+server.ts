import { NOTIF_SIGN_PRIVATE_KEY } from "$env/static/private";
import { createMessage, type PublicKeys } from "$lib/server/crypto.js";
import { json } from "@sveltejs/kit";
import urlJoin from "url-join";
import z from "zod";

export const PUT = async (event) => {
	if (event.locals.sessionUser == null)
		return json({ ok: false, message: "Unauthorized" }, { status: 401 });
	const sessionUser = event.locals.sessionUser;
	if (sessionUser.notificationServerSettings == null)
		return json(
			{ ok: false, message: "You are not registered in a notification server" },
			{ status: 404 }
		);

	const data = z
		.object({
			endpoint: z.httpUrl(),
			expirationTime: z.number().nullable(),
			keys: z.object({
				p256dh: z.string(),
				auth: z.string()
			})
		})
		.parse(await event.request.json());

	const keysResponse = await fetch(urlJoin(sessionUser.notificationServerSettings.url, "/keys"));
	if (!keysResponse.ok) {
		return json({ ok: false, message: "Failed to get server keys" }, { status: 500 });
	}
	const serverKeys = (await keysResponse.json()).result as PublicKeys;
	const encrypted = createMessage({ subscription: data }, NOTIF_SIGN_PRIVATE_KEY, serverKeys.enc);
	await fetch(
		urlJoin(sessionUser.notificationServerSettings.url, "/subscription", event.params.subId),
		{
			method: "PUT",
			body: JSON.stringify(encrypted),
			headers: {
				"X-Username": sessionUser.account.username,
				"X-College-ID": sessionUser.college.id.toString(),
				"X-Api-Key": sessionUser.notificationServerSettings.apiKey
			}
		}
	);

	return json({});
};
