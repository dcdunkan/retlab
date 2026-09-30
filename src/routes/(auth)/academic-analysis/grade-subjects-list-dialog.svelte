<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import type { Weblab } from "$lib/server/weblab-parsers/types";
	import GradeSubjectListSubjectItem from "./grade-subject-list-subject-item.svelte";

	let {
		open = $bindable(true),
		grade,
		gradeCount,
		semesters = []
	}: {
		open?: boolean;
		grade: string;
		gradeCount: number;
		semesters: Weblab.AcademicAnalysis.Semester[];
	} = $props();
</script>

<Dialog bind:open showCloseIcon interactOutsideBehavior="close" enableBorders={false}>
	{#snippet title()}
		{grade} grade
	{/snippet}

	{#snippet description()}
		You got {grade} grade in {gradeCount} subjects.
	{/snippet}

	<div class="space-y-4 border-border">
		{#each semesters as semester (semester.semester)}
			<div class="space-y-2">
				<div class="text-sm font-medium">{semester.semester}</div>
				<div class="divide-y-2 divide-border border-2 border-border">
					{#each semester.subjects as subject (`${semester.semester}-${subject.name}`)}
						<GradeSubjectListSubjectItem {subject} />
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#snippet footer()}
		<Button variant="outline" onclick={() => (open = false)}>Okay, close now</Button>
	{/snippet}
</Dialog>
