<script lang="ts">
	import { cutePercent, safeDivision } from "$lib";
	import Box from "$lib/components/box";
	import { settingsState } from "../settings.svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { getAttendance } from "./attendance.remote";

	const attendanceData = getAttendance();

	let attendancePercentThresholds = $derived(
		[settingsState.value.attendance_percent_min, settingsState.value.attendance_percent_max].map(
			(p) => p / 100
		) as [number, number]
	);
</script>

<svelte:head>
	<title>Attendance / Retlab</title>
</svelte:head>

{#if attendanceData.loading}
	<Box.Loading>Loading...</Box.Loading>
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
			<AttendanceCard {attendancePercentThresholds} {subject} />
		{/each}
	</div>
{:else}
	<Box.Error>
		<p>Something went wrong</p>
	</Box.Error>
{/if}
