<script lang="ts">
	import { cutePercent, safeDivision } from "$lib";
	import Box from "$lib/components/box";
	import { settingsState } from "../settings.svelte";
	import AttendanceCard from "./attendance-card.svelte";
	import { getAttendance } from "./attendance.remote";

	const attendanceData = getAttendance();

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
{:else if attendanceData.current}
	{@const total = attendanceData.current.reduce(
		(p, c) => ({
			attended: p.attended + c[attendanceMode].attended,
			classes: p.classes + c[attendanceMode].classes
		}),
		{ attended: 0, classes: 0 }
	)}
	{@const totalPercent = cutePercent(safeDivision(total.attended, total.classes) * 100, 0)}

	<div class="flex place-items-end justify-between sm:flex-col">
		<h1 class="text-5xl font-bold">{totalPercent} %</h1>

		<button
			class="flex h-fit w-fit place-items-center gap-1 rounded-xs border border-mauve-600 bg-mauve-500 px-1 py-0 text-sm text-mauve-50 shadow-inner"
			onclick={() => (attendanceMode = attendanceMode === "duty_leave" ? "normal" : "duty_leave")}
		>
			<b>duty leave mode:</b>
			{attendanceMode === "duty_leave" ? "on" : "off"}
		</button>
	</div>

	<div class="grid grid-flow-row">
		{#each attendanceData.current as subject, i (i)}
			<AttendanceCard {attendancePercentThresholds} {subject} {attendanceMode} />
		{/each}
	</div>

	<!-- <section class="w-full">
		<GearIcon weight="fill" size="1.5em" />
		<div class="flex place-items-center gap-2">
			<Checkbox id="duty-leave-mode" name="show-duty-leave-values" />
			<label for="duty-leave-mode">Show duty leave values</label>
		</div>
	</section> -->
{:else}
	<Box.Error>
		<p>Something went wrong</p>
	</Box.Error>
{/if}

<div class="min-h-[50svh]"></div>
