<script lang="ts">
	import { cutePercent, pluralize, safeDivision } from "$lib";
	import { slide } from "svelte/transition";
	import type { getAttendance } from "./attendance.remote";
	import { titleCase } from "title-case";
	import { settingsState } from "../settings.svelte";

	let {
		subject,
		attendancePercentThresholds,
		attendanceMode
	}: {
		subject: NonNullable<ReturnType<typeof getAttendance>["current"]>[number];
		attendancePercentThresholds: [number, number];
		attendanceMode: "normal" | "duty_leave";
	} = $props();

	const subjectStats = $derived(subject[attendanceMode]);

	function percentStats(percent: number) {
		const y = percent * subjectStats.classes;
		return {
			cuttable: Math.floor((subjectStats.attended - y) / percent),
			needed: Math.ceil((y - subjectStats.attended) / (1 - percent))
		};
	}

	const percent = $derived(
		cutePercent(safeDivision(subjectStats.attended, subjectStats.classes) * 100, 1)
	);
	const [minStats, maxStats] = $derived(attendancePercentThresholds.map((p) => percentStats(p)));

	let open = $derived.by(() => {
		// todo: verify all these conditions
		switch (settingsState.value.expandAttendanceSubjects) {
			case "none":
				return false;
			case "all":
				return true;
			case "barely-safe":
				return minStats.cuttable <= 0 && maxStats.needed > 0;
			case "below-excellence":
				return maxStats.needed > 0;
			case "critical": // default!
			default:
				return minStats.needed > 0;
		}
	});
	let onActivated = () => (open = !open);
</script>

<div class="border-2 border-b-0 last:border-b-2">
	{#if open}
		<div transition:slide class="flex">
			<div
				data-percent={percent}
				data-type="bg"
				style="--percent: {percent}; height: 4px; width: {percent}%;"
				class="bottom-0 left-0 transition-all ease-out"
			></div>
			<div
				style="height: 4px; width: calc(100 - {percent})%;"
				class="bottom-0 left-0 bg-muted transition-all ease-out"
			></div>
		</div>
	{/if}

	<div
		class="flex space-x-2 px-3 py-2"
		role="button"
		tabindex="0"
		onclick={onActivated}
		onkeydown={onActivated}
	>
		<div class="space-y-0.5">
			<div class="text-sm font-bold text-muted-foreground">{subject.code}</div>
			<div class="line-clamp-2 w-full text-base font-medium text-wrap">
				{titleCase(subject.name.toLocaleLowerCase("en-IN") + " ").repeat(1)}
			</div>
		</div>
		<div class="flex flex-1 flex-col items-end">
			<div class="flex gap-1 font-serif text-2xl font-bold text-nowrap">
				{#if subjectStats.classes == 0}
					--
				{:else}
					{percent}
					<span class="text-lg">%</span>
				{/if}
			</div>
			<div class="text-nowrap">{subjectStats.attended} / {subjectStats.classes}</div>
		</div>
	</div>

	{#if open}
		<div transition:slide class="w-full bg-muted text-sm">
			<div class="border-t-2 border-dashed px-3 py-2">
				{#if subjectStats.classes <= 0}
					<span class="text-muted-foreground">No classes recorded yet.</span>
				{:else if minStats.needed > 0}
					<b class="text-red-600">Critical!</b>

					Attend at least <b>{minStats.needed}</b> more
					{pluralize(minStats.needed, "class", "classes")} to stay eligible.
				{:else if minStats.cuttable > 0}
					{#if maxStats.needed > 0}
						<span class="text-green-600">Safe.</span>

						You may skip <b>{minStats.cuttable}</b>
						{pluralize(minStats.cuttable, "class", "classes")}. Attend <b>{maxStats.needed}</b> more to
						reach excellent attendance.
					{:else if maxStats.cuttable > 0}
						<b class="text-emerald-600">Excellent!</b>

						You may skip <b>{minStats.cuttable}</b>
						{pluralize(minStats.cuttable, "class", "classes")}. You can skip up to
						<b>{maxStats.cuttable}</b> and still remain excellent.
					{:else}
						<b class="text-amber-600">Excellent (tight).</b>

						You may skip <b>{minStats.cuttable}</b>
						{pluralize(minStats.cuttable, "class", "classes")}, but no more.
					{/if}
				{:else if maxStats.needed > 0}
					<b class="text-amber-600">Barely safe.</b>

					Do not skip classes. Attend <b>{maxStats.needed}</b> more to reach excellent attendance.
				{:else}
					<b class="text-amber-600">At minimum limit.</b>
					Do not skip any classes.
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	[data-percent] {
		background-color: hsl(var(--percent) 100% 35%) !important;
	}
</style>
