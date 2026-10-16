import { form, getRequestEvent } from "$app/server";
import { DAY, MINUTE } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import type { login } from "$lib/generated/models";
import { api } from "$lib/server";
import * as auth from "$lib/server/auth";
import { db, schema } from "$lib/server/db";
import { getDeviceInfo } from "$lib/server/device-info";
import type { Account } from "$lib/server/schema";
import type { JWTPayloadData } from "$lib/types";
import { invalid, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { isHTTPError, isKyError } from "ky";
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
			} satisfies login.LoginRequest,
			timeout: 30 * 1000
		})
		.json()
		.catch((err) => {
			if (isKyError(err) && isHTTPError(err)) {
				invalid(issue(`Couldn't login, returned ${err.response.status}`));
			} else {
				console.error(err);
				invalid(issue("Couldn't login: Something went wrong"));
			}
		});

	if (typeof loginDetails.error == "string") {
		invalid(issue(loginDetails.error));
	} else if (loginDetails.login != true) {
		invalid(issue("Couldn't authorize with Etlab instance"));
	}

	const updated: Omit<
		Account,
		"username" | "collegeId" | "createdAt" | "displayName" | "onboardedAt" | "onboardingSkipped"
	> = {
		profileName: loginDetails.profile_name,
		imageUrl: loginDetails.url,

		batchId: Number.parseInt(loginDetails.batch_id),
		courseName: loginDetails.course,
		semesterId: Number.parseInt(loginDetails.sem_id),
		semesterName: loginDetails.sem_name,

		lastUpdatedAt: new Date()
	};

	const [account] = await db
		.insert(schema.accounts)
		.values({
			collegeId: data.collegeId,
			username: data.username,
			createdAt: new Date(),
			displayName: loginDetails.profile_name,
			onboardedAt: null,
			onboardingSkipped: false,
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
