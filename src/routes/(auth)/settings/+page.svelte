<script lang="ts">
	import { negateFn } from "$lib";
	import Button from "$lib/components/button.svelte";
	import Box from "$lib/components/box";
	import { isHttpError } from "@sveltejs/kit";
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";
	import { toast } from "svelte-sonner";
	import SessionCard from "./session-card.svelte";
	import { getSessions, logoutSession, refreshHardCache } from "./settings.remote.js";
	import LogoutDialog from "./logout-dialog.svelte";
	import DestroyAccountDialog from "./destroy-account-dialog.svelte";

	let { data } = $props();

	const timeFormatter = new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "medium"
	});

	const sessions = getSessions();
	type Session = NonNullable<typeof sessions.current>[number];
	const isCurrentSession = (s: Session) => s.id == data.session.id;

	let refreshingHardCache = $state(false);
	let hardCacheLastUpdatedAt = $derived(data.account.last_updated_at);
</script>

<svelte:head>
	<title>Settings / Retlab</title>
</svelte:head>

<div>
	<h1 class="text-5xl font-bold">Settings</h1>
</div>

<section>
	<!-- <div class="relative right-1/2 left-1/2 mx-[-50vw] w-[100vw] max-w-none"> -->
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Cache</h2>
	<!-- </div> -->
	<p class="text-sm text-muted-foreground">
		Retlab uses many hacks to avoid a lot of errors that you get with Etlab's API. These workarounds
		include hard-caching because of weird rate limits from Etlab's side on important API endpoints.
		<!-- An attempt is made to refresh these cache every 24 hours. You can refresh your stored
		cache here, if your details seems wrong. -->
	</p>

	<div class="mt-4 divide-y-2 border-2">
		<div class="flex justify-between gap-4 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-serif font-bold">Refresh hard-cache</div>
					<p class="text-sm font-medium text-blue-600">
						Last updated at <b>{timeFormatter.format(hardCacheLastUpdatedAt)}</b>
					</p>
				</div>

				<p class="text-sm text-muted-foreground">
					<!-- Hard-cache mainly includes IDs such as semester ID, batch ID, profile image, profile name,
					semester name, register no, etc. -->
					Hard-cache mainly includes IDs and names returned from Etlab's dashboard API. And it can't be
					called frequently to have it not-cached,
					<b>because they often returns 429 & 500</b>. So, these are hard-cached, and refreshed on
					demand & periodically.
				</p>
			</div>

			<Button
				disabled={refreshingHardCache}
				onclick={async () => {
					refreshingHardCache = true;
					try {
						const lastUpdatedAt = await refreshHardCache();
						hardCacheLastUpdatedAt = lastUpdatedAt;
						toast.success("Refreshed hard-cache");
					} catch (error) {
						if (isHttpError(error)) {
							toast.error("Hard-cache refresh failed", { description: error.body.message });
						} else {
							toast.error("Something went wrong");
						}
					} finally {
						refreshingHardCache = false;
					}
				}}
			>
				{#if refreshingHardCache}
					<SpinnerIcon class="animate-spin" />
				{:else}
					Refresh
				{/if}
			</Button>
		</div>
	</div>
</section>

<section>
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">
		Sessions & Devices
	</h2>

	<p class="text-sm text-muted-foreground">
		You can manage your account sessions associated with Retlab here. But your Etlab's account
		sessions cannot be managed here, because there are no APIs for it afaik.
	</p>

	<div class="mt-4 space-y-2">
		<h3 class="text-lg italic">This session</h3>
		<div class="border-2 bg-blue-100">
			<SessionCard session={data.session} showLogout={false} />
		</div>

		{#if sessions.loading}
			<Box.Loading>Fetching account sessions</Box.Loading>
		{:else if sessions.current}
			{@const otherSessions = sessions.current.filter(negateFn(isCurrentSession))}
			<h3 class="text-lg italic">Other sessions</h3>
			{#if otherSessions.length > 0}
				<div class="max-h-64 divide-y-2 overflow-scroll border-2">
					{#each otherSessions as session (session.id)}
						<SessionCard
							{session}
							showLogout
							onLogout={async () => {
								await logoutSession({ session_id: session.id });
								getSessions().refresh();
							}}
						/>
					{/each}
				</div>
			{:else}
				<Box.Empty>You do not have any other sessions</Box.Empty>
			{/if}
		{:else}
			<Box.Error>Failed to fetch your account sessions</Box.Error>
		{/if}
	</div>
</section>

<section class="space-y-4">
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Account</h2>
	<!-- <p class="text-sm text-muted-foreground">
			Retlab uses many hacks to avoid a lot of errors that you get with Etlab's API. These
			workarounds include hard-caching because of weird rate limits from Etlab's side on frequently
			used API endpoints. An attempt is made to refresh these cache every 24 hours. You can refresh
			your stored cache here, if your details seems wrong.
		</p> -->

	<div class="divide-y-2 border-2">
		<div class="flex justify-between gap-4 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-serif font-bold">Logout from your account</div>
					<p class="text-sm font-medium text-blue-600">
						You logged in at <b>{timeFormatter.format(data.session.created_at)}</b>
					</p>
				</div>

				<p class="text-sm text-muted-foreground">
					This does <b>not</b> really logs out your account session from Etlab btw. But, you log out from
					Retlab, and Retlab WILL call the logout route of Etlab's API, but it doesn't seem to have any
					real effect (meaning, your access token is still valid).
				</p>
			</div>
			<LogoutDialog />
		</div>

		<div class="flex justify-between gap-4 bg-red-300 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-serif font-bold">Destroy your account</div>
				</div>
				<p class="text-sm text-black/80">
					Delete your Retlab account, and everything with it. This doesn't do anything to your
					actual Etlab account.
				</p>
			</div>
			<DestroyAccountDialog />
		</div>
	</div>
</section>

<div class="min-h-[50svh]"></div>
