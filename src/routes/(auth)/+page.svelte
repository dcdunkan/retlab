<script lang="ts">
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import BarbellIcon from "phosphor-svelte/lib/BarbellIcon";
	import CalendarCheckIcon from "phosphor-svelte/lib/CalendarCheckIcon";
	import ChartLineIcon from "phosphor-svelte/lib/ChartLineIcon";

	import pressSound_opus from "$lib/assets/press-sound.opus";
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import { onMount } from "svelte";
	import { useSound } from "svelte-attach-sound";
	import AssignmentCard from "./assignment-card.svelte";
	import * as remotes from "./dashboard.remote";
	import { cachedGracefulRemoteQuery, webAccessSettingsState } from "./states.svelte";
	import type { PageProps } from "./$types";
	import box from "$lib/components/box";

	let { data }: PageProps = $props();

	let assignmentsData = cachedGracefulRemoteQuery(
		{ name: "getDueAssignments", version: 1 },
		remotes.getDueAssignments
	);
	onMount(async () => {
		await assignmentsData.load(data.sessionUser);
	});

	const clickSfx = useSound(pressSound_opus, ["click"], { volume: 0.75 });
</script>

<svelte:head>
	<title>Dashboard / Retlab</title>
</svelte:head>

<div>
	<Button class="transition-none" {@attach clickSfx()}>Relax &lpar;0ms&rpar;</Button>
	<Button variant="destructive" class="transition-all duration-75" {@attach clickSfx()}>
		Relax &lpar;75ms&rpar;
	</Button>
	<Button variant="outline" class="transition-all duration-150" {@attach clickSfx()}>
		Relax &lpar;150ms&rpar;
	</Button>
</div>

<div>
	<Button variant="outline" href="/attendance">
		<CalendarCheckIcon weight="bold" /> Attendance
	</Button>
	<Button variant="outline" href="/assignments">
		<BarbellIcon weight="bold" /> Assignments
	</Button>
</div>

{#if webAccessSettingsState.resolved && webAccessSettingsState.value != null}
	<div>
		<Button variant="outline" href="/academic-analysis">
			<ChartLineIcon weight="bold" /> Academic Analysis
		</Button>
	</div>
{/if}

<div class="flex place-items-center justify-between">
	<h2 class="text-2xl font-bold">Assignments Due</h2>
	<Button href="/assignments" variant="outline" shadow="default" size="sm">
		Show all <ArrowRightIcon />
	</Button>
</div>

{#if assignmentsData.loading}
	<Box.Loading>Loading due assignments...</Box.Loading>
{:else if assignmentsData.data}
	<div>
		{#each assignmentsData.data as assignment (assignment.id)}
			<AssignmentCard assignment={{ ...assignment, status: "due" }} showResult={false} />
		{:else}
			<box.Empty>You have no assignments due.</box.Empty>
		{/each}
	</div>
{:else if assignmentsData.error}
	<Box.Error>Something went wrong</Box.Error>
{/if}

<!-- <h1 class="text-2xl capitalize">
	{data.account.profile_name.toLowerCase()}
</h1> -->
