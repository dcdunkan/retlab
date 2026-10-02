<script module>
	const Piece = {
		HOME: "home",
		ATTENDANCE: "attendance",
		ASSIGNMENTS: "assignments",
		SETTINGS: "settings",
		ACADEMIC_ANALYSIS: "academic-analysis"
	};
</script>

<script lang="ts">
	import GearFineIcon from "phosphor-svelte/lib/GearFineIcon";

	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { Pathname } from "$app/types";
	import { getLocalSubscription } from "$lib/browser";
	import { IDBStore, openIdb } from "$lib/indexeddb";
	import type { IconComponentProps } from "phosphor-svelte";
	import { onMount, type Component } from "svelte";
	import type { LayoutProps } from "./$types";
	import { DEFAULT_SETTINGS } from "./settings/default-settings";
	import {
		auth,
		idb,
		notificationServerSettingsState,
		settingsState,
		webAccessSettingsState
	} from "./states.svelte";
	import type { RouteId } from "$app/types";

	let { data, children }: LayoutProps = $props();

	onMount(async () => {
		auth.set({
			session: {
				id: data.sessionUser.session.id,
				deviceInfo: data.sessionUser.session.deviceInfo,
				deviceType: data.sessionUser.session.deviceType,
				createdAt: data.sessionUser.session.createdAt
			},
			account: {
				username: data.sessionUser.account.username,
				semesterId: data.sessionUser.account.semesterId,
				lastUpdatedAt: data.sessionUser.account.lastUpdatedAt
			},
			college: {
				id: data.sessionUser.college.id,
				name: data.sessionUser.college.name,
				baseUrl: data.sessionUser.college.baseUrl
			}
		});
		auth.resolve();

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

		// Resolve notification server settings:
		if (data.sessionUser.notificationServerSettings != null) {
			notificationServerSettingsState.set({
				url: data.sessionUser.notificationServerSettings.url,
				vapidKey: data.sessionUser.notificationServerSettings.vapidKey
			});
		}

		if (data.sessionUser.webAccessSettings != null) {
			webAccessSettingsState.set({
				setupAt: data.sessionUser.webAccessSettings.setupAt
			});
		} else {
			webAccessSettingsState.set(null);
		}
		webAccessSettingsState.resolve();

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

		async function loadIdb() {
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
		}

		async function unsubscribeLocalPushSubscriptionIfExpired() {
			try {
				const unsubscribed = await unsubscribeLocalPushSubscription();
				if (unsubscribed) {
					console.log("Unsubscribed invalid push subscription");
					notificationServerSettingsState.set(null);
				}
			} catch (error) {
				console.error("Error while trying to unsubscribe notifications");
				console.error(error);
			}
			notificationServerSettingsState.resolve();
		}

		await Promise.all([loadIdb(), unsubscribeLocalPushSubscriptionIfExpired()]);
	});

	type PathPiece = {
		label?: string;
		icon?: Component<IconComponentProps, Record<never, never>, "">;
		href: Pathname;
	};
	const HOME_PIECE: PathPiece = { label: Piece.HOME, href: "/" };

	const table: Partial<Record<RouteId, PathPiece[]>> = {
		"/(auth)": [{ label: Piece.HOME, href: "/" }],
		"/(auth)/attendance": [HOME_PIECE, { label: Piece.ATTENDANCE, href: "/attendance" }],
		"/(auth)/assignments": [HOME_PIECE, { label: Piece.ASSIGNMENTS, href: "/assignments" }],
		"/(auth)/settings": [{ href: "/settings", icon: GearFineIcon }],
		"/(auth)/academic-analysis": [
			HOME_PIECE,
			{ href: "/academic-analysis", label: Piece.ACADEMIC_ANALYSIS }
		]
	};

	let pieces = $derived.by(() => {
		if (page.route.id == null) return [HOME_PIECE];
		else if (page.route.id in table && table[page.route.id] != null)
			return table[page.route.id] ?? [HOME_PIECE];
		else return [HOME_PIECE];
	});
</script>

<div class="min-h-screen w-full">
	<nav class="sticky top-0 z-50 border-b-2 border-border bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between px-4 py-2">
			<div>
				{#each pieces as piece, i (i)}
					{#if i == pieces.length - 1}
						{#if piece.label}
							<span class="font-medium">{piece.label}</span>
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

	<main class="mx-auto max-w-prose space-y-6 px-4 pt-4">
		{@render children()}
	</main>

	<footer class="mt-6 px-4 pb-4">
		<div class="text-center text-xs font-medium text-muted-foreground/50">
			ret commit <a
				target="_blank"
				href="https://github.com/dcdunkan/retlab/tree/{__GIT_SHA__}"
				class="underline decoration-wavy underline-offset-2 hover:text-ret-accent/50"
			>
				{__GIT_SHORT_SHA__}
			</a>
		</div>
	</footer>
</div>
