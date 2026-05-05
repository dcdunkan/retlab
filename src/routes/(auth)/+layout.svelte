<script module>
	const Piece = {
		HOME: "home",
		ATTENDANCE: "attendance",
		ASSIGNMENTS: "assignments",
		SETTINGS: "settings"
	};
</script>

<script lang="ts">
	import GearFineIcon from "phosphor-svelte/lib/GearFineIcon";

	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { Pathname } from "$app/types";
	import { getLocalSubscription } from "$lib/browser";
	import { onMount, type Component } from "svelte";
	import type { LayoutProps } from "./$types";
	import { idb, notificationServerSettingsState, settingsState } from "./states.svelte";
	import { DEFAULT_SETTINGS } from "./settings/default-settings";
	import type { IconComponentProps } from "phosphor-svelte";
	import { IDBStore, openIdb } from "$lib/indexeddb";

	let { data, children }: LayoutProps = $props();

	onMount(async () => {
		// Resolve normal settings:
		if (data.sessionUser.settings != null) {
			// tweak stuff
			settingsState.set({
				attendancePercentMax: data.sessionUser.settings.attendancePercentMax,
				attendancePercentMin: data.sessionUser.settings.attendancePercentMin,
				expandAttendanceSubjects: data.sessionUser.settings.expandAttendanceSubjects,
				invalidAttendanceMarker: data.sessionUser.settings.invalidAttendanceMarker,
				showAttendanceBarByDefault: data.sessionUser.settings.showAttendanceBarByDefault
			});
		} else {
			settingsState.set(DEFAULT_SETTINGS);
		}
		settingsState.resolve();

		const cacheStorageIdb = await openIdb("cache-storage", 1, [
			{ name: "et-res-cache", options: { keyPath: "key" } }
		]);
		const etlabResponseCache = new IDBStore<{
			key: string;
			data: unknown;
			timestamp: number;
		}>(cacheStorageIdb, "et-res-cache");

		idb.set({
			cacheStorageIdb,
			etlabResponseCache
		});

		// unsubscribe zombie subscriptions:
		async function unsubscribeLocalPushSubscription() {
			const localSubscription = await getLocalSubscription();

			if (localSubscription == null) return false;

			// was subscribed correctly, unregistered from another device, then
			// the local subscription is useless. zombie subscription (sub without reg)
			if (data.sessionUser.notificationServerSettings == null) {
				return localSubscription.unsubscribe();
			}

			// has local sub, but the vapid key used for registration and the locally subscribed vapid key
			// doesn't match. user subscribed correctly, another device unregistered and registered to another server,
			// making the notificationServer not null, but mismatch in vapid key.

			// handle unfortunate cases first:
			if (data.sessionUser.notificationServerSettings.vapidKey == null) {
				return localSubscription.unsubscribe();
			}

			if (localSubscription.options.applicationServerKey == null) {
				// note: cannot unsubscribe definitively, because Firefox doesn't store them properly as of today (04/05/2026).
				return false;
			}

			// and real comparison now. but it sucks:
			// https://stackoverflow.com/questions/45994933/changing-application-server-key-in-push-manager-subscription#comment137027226_75503694
			// https://github.com/GoogleChromeLabs/web-push-codelab/blob/469a70b1eb195eeb27f5901ab58bd8452f015d9a/completed/07-unsubscribe/scripts/main.js#L32
			const applicationServerKey = window
				.btoa(
					String.fromCharCode.apply(
						null,
						Array.from(new Uint8Array(localSubscription.options.applicationServerKey))
					)
				)
				.replaceAll("+", "-")
				.replaceAll("/", "_")
				.replaceAll("=", "");

			if (applicationServerKey !== data.sessionUser.notificationServerSettings.vapidKey) {
				return localSubscription.unsubscribe();
			}

			return false;
		}
		try {
			const unsubscribed = await unsubscribeLocalPushSubscription();
			if (unsubscribed) {
				console.log("Unsubscribed invalid push subscription");
			}
		} catch (error) {
			console.error("Error while trying to unsubscribe notifications");
			console.error(error);
		}

		// Resolve notification server settings:
		if (data.sessionUser.notificationServerSettings != null) {
			notificationServerSettingsState.set({
				url: data.sessionUser.notificationServerSettings.url,
				vapidKey: data.sessionUser.notificationServerSettings.vapidKey
			});
		} else {
			notificationServerSettingsState.set(null);
		}
		notificationServerSettingsState.resolve();
	});

	let pieces: {
		label?: string;
		icon?: Component<IconComponentProps, Record<never, never>, "">;
		href: Pathname;
	}[] = $derived(
		page.route.id == "/(auth)/attendance"
			? [
					{ label: Piece.HOME, href: "/" },
					{ label: Piece.ATTENDANCE, href: "/attendance" }
				]
			: page.route.id === "/(auth)/assignments"
				? [
						{ label: Piece.HOME, href: "/" },
						{ label: Piece.ASSIGNMENTS, href: "/assignments" }
					]
				: page.route.id == "/(auth)"
					? [{ label: Piece.HOME, href: "/" }]
					: page.route.id == "/(auth)/settings"
						? [{ href: "/settings", icon: GearFineIcon }]
						: [{ label: Piece.HOME, href: "/" }]
	);
</script>

<div class="min-h-screen w-full">
	<nav class="sticky top-0 z-50 border-b-2 bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between px-4 py-2">
			<div>
				{#each pieces as piece, i (i)}
					{#if i == pieces.length - 1}
						{#if piece.label}
							<span>{piece.label}</span>
						{/if}
						{#if piece.icon}
							<piece.icon weight="bold" />
						{/if}
					{:else}
						<span class="text-muted-foreground">
							<a class="hover:bg-foreground/10" href={resolve(piece.href)}>{piece.label}</a> /&nbsp;
						</span>
					{/if}
				{/each}
			</div>
			{#if page.route.id !== "/(auth)/settings"}
				<a class="hover:bg-foreground/10" href={resolve("/settings")}>
					<GearFineIcon weight="bold" />
				</a>
			{:else}
				<a class="hover:bg-foreground/10" href={resolve("/")}>home</a>
			{/if}
		</div>
	</nav>
	<main class="mx-auto max-w-prose space-y-6 p-4">
		{@render children()}

		<footer>
			<div class="text-center text-xs text-muted-foreground">
				ret build <a
					target="_blank"
					href="https://github.com/dcdunkan/retlab/tree/{__GIT_SHA__}"
					class="hover:text-primary"
				>
					{__GIT_SHORT_SHA__}
				</a>
			</div>
		</footer>
	</main>
</div>
