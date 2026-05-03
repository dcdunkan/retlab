import { NOTIF_ENC_PUBLIC_KEY, NOTIF_SIGN_PUBLIC_KEY } from "$env/static/private";
import { json } from "@sveltejs/kit";

export const GET = () => {
	return json({
		sign: NOTIF_SIGN_PUBLIC_KEY,
		enc: NOTIF_ENC_PUBLIC_KEY
	});
};

export const prerender = true;
