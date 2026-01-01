import { form, getRequestEvent, query } from "$app/server";
import { DAY, MINUTE } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { dash, login, SuccessResponse } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { getDeviceInfo } from "$lib/server/device-info";
import { prisma } from "$lib/server/prisma";
import { Prisma } from "$lib/server/prisma/client";
import type { JWTPayloadData } from "$lib/types";
import { invalid, redirect } from "@sveltejs/kit";
import { loginSchema } from "./login-schema";

export const getColleges = query(async () => {
	console.log("fetching colleges");

	return await prisma.college.findMany({
		select: {
			id: true,
			name: true
		}
	});
});

export const loginForm = form(loginSchema, async (data, issue) => {
	const event = getRequestEvent();

	// note: some shitty bug
	data.collegeId = Number(data.collegeId);

	const college = await prisma.college.findFirst({
		where: { id: data.collegeId }
	});
	if (college == null) {
		invalid(issue.collegeId("Could not find college"));
	}

	const loginDetails = await api
		.post<login.LoginResponse>(college.base_url + ApiEndPoints.LOGIN_URL, {
			json: {
				username: data.username,
				password: data.password
				// todo: hostel support
			} satisfies login.LoginRequest
		})
		.json()
		.catch(() => invalid(issue("Something went wrong")));

	console.log(loginDetails.access_token);

	if (typeof loginDetails.error == "string") {
		invalid(issue(loginDetails.error));
	} else if (loginDetails.login != true) {
		invalid(issue("Couldn't authorize with Etlab instance"));
	}

	const dashResponse = await api.get<dash.DashResponse>(college.base_url + ApiEndPoints.DASH_URL, {
		headers: { Authorization: "Bearer " + loginDetails.access_token }
	});

	let dashDetails: dash.DashResponse | null;

	if (dashResponse.ok) {
		const parsed: dash.DashResponse = await dashResponse.json();
		if (parsed.error || parsed.login == false) {
			console.error(parsed); // something went wrong, will do later.
			dashDetails = null;
		} else {
			dashDetails = parsed;
		}
	} else {
		// logged in, but no dash response (will be tried later)
		// two possible reasons: 429 (non-sense making rate limits), or usual 500 (still a mystery)
		dashDetails = null;
	}

	if (dashDetails == null) {
		await api.post<SuccessResponse>(college.base_url + ApiEndPoints.LOGOUT_URL, {
			json: {
				push_token: "" // yes, empty string works & the property is required
			} satisfies login.LogoutRequest
		});
		invalid(issue("Failed to fetch details of the account."));
	}

	const updated: Omit<Prisma.AccountCreateWithoutCollegeInput, "username"> = {
		batch_id: Number.parseInt(dashDetails.batch_id),
		semester_id: Number.parseInt(dashDetails.sem_id),
		student_id: Number.parseInt(dashDetails.student_id),

		// @ts-expect-error invalid types
		profile_name: dashDetails.name,
		course_name: dashDetails.course,
		semester_name: dashDetails.curnt_sem,
		image_url: dashDetails.url,
		// @ts-expect-error invalid types
		reg_no: String(dashDetails.register_no),
		// @ts-expect-error invalid types
		roll_no: String(dashDetails.roll_no),

		last_updated_at: new Date()
	};

	const account = await prisma.account.upsert({
		where: {
			account_id: {
				college_id: college.id,
				username: data.username
			}
		},
		create: {
			college: { connect: { id: data.collegeId } },
			username: data.username,
			...updated
		},
		update: { ...updated },
		select: {
			college_id: true,
			username: true
		}
	});

	const userAgent = event.request.headers.get("User-Agent");
	const deviceInfo = getDeviceInfo(userAgent);
	const session = await prisma.session.create({
		data: {
			account: {
				connect: {
					account_id: {
						college_id: account.college_id,
						username: account.username
					}
				}
			},
			access_token: loginDetails.access_token,
			device_type: deviceInfo.type,
			device_info: deviceInfo.label
		}
	});

	const tokenPayload: JWTPayloadData = { sessionId: session.id };
	const accessToken = await auth.createAccessToken(tokenPayload);
	event.cookies.set(auth.ACCESS_TOKEN_COOKIE_NAME, accessToken, {
		path: "/",
		expires: new Date(Date.now() + 10 * MINUTE),
		secure: import.meta.env.PROD
	});
	const refreshToken = await auth.createRefreshToken(tokenPayload);
	event.cookies.set(auth.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
		path: "/", // todo: rewrite for only "/auth/refresh" path
		expires: new Date(Date.now() + 60 * DAY),
		secure: import.meta.env.PROD
	});

	redirect(307, "/");
});
