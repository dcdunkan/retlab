import type { JWTPayloadData } from "$lib/types";
import { jwtVerify, SignJWT, type JWTPayload, type JWTVerifyResult } from "jose";

import { env } from "$env/dynamic/private";
import type { RequestEvent } from "@sveltejs/kit";
import { DAY, MINUTE } from "$lib";

export const ACCESS_TOKEN_COOKIE_NAME = "ret-access-token";
export const REFRESH_TOKEN_COOKIE_NAME = "ret-refresh-token";

export const ACCESS_TOKEN_EXP = "10m";
export const REFRESH_TOKEN_EXP = "60d";

const textEncoder = new TextEncoder();
export const JWT_ACCESS_TOKEN_SECRET = textEncoder.encode(env.JWT_ACCESS_TOKEN_SECRET);
export const JWT_REFRESH_TOKEN_SECRET = textEncoder.encode(env.JWT_REFRESH_TOKEN_SECRET);

export function createAccessToken(data: JWTPayloadData): Promise<string> {
	return new SignJWT(data)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_EXP)
		.sign(JWT_ACCESS_TOKEN_SECRET);
}

export function verifyAccessToken(
	token: string
): Promise<JWTVerifyResult<JWTPayload & JWTPayloadData>> {
	return jwtVerify(token, JWT_ACCESS_TOKEN_SECRET);
}

export function createRefreshToken(data: JWTPayloadData): Promise<string> {
	return new SignJWT(data)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(REFRESH_TOKEN_EXP)
		.sign(JWT_REFRESH_TOKEN_SECRET);
}

export function verifyRefreshToken(
	token: string
): Promise<JWTVerifyResult<JWTPayload & JWTPayloadData>> {
	return jwtVerify(token, JWT_REFRESH_TOKEN_SECRET);
}

export function deleteTokenCookies(event: RequestEvent) {
	event.cookies.delete(ACCESS_TOKEN_COOKIE_NAME, {
		path: "/",
		secure: import.meta.env.PROD
	});
	event.cookies.delete(REFRESH_TOKEN_COOKIE_NAME, {
		path: "/",
		secure: import.meta.env.PROD
	});
}

export async function setTokenCookies(event: RequestEvent, sessionId: string) {
	event.cookies.set(ACCESS_TOKEN_COOKIE_NAME, await createAccessToken({ sessionId }), {
		path: "/",
		expires: new Date(Date.now() + 10 * MINUTE),
		secure: import.meta.env.PROD
	});
	event.cookies.set(REFRESH_TOKEN_COOKIE_NAME, await createRefreshToken({ sessionId }), {
		path: "/",
		expires: new Date(Date.now() + 60 * DAY),
		secure: import.meta.env.PROD
	});
}
