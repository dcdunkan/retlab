<script lang="ts">
	import { negateFn } from "$lib";
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { Slider } from "bits-ui";
	import FloppyDiskBackIcon from "phosphor-svelte/lib/FloppyDiskBackIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import { toast } from "svelte-sonner";
	import { DEFAULT_SETTINGS, settingsState } from "../settings.svelte";
	import type { PageProps } from "./$types.js";
	import DestroyAccountDialog from "./destroy-account-dialog.svelte";
	import LogoutDialog from "./logout-dialog.svelte";
	import SessionCard from "./session-card.svelte";
	import {
		getSessions,
		logoutSession,
		refreshHardCache,
		updateSettings
	} from "./settings.remote.js";
	import Select from "$lib/components/select.svelte";
	import type { ExpandAttendanceSubjectCardsOption } from "$lib/types";

	let { data }: PageProps = $props();

	const timeFormatter = new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "medium"
	});

	const sessions = getSessions();
	type Session = NonNullable<typeof sessions.current>[number];
	const isCurrentSession = (s: Session) => s.id == data.session.id;

	let refreshingHardCache = $state(false);
	let hardCacheLastUpdatedAt = $derived(data.account.lastUpdatedAt);

	let tweaks = $state<{
		saving: boolean;
		attendanceCutoffs: {
			initial: [number, number];
			current: [number, number];
		};
		expandAttendanceSubjectCards: {
			initial: ExpandAttendanceSubjectCardsOption;
			current: ExpandAttendanceSubjectCardsOption;
		};
	}>();

	let expandAttendanceSubjectCardsOptions: Record<ExpandAttendanceSubjectCardsOption, string> = {
		none: "None",
		"barely-safe": "Barely safe",
		"below-excellence": "Below excellence",
		critical: "Critical",
		all: "All"
		// "single-hyphen": "Single hyphen (-)",
		// "double-hyphen": "Double hyphen (--)",
		// mdash: "Em dash (—)",
		// ndash: "en dash (–)"
	};

	function isExpandAttendanceSubjectCardsOption(
		v: string
	): v is ExpandAttendanceSubjectCardsOption {
		return v in expandAttendanceSubjectCardsOptions;
	}

	$effect(() => {
		const settings = settingsState.value;
		if (settingsState.resolved) {
			// resolved settings:
			console.log(settings);

			const initials: {
				attendanceCutoffs: [number, number];
				expandAttendanceSubjectCards: ExpandAttendanceSubjectCardsOption;
			} = {
				attendanceCutoffs: [settings.attendancePercentMin, settings.attendancePercentMax],
				expandAttendanceSubjectCards: isExpandAttendanceSubjectCardsOption(
					settings.expandAttendanceSubjects
				)
					? settings.expandAttendanceSubjects
					: DEFAULT_SETTINGS.expandAttendanceSubjects
			};

			tweaks = {
				saving: false,
				attendanceCutoffs: {
					initial: initials.attendanceCutoffs,
					current: initials.attendanceCutoffs
				},
				expandAttendanceSubjectCards: {
					initial: initials.expandAttendanceSubjectCards,
					current: initials.expandAttendanceSubjectCards
				}
			};
		} else {
			// logical defaults:
			const initials: {
				attendanceCutoffs: [number, number];
				expandAttendanceSubjectCards: ExpandAttendanceSubjectCardsOption;
			} = { attendanceCutoffs: [75, 90], expandAttendanceSubjectCards: "critical" };
			tweaks = {
				saving: false,
				attendanceCutoffs: {
					initial: initials.attendanceCutoffs,
					current: initials.attendanceCutoffs
				},
				expandAttendanceSubjectCards: {
					initial: initials.expandAttendanceSubjectCards,
					current: initials.expandAttendanceSubjectCards
				}
			};
		}
	});
</script>

<svelte:head>
	<title>Settings / Retlab</title>
</svelte:head>

<div>
	<h1 class="text-5xl font-bold">Settings</h1>
</div>

