<script lang="ts">
	import type { Weblab } from "$lib/server/weblab-parsers/types";
	import {
		type ChartState,
		defaultChartPadding,
		LineChart,
		PieChart,
		Text,
		Tooltip
	} from "layerchart";
	import GradeSubjectsListDialog from "./grade-subjects-list-dialog.svelte";
	import { cutePercent, safeDivision } from "$lib";
	import { cn } from "$lib/cn-utils";

	let {
		academicAnalysis
	}: {
		academicAnalysis: Weblab.AcademicAnalysis.Semester[];
	} = $props();

	const GRADES = ["S", "A+", "A", "B+", "B", "C+", "C", "D", "P"];
	const GRADE_COLORS = Object.fromEntries(
		GRADES.map((grade, i) => {
			return [
				grade,
				i === 8
					? "var(--color-ret-accent)"
					: `color-mix(in srgb, var(--color-ret-accent) ${25 + i * 9.375}%, white)`
			];
		})
	);

	type GradeEntry = { semester: string; cgpa: number; sgpa: number };
	function getGradeStats(semesters: Weblab.AcademicAnalysis.Semester[]) {
		const gradeCount: Record<string, number> = {};
		let minGradeCount = 10,
			maxGradeCount = 0; /// todo: true for all colleges? no right?

		let minCgpa = 10,
			maxCgpa = 0,
			minSgpa = 10,
			maxSgpa = 0;

		let minTotalAttendance = 100,
			maxTotalAttendance = 0;

		for (const semester of semesters) {
			if (semester.cgpa < minCgpa) minCgpa = semester.cgpa;
			if (semester.sgpa < minSgpa) minSgpa = semester.sgpa;
			if (semester.cgpa > maxCgpa) maxCgpa = semester.cgpa;
			if (semester.sgpa > maxSgpa) maxSgpa = semester.sgpa;

			const attendancePercent = cutePercent(
				safeDivision(semester.totalAttendance.attended, semester.totalAttendance.classes) * 100
			);
			if (minTotalAttendance > attendancePercent) minTotalAttendance = attendancePercent;
			if (maxTotalAttendance < attendancePercent) maxTotalAttendance = attendancePercent;

			for (const subject of semester.subjects) {
				const newCount = (gradeCount[subject.grade] ?? 0) + 1;
				if (newCount < minGradeCount) {
					minGradeCount = newCount;
				}
				if (newCount > maxGradeCount) {
					maxGradeCount = newCount;
				}
				gradeCount[subject.grade] = newCount;
			}
		}

		const minGrades: string[] = [],
			maxGrades: string[] = [];

		for (const grade in gradeCount) {
			if (gradeCount[grade] == maxGradeCount) maxGrades.push(grade);
			else if (gradeCount[grade] == minGradeCount) minGrades.push(grade); // not needed if min == max
		}

		return {
			gradeCount,
			minGradeCount,
			minGrades,
			maxGradeCount,
			maxGrades,
			minSgpa,
			minCgpa,
			maxSgpa,
			maxCgpa,
			minTotalAttendance,
			maxTotalAttendance
		};
	}
	let showGradeSubjectList = $state(false);
	let selectedGrade = $state<string>();
	let selectedGradeSubjects = $state<Weblab.AcademicAnalysis.Semester[]>([]);

	let gradeStats = $derived(getGradeStats(academicAnalysis));

	let perfChartContext = $state<ChartState>();
	let perfChartTooltipData = $derived<GradeEntry>(perfChartContext?.tooltip?.data);

	type AttendanceEntry = {
		semester: string;
		totalAttendance: { attended: number; classes: number };
		percentage: number;
	};
	let attendanceChartContext = $state<ChartState>();
	let attendanceChartTooltipData = $derived<AttendanceEntry>(attendanceChartContext?.tooltip?.data);
</script>

<h2 class="text-2xl">Performance through out previous semesters</h2>

