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
	import { notificationServerSettingsState, settingsState } from "./states.svelte";
	import { DEFAULT_SETTINGS } from "./settings/default-settings";
	import type { IconComponentProps } from "phosphor-svelte";

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		// Resolve normal settings:
		if (data.account.settings != null) {
			// tweak stuff
			settingsState.set({
				attendancePercentMax: data.account.settings.attendancePercentMax,
				attendancePercentMin: data.account.settings.attendancePercentMin,
				expandAttendanceSubjects: data.account.settings.expandAttendanceSubjects,
				invalidAttendanceMarker: data.account.settings.invalidAttendanceMarker,
				showAttendanceBarByDefault: data.account.settings.showAttendanceBarByDefault
			});
		} else {
			settingsState.set(DEFAULT_SETTINGS);
		}
		settingsState.resolve();

		// Resolve notification server settings:

		// unsubscribe zombie subscriptions:
		getLocalSubscription()
			.then((sub) => {
				if (sub == null) return;

				// was subscribed correctly, unregistered from another device, then
				// the local subscription is useless. zombie subscription (sub without reg)
				if (data.account.notificationServerSettings == null) {
					sub.unsubscribe();
					return;
				}

				// has local sub, but the vapid key used for registration and the locally subscribed vapid key
				// doesn't match. user subscribed correctly, another device unregistered and registered to another server,
				// making the notificationServer not null, but mismatch in vapid key.

				// handle unfortunate cases first:
				if (
					data.account.notificationServerSettings.vapidKey == null ||
					sub.options.applicationServerKey == null
				) {
					sub.unsubscribe();
					return;
				}
				// and real comparison now. but it sucks:
				// https://stackoverflow.com/questions/45994933/changing-application-server-key-in-push-manager-subscription#comment137027226_75503694
				// https://github.com/GoogleChromeLabs/web-push-codelab/blob/469a70b1eb195eeb27f5901ab58bd8452f015d9a/completed/07-unsubscribe/scripts/main.js#L32
				const applicationServerKey = window
					.btoa(
						String.fromCharCode.apply(
							null,
							Array.from(new Uint8Array(sub.options.applicationServerKey))
						)
					)
					.replaceAll("+", "-")
					.replaceAll("/", "_")
					.replaceAll("=", "");

				if (applicationServerKey !== data.account.notificationServerSettings.vapidKey) {
					sub.unsubscribe();
					return;
				}

				return true;
			})
			.then((r) => {
				if (r !== true) {
					console.log("Unsubscribed push subscription");
				}
			});

		if (data.account.notificationServerSettings != null) {
			notificationServerSettingsState.set({
				url: data.account.notificationServerSettings.url,
				vapidKey: data.account.notificationServerSettings.vapidKey
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
					href="https://github.com/dcdunkan/retlab/commit/{__GIT_SHA__}"
					class="hover:text-primary"
				>
					{__GIT_SHORT_SHA__}
				</a>
			</div>
		</footer>
	</main>
</div>
