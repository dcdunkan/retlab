<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import Box from "$lib/components/box";
	import AssignmentCard from "./assignment-card.svelte";

	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRight";
	import BriefcaseIcon from "phosphor-svelte/lib/Briefcase";
	import CalendarCheckIcon from "phosphor-svelte/lib/CalendarCheck";

	import { getDueAssignments } from "./dashboard.remote";

	const assignmentsData = getDueAssignments();
</script>

<svelte:head>
	<title>Dashboard / Retlab</title>
</svelte:head>

<div>
	<Button class="transition-none">Relax</Button>
	<Button variant="destructive" class="transition-all duration-75">Relax</Button>
	<Button variant="outline" class="transition-all duration-150">Relax</Button>
</div>

<div>
	<Button variant="outline" href="/attendance">
		<CalendarCheckIcon /> Attendance
	</Button>
	<Button variant="outline" href="/assignments">
		<BriefcaseIcon /> Assignments
	</Button>
</div>

<div class="flex place-items-center justify-between">
	<h2 class="text-2xl font-bold">Assignments Due</h2>
	<Button href="/assignments" variant="outline" shadow="default" size="sm"
		>Show all <ArrowRightIcon /></Button
	>
</div>

{#if assignmentsData.loading}
	<Box.Loading>Loading due assignments...</Box.Loading>
{:else if assignmentsData.current}
	<div>
		{#each assignmentsData.current as assignment (assignment.id)}
			<AssignmentCard {assignment} />
		{/each}
	</div>
{:else}
	<Box.Error>Something went wrong</Box.Error>
{/if}

<!-- <h1 class="text-2xl capitalize">
	{data.account.profile_name.toLowerCase()}
</h1> -->
