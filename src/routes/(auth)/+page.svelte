<script lang="ts">
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import BarbellIcon from "phosphor-svelte/lib/BarbellIcon";
	import CalendarCheckIcon from "phosphor-svelte/lib/CalendarCheckIcon";
	import ChartLineIcon from "phosphor-svelte/lib/ChartLineIcon";
	import ExamIcon from "phosphor-svelte/lib/ExamIcon";

	import pressSound_opus from "$lib/assets/press-sound.opus";

	import { default as Box, default as box } from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import { onMount } from "svelte";
	import { useSound } from "svelte-attach-sound";
	import { MediaQuery } from "svelte/reactivity";
	import AssignmentCard from "./assignment-card.svelte";
	import * as remotes from "./dashboard.remote";
	import { cachedGracefulRemoteQuery, getClientSessionUser } from "./states.svelte";
	import ChangeDisplayNameDialog from "./settings/change-display-name-dialog.svelte";
	import { slide } from "svelte/transition";

	const sessionUser = getClientSessionUser();

	let assignmentsData = cachedGracefulRemoteQuery(
		{ name: "getDueAssignments", version: 1 },
		remotes.getDueAssignments
	);
	onMount(async () => {
		await assignmentsData.load(sessionUser, {});
	});

	async function hardRefreshAssignments() {
		await assignmentsData.load(sessionUser, { _l1: false }, { readIdbCache: false });
	}

	const clickSfx = useSound(pressSound_opus, ["click"], { volume: 0.75 });

	const isLarge = new MediaQuery("min-width: 32rem"); // note: its actually 40em tho (https://tailwindcss.com/docs/responsive-design#overview)
	let changeDisplayNameDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Dashboard / Retlab</title>
</svelte:head>

<div>
	<div>Hey there</div>
	<div class="font-serif text-4xl font-bold">
		{#if sessionUser.account.profileName === sessionUser.account.displayName}
			<button
				onclick={() => {
					changeDisplayNameDialogOpen = true;
				}}>{sessionUser.account.displayName}<span class="text-ret-accent">*</span>!</button
			>
		{:else}
			{sessionUser.account.displayName}!
		{/if}
	</div>
</div>

<div class="space-y-2">
	<Button class="transition-none" {@attach clickSfx()}>Relax &lpar;0ms&rpar;</Button>
	<Button variant="destructive" class="transition-all duration-75" {@attach clickSfx()}>
		Relax &lpar;75ms&rpar;
	</Button>
	<Button variant="outline" class="transition-all duration-150" {@attach clickSfx()}>
		Relax &lpar;150ms&rpar;
	</Button>
</div>

<div class="space-y-2">
	<Button variant="outline" href="/attendance">
		<CalendarCheckIcon weight="bold" /> Attendance
	</Button>
	<Button variant="outline" href="/assignments">
		<BarbellIcon weight="bold" /> Assignments
	</Button>
	<Button variant="outline" href="/results">
		<ExamIcon weight="bold" /> Results
	</Button>
</div>

<div class="space-y-2">
	<Button variant="outline" href="/academic-analysis">
		<ChartLineIcon weight="bold" /> Academic Analysis
	</Button>
</div>

<div class="space-y-4">
	<div class="flex place-items-center justify-between gap-2">
		<h2 class="text-2xl">Assignments Due</h2>
		<Button
			href="/assignments"
			variant="outline"
			shadow="default"
			size={isLarge.current ? "sm" : "icon-sm"}
		>
			{#if isLarge.current}Show all{/if}
			<ArrowRightIcon />
		</Button>
	</div>

	{#if assignmentsData.loading}
		<Box.Loading>Loading due assignments...</Box.Loading>
	{:else if assignmentsData.data}
		<div>
			{#each assignmentsData.data as assignment (assignment.id)}
				<AssignmentCard
					assignment={{ ...assignment, status: "due" }}
					showResult={false}
					hardRefreshAssignmentsList={hardRefreshAssignments}
				/>
			{:else}
				<box.Empty>You have no assignments due.</box.Empty>
			{/each}
		</div>
	{:else if assignmentsData.error}
		<Box.Error>Something went wrong</Box.Error>
	{/if}
</div>

<!-- <h1 class="text-2xl capitalize">
	{data.account.profile_name.toLowerCase()}
</h1> -->

{#if sessionUser.account.displayName === sessionUser.account.profileName}
	<p class="text-xs text-muted-foreground" transition:slide>
		<span class="text-ret-accent">*</span> click to change your display name.
	</p>
{/if}

<ChangeDisplayNameDialog bind:open={changeDisplayNameDialogOpen} />
