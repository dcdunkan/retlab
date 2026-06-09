import { form, getRequestEvent } from "$app/server";
import { DAY, MINUTE } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { dash, login, SuccessResponse } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { db, schema } from "$lib/server/db";
import { getDeviceInfo } from "$lib/server/device-info";
import type { Account } from "$lib/server/schema";
import type { JWTPayloadData } from "$lib/types";
import { invalid, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { loginSchema } from "./login-schema";

export const loginForm = form(loginSchema, async (data, issue) => {
	const event = getRequestEvent();

	// note: some shitty bug, todo: check whether this was fixed
	data.collegeId = Number(data.collegeId);

	const college = await db.query.colleges.findFirst({
		where: eq(schema.colleges.id, data.collegeId)
	});
	if (college == null) {
		invalid(issue.collegeId("Could not find college"));
	}

	const loginDetails = await api
		.post<login.LoginResponse>(college.baseUrl + ApiEndPoints.LOGIN_URL, {
			json: {
				username: data.username,
				password: data.password
				// todo: hostel support
			} satisfies login.LoginRequest
		})
		.json()
		.catch(() => invalid(issue("Something went wrong")));

	if (typeof loginDetails.error == "string") {
		invalid(issue(loginDetails.error));
	} else if (loginDetails.login != true) {
		invalid(issue("Couldn't authorize with Etlab instance"));
	}

	const dashResponse = await api.get<dash.DashResponse>(college.baseUrl + ApiEndPoints.DASH_URL, {
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
		await api.post<SuccessResponse>(college.baseUrl + ApiEndPoints.LOGOUT_URL, {
			json: {
				push_token: "" // yes, empty string works & the property is required
			} satisfies login.LogoutRequest
		});
		invalid(issue("Failed to fetch details of the account."));
	}

	const updated: Omit<Account, "username" | "collegeId"> = {
		batchId: Number.parseInt(dashDetails.batch_id),
		semesterId: Number.parseInt(dashDetails.sem_id),
		studentId: Number.parseInt(dashDetails.student_id),

		// @ts-expect-error invalid types
		profileName: dashDetails.name,
		courseName: dashDetails.course,
		semesterName: dashDetails.curnt_sem,
		imageUrl: dashDetails.url,
		// @ts-expect-error invalid types
		regNo: String(dashDetails.register_no),
		// @ts-expect-error invalid types
		rollNo: String(dashDetails.roll_no),

		lastUpdatedAt: new Date()
	};

	const [account] = await db
		.insert(schema.accounts)
		.values({
			collegeId: data.collegeId,
			username: data.username,
			...updated
		})
		.onConflictDoUpdate({
			set: { ...updated },
			target: [schema.accounts.collegeId, schema.accounts.username]
		})
		.returning({
			collegeId: schema.accounts.collegeId,
			username: schema.accounts.username
		});

	const userAgent = event.request.headers.get("User-Agent");
	const deviceInfo = getDeviceInfo(userAgent);
	const [session] = await db
		.insert(schema.sessions)
		.values({
			collegeId: account.collegeId,
			accountUsername: account.username,
			accessToken: loginDetails.access_token,
			deviceType: deviceInfo.type,
			deviceInfo: deviceInfo.label
		})
		.returning({ id: schema.sessions.id });

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
