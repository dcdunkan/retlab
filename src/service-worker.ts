/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />
// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { build, files, version } from "$service-worker";

const self = globalThis.self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

type NotificationDataType = "new-survey" | "new-surveys";

type PushData = {
	title: string;
	body: string;
	data: { type: NotificationDataType };
};

function getNavigationUrl(notificationDataType: NotificationDataType): string {
	switch (notificationDataType) {
		case "new-survey": // todo
		case "new-surveys": // todo
		default:
			return "/";
	}
}

self.addEventListener("install", (event) => {
	self.skipWaiting();

	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener("activate", (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
	// Only handle the GET requests
	if (event.request.method !== "GET") return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error("invalid response from fetch");
			}

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});

self.addEventListener("push", (event) => {
	if (!event.isTrusted) return;

	async function showNotifications() {
		if (event.data == null) return;
		const data = (await event.data.json()) as PushData;

		// Try, don't even care about the permission.
		// Don't do anything else either, browser engines especially WebKit, has strict rules about pushes and notifications.
		await self.registration.showNotification(data.title, {
			body: data.body,
			data: data.data,
			badge: "/favicon-96x96.png",
			icon: "/favicon-96x96.png" // todo: 96x96, sure?
		});
	}

	event.waitUntil(showNotifications());
});

self.addEventListener("notificationclick", (event) => {
	async function navigateUponClick() {
		if (event.notification == null || event.notification.data == null) return;
		const data = event.notification.data as PushData["data"];
		// todo: handle event.notification.action if ever implemented
		const navigationUrl = getNavigationUrl(data.type);
		for (const windowClient of await self.clients.matchAll({ type: "window" })) {
			if (windowClient.url === navigationUrl) {
				windowClient.focus();
				return;
			}
		}
		await self.clients.openWindow(navigationUrl);
	}
	event.waitUntil(navigateUponClick());
});

self.addEventListener("pushsubscriptionchange", (event) => {
	async function updateSubscription() {
		if (event.oldSubscription == null || typeof event.oldSubscription.endpoint !== "string") return; // wont happen, otherwise push wouldn't have recieved.

		const newSubscription =
			event.newSubscription ??
			(await self.registration.pushManager.getSubscription()) ??
			(await self.registration.pushManager.subscribe(event.oldSubscription.options));

		if (newSubscription == null) return; // why

		const oldId = await hexSha256(event.oldSubscription.endpoint);
		await fetch(`/api/notification-server/subscription/${oldId}`, {
			method: "PUT",
			credentials: "include",
			body: JSON.stringify(newSubscription.toJSON())
		});
	}
	event.waitUntil(updateSubscription());
});

// source: https://www.xaymar.com/articles/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
// Pre-Init
const LUT_HEX_4b = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
	LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xf]}${LUT_HEX_4b[n & 0xf]}`;
}
// End Pre-Init
function toHex(buffer: Uint8Array) {
	let out = "";
	for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
		out += LUT_HEX_8b[buffer[idx]];
	}
	return out;
}
async function hexSha256(data: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
	return toHex(new Uint8Array(hashBuffer));
}
