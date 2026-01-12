<script lang="ts">
	import { cutePercent, safeDivision } from "$lib";
	import Box from "$lib/components/box";
	import type { PageProps } from "./$types";
	import AttendanceCard from "./attendance-card.svelte";
	import { getAttendance } from "./attendance.remote";

	let { data }: PageProps = $props();

	const attendanceData = getAttendance();

	let attendancePercentThresholds = $derived<[number, number]>(
		(data.account.settings != null
			? [data.account.settings.attendance_percent_min, data.account.settings.attendance_percent_max]
			: [75, 90]
		).map((p) => p / 100) as [number, number]
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
