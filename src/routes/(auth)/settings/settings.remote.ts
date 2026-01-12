import { command, getRequestEvent, query } from "$app/server";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { dash, login } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { prisma } from "$lib/server/prisma";
import { error } from "@sveltejs/kit";
import z from "zod";
import { settingsSchema } from "./settings-schema";
import type { Prisma } from "$lib/prisma/client";

export const updateSettings = command(settingsSchema, async (data) => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const session = event.locals.session;

	const updated: Prisma.SettingsCreateWithoutAccountInput = {
		attendance_percent_max: data.attendanceMaxCutoff,
		attendance_percent_min: data.attendanceMinCutoff
	};

	const settings = await prisma.settings.upsert({
		create: {
			account: {
				connect: {
					account_id: {
						college_id: session.account.college_id,
						username: session.account.username
					}
				}
			},
			...updated
		},
		update: {
			...updated
		},
		where: {
			settings_id: {
				college_id: session.account.college_id,
				account_username: session.account.username
			}
		}
	});

	session.account.settings = settings;
});

export const getSessions = query(async () => {
	const event = getRequestEvent();
	if (event.locals.session == null) {
		return error(401, "Unauthorized");
	}

	const session = event.locals.session;

	return await prisma.session.findMany({
		where: {
			college_id: session.college_id,
			account_username: session.account_username
		},
		select: {
			id: true,
			device_info: true,
			device_type: true,
			created_at: true
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
		session.account.college.base_url + ApiEndPoints.DASH_URL,
		{ headers: { Authorization: "Bearer " + session.access_token } }
	);
	if (response.ok) {
		const parsed: dash.DashResponse = await response.json();
		if (parsed.login == false) {
			// todo: logout
			return error(401, "Seems logged out?"); // wont ever really happen
		} else {
			const account = await prisma.account.update({
				where: {
					account_id: {
						college_id: session.college_id,
						username: session.account_username
					}
				},
				data: {
					batch_id: Number.parseInt(parsed.batch_id),
					semester_id: Number.parseInt(parsed.sem_id),
					student_id: Number.parseInt(parsed.student_id),
					// @ts-expect-error invalid types
					profile_name: parsed.name,
					course_name: parsed.course,
					semester_name: parsed.curnt_sem,
					image_url: parsed.url,
					// @ts-expect-error invalid types
					reg_no: String(parsed.register_no),
					// @ts-expect-error invalid types
					roll_no: String(parsed.roll_no),
					last_updated_at: new Date()
				},
				include: {
					college: true
				}
			});
			event.locals.session.account = account;
			return event.locals.session.account.last_updated_at;
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
	const session = await prisma.session.delete({
		where: { id: args.session_id }
	});
	await api.post(currentSession.account.college.base_url + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + session.access_token },
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
	await prisma.session.delete({ where: { id: session.id } });
	await api.post(session.account.college.base_url + ApiEndPoints.LOGOUT_URL, {
		headers: { Authorization: "Bearer " + session.access_token },
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

	const { sessions } = await prisma.account.delete({
		where: {
			account_id: {
				college_id: currentSession.account.college_id,
				username: currentSession.account.username
			}
		},
		include: {
			sessions: true
		}
	});

	await Promise.all(
		sessions.map((session) => {
			return api.post(currentSession.account.college.base_url + ApiEndPoints.LOGOUT_URL, {
				headers: { Authorization: "Bearer " + session.access_token },
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