<section>
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Tweaks</h2>
	<p class="text-sm text-muted-foreground">Tweak some of the application behavior.</p>

	{#if tweaks != null}
		<div class="mt-4 divide-y-2 border-2">
			<div class="flex justify-between gap-4 px-4 py-3">
				<div class="space-y-2">
					<div>
						<div class="font-serif font-bold">Attendance percentage cutoff</div>
					</div>

					<p class="text-sm text-muted-foreground">
						Adjust the percent cutoff for safe attendance range, so the attendance page can show
						more helpful text for you!
					</p>

					<div class="mt-4 space-y-2">
						<Slider.Root
							max={99}
							type="multiple"
							bind:value={tweaks.attendanceCutoffs.current}
							class="relative flex w-full touch-none items-center select-none"
						>
							<span
								class="relative h-3 w-full grow cursor-pointer overflow-hidden border-2 bg-background"
							>
								<span
									class="absolute h-full bg-red-300"
									style="left: 0; right: {99 - tweaks.attendanceCutoffs.current[0]}%"
								></span>
								<Slider.Range class="h-full bg-green-300" />
								<span
									class="absolute h-full bg-amber-300"
									style="right: 0; left: {tweaks.attendanceCutoffs.current[1] + 1}%"
								></span>
							</span>
							<Slider.Thumb
								index={0}
								class="peer/min block size-4 cursor-pointer border-2 bg-background shadow-sm"
							/>
							<Slider.ThumbLabel
								index={0}
								position="top"
								class="my-1 hidden bg-foreground/50 px-2 py-1 text-sm text-background peer-hover/min:block data-active:block"
							>
								{tweaks.attendanceCutoffs.current[0]}
							</Slider.ThumbLabel>
							<Slider.Thumb
								index={1}
								class="peer/max block size-4 cursor-pointer border-2 bg-background shadow-sm"
							/>
							<Slider.ThumbLabel
								index={1}
								position="top"
								class="my-1 hidden bg-foreground/50 px-2 py-1 text-sm text-background peer-hover/max:block data-active:block"
							>
								{tweaks.attendanceCutoffs.current[1]}
							</Slider.ThumbLabel>
						</Slider.Root>

						<ul class="list-inside list-[square] text-sm">
							<li>
								Above or equal to <input
									disabled={tweaks.saving}
									type="number"
									min="0"
									max={tweaks.attendanceCutoffs.current[1]}
									step="1"
									bind:value={tweaks.attendanceCutoffs.current[0]}
									class="p-0 pl-1"
								/>
								% is considered
								<b class="text-green-600">safe</b>.
							</li>
							<li>
								Above or equal to <input
									disabled={tweaks.saving}
									type="number"
									min={tweaks.attendanceCutoffs.current[0]}
									max="99"
									step="1"
									bind:value={tweaks.attendanceCutoffs.current[1]}
									class="p-0 pl-1"
								/>
								% is considered
								<b class="text-amber-500">excellent</b>!
							</li>
						</ul>
					</div>
				</div>
			</div>

			<div class="flex justify-between gap-4 px-4 py-3">
				<div class="space-y-2">
					<div>
						<div class="font-serif font-bold">Expand attendance subject cards</div>
					</div>

					<p class="text-sm text-muted-foreground">
						Configure how the subject cards in the attendance page should be shown. It can be
						adjusted to only expand the critical ones!
					</p>
				</div>

				<Select
					type="single"
					items={Object.entries(expandAttendanceSubjectCardsOptions).map(([value, label]) => ({
						label: label,
						value: value,
						disabled: false
					}))}
					bind:value={tweaks.expandAttendanceSubjectCards.current}
				>
					{#snippet trigger(label)}
						{#if label != null}
							{label}
						{:else}
							GHeyyy
						{/if}
					{/snippet}
				</Select>
			</div>
		</div>

		<div class="mt-2">
			<Button
				size="default"
				disabled={tweaks.saving ||
					// tweaks.attendanceCutoffs.current[0] > tweaks.attendanceCutoffs.current[1] || todo: shouldn't handle it here.
					(tweaks.attendanceCutoffs.initial[0] == tweaks.attendanceCutoffs.current[0] &&
						tweaks.attendanceCutoffs.initial[1] == tweaks.attendanceCutoffs.current[1] &&
						tweaks.expandAttendanceSubjectCards.initial ===
							tweaks.expandAttendanceSubjectCards.current)}
				onclick={async () => {
					// todo: write a better disabled check and "change detection" algorithm.
					if (tweaks == null) {
						toast("This should not happen, just so you know.");
						return;
					}
					tweaks.saving = true;
					const toastId = toast.loading("Saving changes...");
					try {
						// save changes in db
						await updateSettings({
							...settingsState.value,
							attendancePercentMin: tweaks.attendanceCutoffs.current[0],
							attendancePercentMax: tweaks.attendanceCutoffs.current[1],
							expandAttendanceSubjects: tweaks.expandAttendanceSubjectCards.current
						});

						// update initials after saving the settings in db
						tweaks.attendanceCutoffs.initial = tweaks.attendanceCutoffs.current;
						tweaks.expandAttendanceSubjectCards.initial =
							tweaks.expandAttendanceSubjectCards.current;

						// update the global settings state
						settingsState.set({
							attendancePercentMin: tweaks.attendanceCutoffs.current[0],
							attendancePercentMax: tweaks.attendanceCutoffs.current[1],
							expandAttendanceSubjects: tweaks.expandAttendanceSubjectCards.current
						});
						toast.success("Save successful", { id: toastId });
					} catch (error) {
						console.error(error);
						toast.error("Save failed", { id: toastId });
					} finally {
						tweaks.saving = false;
					}
				}}
			>
				<FloppyDiskBackIcon weight="fill" /> Save changes
			</Button>
		</div>
	{:else}
		<Box.Loading>Fetching values...</Box.Loading>
	{/if}
</section>

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
					<b>because they often return 429 & 500</b>. So, these are hard-cached, and refreshed on
					demand & periodically.
				</p>
			</div>

			<Button
				size={refreshingHardCache ? "icon" : "default"}
				disabled={refreshingHardCache}
				onclick={async () => {
					refreshingHardCache = true;
					const toastId = toast.loading("Refreshing hard-cache...");
					try {
						const lastUpdatedAt = await refreshHardCache();
						hardCacheLastUpdatedAt = lastUpdatedAt;
						toast.success("Refreshed hard-cache", { id: toastId });
					} catch (error) {
						if (isHttpError(error)) {
							toast.error("Hard-cache refresh failed", {
								description: error.body.message,
								id: toastId
							});
						} else {
							toast.error("Something went wrong", { id: toastId });
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
						You logged in at <b>{timeFormatter.format(data.session.createdAt)}</b>
					</p>
				</div>

				<p class="text-sm text-muted-foreground">
					This does <b>not</b> really log out your account session from Etlab btw. But, you log out from
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
