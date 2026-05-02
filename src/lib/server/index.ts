import { NS_TOKEN_SECRET } from "$env/static/private";
import ky from "ky";
import crypto from "node:crypto";
import { textEncoder } from "./constants";

export const api = ky.extend({
	throwHttpErrors: false
});

function base64url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}
function fromBase64url(str: string): Uint8Array {
	const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

const NS_TOKEN_SECRET_KEY = await crypto.subtle.importKey(
	"raw",
	fromBase64url(NS_TOKEN_SECRET),
	{ name: "HMAC", hash: "SHA-256" },
	false,
	["sign", "verify"]
);

export async function generateNsToken(): Promise<string> {
	const jti = base64url(crypto.getRandomValues(new Uint8Array(16)));
	const sig = await crypto.subtle.sign("HMAC", NS_TOKEN_SECRET_KEY, textEncoder.encode(jti));
	return `${jti}.${base64url(new Uint8Array(sig))}`;
}

export async function verifyNsToken(token: string): Promise<string | null> {
	const [jti, sig] = token.split(".");
	if (!jti || !sig) return null;
	const valid = await crypto.subtle.verify(
		"HMAC",
		NS_TOKEN_SECRET_KEY,
		fromBase64url(sig),
		textEncoder.encode(jti)
	);
	return valid ? jti : null;
}