<div class="space-y-2">
	<h2 class="text-xl">CGPA & SGPA</h2>

	<div class="divide-y-2 divide-border border-2 border-border shadow-block-shadow">
		<div
			class={cn(
				"px-2.5 py-1.5 text-sm",
				perfChartTooltipData != null
					? ""
					: "bg-muted text-muted-foreground transition-all duration-150"
			)}
		>
			<div class="text-base font-bold tracking-tight">
				{#if perfChartTooltipData != null}
					{perfChartTooltipData.semester}
				{:else}
					Click or hover on a point to show details.
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="flex place-items-center gap-2 text-sm">
					<div class="size-3 shrink-0 bg-ret-favourite"></div>
					<div class="grow font-medium">SGPA</div>
					<div class="font-mono">
						{perfChartTooltipData != null ? perfChartTooltipData.sgpa.toFixed(2) : "?"}
					</div>
				</div>
				<div class="flex place-items-center gap-2 text-sm">
					<div class="size-3 shrink-0 bg-ret-accent"></div>
					<div class="grow font-medium">CGPA</div>
					<div class="font-mono">
						{perfChartTooltipData != null ? perfChartTooltipData.cgpa.toFixed(2) : "?"}
					</div>
				</div>
			</div>
		</div>

		<LineChart
			bind:context={perfChartContext}
			data={academicAnalysis.map(({ semester, sgpa, cgpa }) => ({
				semester,
				sgpa,
				cgpa
			}))}
			series={[
				{
					key: "sgpa",
					label: "SGPA",
					color: "var(--color-ret-favourite)"
				},
				{
					key: "cgpa",
					label: "CGPA",
					color: "var(--color-ret-accent)"
				}
			]}
			x="semester"
			yDomain={[
				Math.max(0, Math.min(gradeStats.minCgpa, gradeStats.minSgpa) - 1),
				Math.min(10, Math.max(gradeStats.maxCgpa, gradeStats.maxSgpa) + 1)
			]}
			yNice
			y={["sgpa", "cgpa"]}
			height={300}
			points
			padding={defaultChartPadding({ top: 20, right: 20, bottom: 40, left: 35 })}
			props={{
				xAxis: {
					format: (val) =>
						val.toLowerCase().endsWith("semester")
							? val.slice(0, -"semester".length).trim() + "\n" + "Semester"
							: val.trim(),
					classes: { tickLabel: "font-normal" }
				},
				yAxis: {
					classes: { tickLabel: "font-normal" }
				}
			}}
		>
			{#snippet tooltip({ context })}
				<Tooltip.Root
					x="data"
					y="pointer"
					yOffset={48}
					anchor="bottom"
					variant="none"
					class="min-w-40 border-2 border-border bg-background shadow-block-shadow"
				>
					{#snippet children({ data }: { data: GradeEntry })}
						<div class="border-b-2 border-border px-2.5 py-1.5">
							<p class="text-xs font-medium text-muted-foreground">Semester</p>
							<p class="text-sm font-bold tracking-tight">{data.semester}</p>
						</div>

						<div class="px-2.5 py-2.5">
							<div
								class={cn(
									"flex place-items-center gap-2 text-sm",
									context.series.highlightKey == null
										? ""
										: context.series.highlightKey === "sgpa"
											? "font-bold"
											: "opacity-40"
								)}
							>
								<div class="size-3 shrink-0 bg-ret-favourite"></div>
								<div class="grow">SGPA</div>
								<div class="font-mono">{data.sgpa.toFixed(2)}</div>
							</div>
							<div
								class={cn(
									"flex place-items-center gap-2 text-sm",
									context.series.highlightKey == null
										? ""
										: context.series.highlightKey === "cgpa"
											? "font-bold"
											: "opacity-40"
								)}
							>
								<div class="size-3 shrink-0 bg-ret-accent"></div>
								<div class="grow">CGPA</div>
								<div class="font-mono">{data.cgpa.toFixed(2)}</div>
							</div>
						</div>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</LineChart>
	</div>
</div>

<div class="space-y-2">
	<h2 class="text-xl">Grades you got</h2>

	<PieChart
		class="border-2 border-border shadow-block-shadow"
		key="grade"
		value="count"
		data={Object.entries(gradeStats.gradeCount).map(([key, value]) => ({
			grade: key,
			count: value,
			color: GRADE_COLORS[key] ?? "var(--color-ret-favourite)"
		}))}
		height={275}
		c="color"
		innerRadius={80}
		padAngle={0.02}
		padding={defaultChartPadding({ top: 40, bottom: 40 })}
		labels={{
			placement: "callout",
			value: (data: { grade: string; count: number; color: string }) => `${data.grade}`,
			offset: 0
		}}
		onArcClick={(_e, detail: { data: { grade: string; count: number; color: string } }) => {
			if (academicAnalysis == null) return;
			showGradeSubjectList = true;
			selectedGrade = detail.data.grade;
			selectedGradeSubjects = academicAnalysis
				.map((semester) => {
					return {
						...semester,
						subjects: semester.subjects.filter((subject) => subject.grade === detail.data.grade)
					};
				})
				.filter((semester) => semester.subjects.length > 0);
		}}
	>
		{#snippet aboveMarks()}
			<Text
				value={gradeStats.maxGrades.length === 1
					? gradeStats.maxGrades[0]
					: `${gradeStats.maxGrades.slice(0, -1).join(", ")} & ${gradeStats.maxGrades.at(-1)}`}
				textAnchor="middle"
				verticalAnchor="middle"
				class="text-3xl"
			/>
			<Text
				value="Most *collected*"
				textAnchor="middle"
				verticalAnchor="middle"
				class="fill-surface-content/50 text-sm"
				dy={26}
			/>
		{/snippet}

		{#snippet tooltip()}
			<Tooltip.Root
				y="pointer"
				yOffset={48}
				anchor="bottom"
				variant="none"
				class="min-w-40 border-2 border-border bg-background shadow-block-shadow"
			>
				{#snippet children({ data }: { data: { grade: string; count: number; color: string } })}
					<div class="border-b-2 border-border px-2.5 py-1.5">
						<div class="flex place-items-center gap-2 text-sm">
							<div class="size-3 shrink-0" style:background-color={data.color}></div>
							<div class="grow">{data.grade}</div>
							<div class="font-mono">{data.count}</div>
						</div>
					</div>
				{/snippet}
			</Tooltip.Root>
		{/snippet}
	</PieChart>

	<p class="mt-4 text-xs text-muted-foreground">
		Click on a grade arc to see the list of subjects.
	</p>
</div>

{#if selectedGrade != null}
	<GradeSubjectsListDialog
		bind:open={showGradeSubjectList}
		grade={selectedGrade}
		gradeCount={gradeStats.gradeCount[selectedGrade]}
		semesters={selectedGradeSubjects}
	/>
{/if}

<div class="space-y-2">
	<h2 class="text-xl">Attendance</h2>

	<div class="divide-y-2 divide-border border-2 border-border shadow-block-shadow">
		<div
			class={cn(
				"px-2.5 py-1.5 text-sm",
				attendanceChartTooltipData != null
					? ""
					: "bg-muted text-muted-foreground transition-all duration-150"
			)}
		>
			<div class="text-base font-bold tracking-tight">
				{#if attendanceChartTooltipData != null}
					{attendanceChartTooltipData.semester} ({attendanceChartTooltipData.percentage} &percnt;)
				{:else}
					Click or hover on a point to show details.
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-x-6">
				<div class="flex place-items-center justify-between gap-2">
					<div class="font-medium">Total classes</div>
					<div class="font-mono">
						{attendanceChartTooltipData != null
							? attendanceChartTooltipData.totalAttendance.classes
							: "?"}
					</div>
				</div>
				<div class="flex place-items-center justify-between gap-2">
					<div class="font-medium">Classes attended</div>
					<div class="font-mono">
						{attendanceChartTooltipData != null
							? attendanceChartTooltipData.totalAttendance.attended
							: "?"}
					</div>
				</div>
				<div class="flex place-items-center justify-between gap-2">
					<div class="font-medium">Classes missed</div>
					<div class="font-mono">
						{attendanceChartTooltipData != null
							? attendanceChartTooltipData.totalAttendance.classes -
								attendanceChartTooltipData.totalAttendance.attended
							: "?"}
					</div>
				</div>
			</div>
		</div>

		<LineChart
			bind:context={attendanceChartContext}
			data={academicAnalysis.map(({ semester, totalAttendance }) => ({
				semester,
				totalAttendance,
				percentage: cutePercent(
					safeDivision(totalAttendance.attended, totalAttendance.classes) * 100
				)
			}))}
			series={[
				{
					key: "percentage",
					label: "Percentage",
					color: "var(--color-ret-accent)"
				}
			]}
			x="semester"
			yNice
			y="percentage"
			yDomain={[
				Math.max(0, gradeStats.minTotalAttendance - 10),
				Math.min(100, gradeStats.maxTotalAttendance + 10)
			]}
			points
			height={300}
			padding={defaultChartPadding({ top: 20, right: 20, bottom: 40, left: 35 })}
			props={{
				xAxis: {
					format: (val) =>
						val.toLowerCase().endsWith("semester")
							? val.slice(0, -"semester".length).trim() + "\n" + "Semester"
							: val.trim(),
					classes: { tickLabel: "font-normal" }
				},
				yAxis: {
					classes: { tickLabel: "font-normal" }
				}
			}}
		>
			{#snippet tooltip()}
				<Tooltip.Root
					x="data"
					y="pointer"
					yOffset={48}
					anchor="bottom"
					variant="none"
					class="min-w-40 border-2 border-border bg-background shadow-block-shadow"
				>
					{#snippet children({ data }: { data: AttendanceEntry })}
						<div class="px-2.5 py-1.5">
							<p class="text-xs font-medium text-muted-foreground">Semester</p>
							<p class="text-sm font-bold tracking-tight">{data.semester}</p>
							<div class="mt-2 grid w-full grid-cols-2 gap-x-2 text-sm">
								<div class="font-medium">Percentage</div>
								<div class="text-right font-mono">{data.percentage.toFixed(2)} %</div>

								<div class="font-medium">Classes taken</div>
								<div class="text-right font-mono">{data.totalAttendance.classes}</div>

								<div class="font-medium">Attended</div>
								<div class="text-right font-mono">{data.totalAttendance.attended}</div>

								<div class="font-medium">Classes missed</div>
								<div class="text-right font-mono">
									{data.totalAttendance.classes - data.totalAttendance.attended}
								</div>
							</div>
						</div>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</LineChart>
	</div>
</div>
