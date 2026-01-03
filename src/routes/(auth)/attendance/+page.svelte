<script lang="ts">
	import { cutePercent, pluralize, safeDivision } from "$lib";
	import { SvelteSet } from "svelte/reactivity";
	import { slide } from "svelte/transition";
	import { titleCase } from "title-case";
	import { getAttendance } from "./attendance.remote";
	import ErrorBox from "$lib/components/error-box.svelte";
	import LoadingBox from "$lib/components/loading-box.svelte";

	const attendanceData = getAttendance();
	let showAdvancedAttendance = new SvelteSet<number>();
</script>

<svelte:head>
	<title>Attendance / Retlab</title>
</svelte:head>

{#if attendanceData.loading}
	<LoadingBox>Loading...</LoadingBox>
{:else if attendanceData.current}
	{@const total = attendanceData.current.reduce(
		(p, c) => ({
			attended: p.attended + c.attended,
			classes: p.classes + c.classes
		}),
		{ attended: 0, classes: 0 }
	)}
	{@const totalPercent = cutePercent(safeDivision(total.attended, total.classes) * 100, 0)}

	<h1 class="text-5xl font-bold">{totalPercent} %</h1>

	<div class="grid grid-flow-row">
		{#each attendanceData.current as subject, i (i)}
			<!-- todo: find a way to replace 0.75 with database value -->
			{@const preferred = Math.floor(subject.attended / 0.75)}
			{@const percent = cutePercent(safeDivision(subject.attended, subject.classes) * 100, 1)}

			<div
				role="button"
				tabindex="0"
				onkeydown={() => {}}
				onclick={() => {
					if (showAdvancedAttendance.has(i)) showAdvancedAttendance.delete(i);
					else showAdvancedAttendance.add(i);
				}}
				class="border-2 border-b-0 last:border-b-2"
			>
				{#if showAdvancedAttendance.has(i)}
					<div transition:slide class="flex">
						<div
							data-percent={percent}
							data-type="bg"
							style="--percent: {percent}; height: 6px; width: {percent}%;"
							class="bottom-0 left-0 transition-all ease-out"
						></div>
						<div
							style="height: 6px; width: calc(100 - {percent})%;"
							class="bottom-0 left-0 bg-muted transition-all ease-out"
						></div>
					</div>
				{/if}

				<div class="flex space-x-2 px-3 py-2">
					<div class="space-y-0.5">
						<div class="text-sm font-bold text-muted-foreground">{subject.code}</div>
						<div class="line-clamp-2 w-full text-base font-medium text-wrap">
							{titleCase(subject.name.toLocaleLowerCase("en") + " ").repeat(1)}
						</div>
					</div>
					<div class="flex flex-1 flex-col items-end">
						<div class="flex gap-1 font-serif text-2xl font-bold text-nowrap">
							{percent}
							<span class="text-lg">%</span>
						</div>
						<div class="text-nowrap">{subject.attended} / {subject.classes}</div>
					</div>
				</div>

				{#if showAdvancedAttendance.has(i)}
					<div transition:slide class="w-full border-t-2 border-dashed bg-muted px-3 py-2 text-xs">
						{#if subject.classes <= 0}
							<span class="text-muted-foreground"> No classes have been taken yet.</span>
						{:else if preferred == subject.classes}
							<span class="font-bold text-amber-600">Barely safe!</span>
						{:else if preferred > subject.classes}
							{@const cuttable = preferred - subject.classes}
							<span class="text-green-600">You are safe!</span> You can cut
							<span class="font-bold">{cuttable}</span>
							{pluralize(cuttable, "class", "classes")}.
						{:else}
							{@const needed = Math.max(0, 3 * subject.classes - 4 * subject.attended)}
							<span class="font-bold text-red-600 uppercase">Critical!</span> You need to attend at
							least
							<span class="font-bold">{needed}</span>
							{pluralize(needed, "class", "classes")}!
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<ErrorBox>
		<p>Something went wrong</p>
	</ErrorBox>
{/if}

<style>
	[data-percent] {
		background-color: hsl(var(--percent) 100% 35%) !important;
	}
</style>
