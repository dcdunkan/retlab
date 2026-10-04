<script lang="ts">
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	import { cutePercent, safeDivision } from "$lib";
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { cachedGracefulRemoteQuery, settingsState } from "../states.svelte";
	import type { PageProps } from "./$types";
	import AttendanceCard from "./attendance-card.svelte";
	import * as remotes from "./attendance.remote";
	import AttendanceCalendar from "./attendance-calendar.svelte";

	let { data }: PageProps = $props();

	const attendanceData = cachedGracefulRemoteQuery(
		{ name: "getAttendance", version: 1 },
		remotes.getAttendance
	);
	onMount(async () => {
		await attendanceData.load(data.sessionUser);
	});
	let attendancePercentThresholds = $derived(
		[settingsState.value.attendancePercentMin, settingsState.value.attendancePercentMax].map(
			(p) => p / 100
		) as [number, number]
	);

	let attendanceMode = $state<"normal" | "duty_leave">("duty_leave");
</script>

<svelte:head>
	<title>Attendance / Retlab</title>
</svelte:head>

{#if attendanceData.loading}
	<Box.Loading>Loading...</Box.Loading>
{:else if attendanceData.data}
	{@const total = attendanceData.data.reduce(
		(p, c) => ({
			attended: p.attended + c[attendanceMode].attended,
			classes: p.classes + c[attendanceMode].classes
		}),
		{ attended: 0, classes: 0 }
	)}
	{@const totalPercent = cutePercent(safeDivision(total.attended, total.classes) * 100, 0)}

	<div class="flex flex-col justify-between gap-4 sm:flex-row">
		<h1 class="text-6xl font-bold">{totalPercent} %</h1>

		<Button
			variant="outline"
			size="sm"
			onclick={() => (attendanceMode = attendanceMode === "duty_leave" ? "normal" : "duty_leave")}
		>
			Include duty leave
			{#if attendanceMode === "duty_leave"}
				<CheckIcon weight="bold" />
			{:else}
				<XIcon weight="bold" />
			{/if}
		</Button>
	</div>

	<div class="grid grid-flow-row">
		{#each attendanceData.data as subject, i (i)}
			<AttendanceCard {attendancePercentThresholds} {subject} {attendanceMode} />
		{/each}
	</div>

	<AttendanceCalendar sessionUser={data.sessionUser} />

	<!-- <section class="w-full">
		<GearIcon weight="fill" size="1.5em" />
		<div class="flex place-items-center gap-2">
			<Checkbox id="duty-leave-mode" name="show-duty-leave-values" />
			<label for="duty-leave-mode">Show duty leave values</label>
		</div>
	</section> -->
{:else}
	<Box.Error>
		{isHttpError(attendanceData.error) ? attendanceData.error.body.message : "Something went wrong"}
	</Box.Error>
{/if}
