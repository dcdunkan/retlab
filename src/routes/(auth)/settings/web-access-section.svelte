<script lang="ts">
	import QuestionIcon from "phosphor-svelte/lib/QuestionIcon";

	import Box from "$lib/components/box";
	import Highlight from "$lib/components/highlight.svelte";
	import Input from "$lib/components/input.svelte";
	import Timestamp from "$lib/components/timestamp.svelte";
	import { onMount } from "svelte";
	import { slide } from "svelte/transition";
	import { cachedGracefulRemoteQuery, webAccessSettingsState } from "../states.svelte";
	import type { PageData } from "./$types";
	import WebAccessAuthenticateDialog from "./web-access-authenticate-dialog.svelte";
	import WebAccessDisableDialog from "./web-access-disable-dialog.svelte";
	import WebAccessSetupDialog from "./web-access-setup-dialog.svelte";
	import * as remotes from "./web-access.remote";
	import WebSessionRevokeDialog from "./web-session-revoke-dialog.svelte";
	import WebSessionsList from "./web-sessions-list.svelte";

	let readMore = $state(false);

	let password = $state("");

	let { sessionUser }: Pick<PageData, "sessionUser"> = $props();

	let webSessions = cachedGracefulRemoteQuery(
		{ name: "getMyWebSessions", version: 1 },
		remotes.getMyWebSessions
	);

	onMount(async () => {
		await webSessions.load(sessionUser);
	});
</script>

<section class="space-y-2">
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Web Access</h2>

	<p class="text-sm">
		Etlab's web version has some extra data / features that are not available in the native Android
		& iOS applications. <Highlight>Web access</Highlight> allows you to access Etlab web features in Retlab.
		But, it requires you setting this up first & authenticating with passcode once web session expires.
	</p>

	<div class="mt-4 w-full border-2 border-border">
		<button
			class="flex w-full place-items-center gap-2 px-4 py-2"
			onclick={() => (readMore = !readMore)}
		>
			<QuestionIcon weight="bold" class="shrink-0 text-ret-accent" />
			<div class="flex-1 text-left font-bold">Why enter my password?</div>
			<div class="text-right text-xs text-muted-foreground">
				{#if readMore}
					collapse
				{:else}
					expand
				{/if}
			</div>
		</button>

		{#if readMore}
			<div class="space-y-2 px-4 pb-3 text-sm" transition:slide>
				<p>
					Web access feature allows you to access Etlab web features in Retlab. But, as you may
					know, Retlab uses the same APIs as the native Etlab clients (Android & iOS apps). But web
					is different; instead of calling those APIs, the web page is rendered on their servers and
					showed it to you. So, no clean data is there &mdash; lot's of cleaning up is required, so
					it might break.
				</p>
				<p>
					But even more importantly, when you use Etlab native application or Retlab, it relies on
					the access token Etlab provides upon logging in, which doesn't expire, allowing you to use
					it forever without logging you out. But, Etlab web is different. It has a
					<Highlight>1 hour of inactivity</Highlight> (experimentally measured, may not be accurate across
					instances) session expiry time. Once, the session is expired you will be asked to log in again
					to continue. So, to bring those web-only features to Retlab, you'll have to log in each time
					the session expires.
				</p>
				<p>
					But entering your password every time? <i>Not good</i>. You may mistype it, and entering
					it every time is not a good experience either. So you can setup a <b>6-digit passcode</b>,
					which is used to decrypt your password. So you provide your password + passcode (6-digit
					key), Retlab stores your <b>encrypted password</b> (not passcode), and you can then later
					simply enter the 6-digit passcode to let Ret decrypt & obtain your password to log in and
					perform data extraction from web features.
					<b>Only you know the passcode, <Highlight>so keep it a secret</Highlight></b>. If you ever
					forget it, you can reset web-access and revoke any active web sessions.
				</p>
			</div>
		{/if}
	</div>

	{#if webAccessSettingsState.resolved}
		<div class="divide-y-2 divide-border border-2 border-border">
			<div class="space-y-2 px-4 py-3">
				<div class="flex justify-between gap-4">
					<div>
						<div class="font-bold">Setup web access</div>
						{#if webAccessSettingsState.value != null}
							<p class="text-sm font-medium text-ret-accent">Currently enabled.</p>
						{/if}
					</div>

					{#if webAccessSettingsState.value != null}
						<WebAccessDisableDialog bind:webSessions={webSessions.data} />
					{/if}
				</div>

				{#if webAccessSettingsState.value == null}
					<p class="text-sm">Enter your password and a 6-digit passcode to enable web access.</p>
				{:else}
					<p class="text-sm">
						You currently have enabled web access. You will be able to access supported web-features
						which also has support in your institution's Etlab web instance. You can disable web
						access and revoke active web session any time you want. If you ever change you password,
						you must disable and reset this.
					</p>
				{/if}

				{#if webAccessSettingsState.value == null}
					<Input
						type="password"
						bind:value={password}
						placeholder="Etlab account password"
						class="w-full"
					/>
					<WebAccessSetupDialog
						{password}
						disabled={password.length === 0}
						bind:webSessions={webSessions.data}
					/>
				{/if}
			</div>
		</div>

		<div class="mt-4 space-y-2">
			<div class="flex justify-between gap-4">
				<h2 class="text-xl capitalize italic">Your web sessions</h2>
			</div>

			<p class="text-sm">You can manage upto 20 of your active & previous web sessions here.</p>
		</div>

		{#if webSessions.loading}
			<Box.Loading>Fetching your web sessions...</Box.Loading>
		{:else if webSessions.data != null}
			{#if webSessions.data.expired.length === 0 && webSessions.data.active.length === 0}
				<Box.Empty>It's empty over here, enable web-access to make some sessions.</Box.Empty>
			{:else}
				{#if webSessions.data.active.length === 1}
					{@const ws = webSessions.data.active[0]}
					<div class="flex justify-between gap-4 border-2 border-border px-4 py-3">
						<div>
							<div class="font-bold text-success-foreground">Active session</div>
							<ul class="list-[square] pl-4 text-sm *:list-item">
								<li>Logged in <Timestamp timestamp={ws.loggedInAt} /></li>
								<li>Expires <Timestamp timestamp={ws.expiresAt} /></li>
								<li>Total {ws.requestsMade} requests made.</li>
								<li>Last used <Timestamp timestamp={ws.lastUsedAt} /></li>
							</ul>
						</div>
						<WebSessionRevokeDialog webSessionId={ws.id} bind:webSessions={webSessions.data} />
					</div>
				{:else}
					<Box.Empty class="space-y-2 p-4 text-xs">
						<div>You do not have an active web session.</div>
						{#if webAccessSettingsState.value != null}
							<WebAccessAuthenticateDialog bind:webSessions={webSessions.data} />
						{/if}
					</Box.Empty>
				{/if}

				{#if webSessions.data.expired.length > 0}
					<h3 class="text-lg italic">Previous Sessions ({webSessions.data.expired.length})</h3>
					<WebSessionsList wsessions={webSessions.data.expired} />
				{/if}
			{/if}
		{:else}
			<Box.Error>Failed to fetch your web sessions</Box.Error>
		{/if}
	{:else}
		<Box.Loading>Loading web access configuration...</Box.Loading>
	{/if}
</section>
