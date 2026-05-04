<script lang="ts">
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import AssignmentCard from "./assignment-card.svelte";

	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import BriefcaseIcon from "phosphor-svelte/lib/BriefcaseIcon";
	import CalendarCheckIcon from "phosphor-svelte/lib/CalendarCheckIcon";
	import HeartIcon from "phosphor-svelte/lib/HeartIcon";
	import SealWarningIcon from "phosphor-svelte/lib/SealWarningIcon";

	import { getDueAssignments } from "./dashboard.remote";

	const assignmentsData = getDueAssignments();
</script>

<svelte:head>
	<title>Dashboard / Retlab</title>
</svelte:head>

<section class="flex place-items-start gap-2 border-2 border-amber-400 bg-amber-200 p-2">
	<SealWarningIcon weight="fill" size="1.5em" class="block shrink-0 text-amber-600" />
	<p class="text-xs font-medium text-amber-800">
		Retlab is under heavy construction at the moment. You may see features and tweaks come and go
		and work unreliably. I am currently working on bringing notifications support and PWA stuff. <b
			>DO NOT TRY THOSE YET even if you are prompted to.</b
		>
	</p>
</section>

<div>
	<Button class="transition-none">Relax</Button>
	<Button variant="destructive" class="transition-all duration-75">Relax</Button>
	<Button variant="outline" class="transition-all duration-150">Relax</Button>
</div>

<div>
	<Button variant="outline" href="/attendance">
		<CalendarCheckIcon weight="fill" /> Attendance
	</Button>
	<Button variant="outline" href="/assignments">
		<BriefcaseIcon weight="fill" /> Assignments
	</Button>
</div>

<div class="flex place-items-center justify-between">
	<h2 class="text-2xl font-bold">Assignments Due</h2>
	<Button href="/assignments" variant="outline" shadow="default" size="sm"
		>Show all <ArrowRightIcon /></Button
	>
</div>

{#if assignmentsData.error}
	<Box.Error>Something went wrong</Box.Error>
{:else if assignmentsData.ready}
	<div>
		{#each assignmentsData.current as assignment (assignment.id)}
			<AssignmentCard {assignment} />
		{/each}
	</div>
{:else}
	<Box.Loading>Loading due assignments...</Box.Loading>
{/if}

<section class="flex place-items-center gap-2 border-2 border-muted-foreground p-2">
	<HeartIcon weight="fill" size="1.25em" class="block shrink-0 text-rose-600/70" />
	<p class="text-xs font-medium text-muted-foreground">
		Retlab is open-source btw! Checkout the source code on GitHub:
		<a href="https://github.com/dcdunkan/retlab" class="text-primary underline hover:text-blue-500"
			>https://github.com/dcdunkan/retlab</a
		>. Any kind of help with the development is appreciated :)
	</p>
</section>

<!-- <h1 class="text-2xl capitalize">
	{data.account.profile_name.toLowerCase()}
</h1> -->
