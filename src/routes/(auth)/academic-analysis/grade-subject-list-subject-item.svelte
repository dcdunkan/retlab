<script lang="ts">
	import { cutePercent, safeDivision } from "$lib";
	import Button from "$lib/components/button.svelte";
	import type { Weblab } from "$lib/server/weblab-parsers/types";
	import { slide } from "svelte/transition";

	let { subject }: { subject: Weblab.AcademicAnalysis.SemesterSubject } = $props();

	let expanded = $state(false);
</script>

<div>
	<Button
		variant="ghost"
		size="min"
		shadow="none"
		class="w-full flex-col items-start gap-0.5 px-2.5 py-1.5 text-left whitespace-normal"
		onclick={() => (expanded = !expanded)}
	>
		<div class="line-clamp-1 font-semibold">{subject.name}</div>
		<div class="text-xs">
			<span class="font-medium">
				{cutePercent(safeDivision(subject.attendance.attended, subject.attendance.classes) * 100)} %
			</span>
			({subject.attendance.attended}/{subject.attendance.classes}) attendance,
			{subject.internalMarks} in internals.
		</div>
	</Button>
	{#if expanded}
		<div transition:slide>
			<div class="border-t-2 border-dashed border-border text-xs">
				{#if subject.seriesExams.length === 0}
					<div class="bg-muted px-2.5 py-1.5 text-muted-foreground">
						No series examinations were recorded for this subject.
					</div>
				{:else}
					<div class="space-y-1 bg-muted px-2.5 py-1.5">
						{#each subject.seriesExams as seriesExam (`${subject.name}-${seriesExam.slNo}`)}
							<div class="grid grid-cols-3">
								<div>{seriesExam.name}</div>
								<div>{seriesExam.marks.obtained} / {seriesExam.marks.max}</div>
								<div>
									<span
										class={seriesExam.classRank === 1
											? "font-bold text-ret-excellent-foreground"
											: ""}
									>
										#{seriesExam.classRank}
									</span> in class
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
