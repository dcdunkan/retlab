<script lang="ts">
	import { isValidDate } from "$lib";
	import Box from "$lib/components/box";
	import Select from "$lib/components/select.svelte";
	import AssignmentCard from "../assignment-card.svelte";
	import { getAssignments } from "./assignments.remote";

	let { data } = $props();

	let chosenSemester = $derived(data.account.semester_id);
	const assignmentsData = $derived(getAssignments({ semester_id: chosenSemester }));
	const overview = $derived(
		assignmentsData.current
			? assignmentsData.current.reduce(
					(p, c) => {
						if (c._parsed.is_due) p.due++;
						else p.completed++;
						return p;
					},
					{ due: 0, completed: 0 }
				)
			: { due: "?", completed: "?" } // unused for now
	);

	type Assignment = NonNullable<typeof assignmentsData.current>[number];

	const yearMonthFormatter = new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "long"
	});

	// group by
	type GroupByOption = "issued-month" | "last-date-month" | "subject";
	type GroupByFn = (
		assignments: Assignment[]
	) => Record<string, { label: string; assignments: Assignment[] }>;

	const groupBySubject: GroupByFn = (assignments) =>
		assignments.reduce(
			(grouped, assignment) => {
				grouped[assignment.subject] ??= {
					label: assignment.subject,
					assignments: []
				};
				grouped[assignment.subject].assignments.push(assignment);
				return grouped;
			},
			{} as Record<string, { label: string; assignments: Assignment[] }>
		);
	const groupByMonth: GroupByFn = (assignments) =>
		assignments.reduce(
			(grouped, assignment) => {
				const issue_date = assignment._parsed.issue_date;
				const last_date = assignment._parsed.last_date;

				let groupKey: string;

				// bypass MySQL zero date bug hits
				if (isValidDate(issue_date)) {
					// no issues, just do it
					groupKey = `${issue_date.getFullYear()}-${issue_date.getMonth()}`;
					grouped[groupKey] ??= {
						label: yearMonthFormatter.format(issue_date),
						assignments: []
					};
				} else if (isValidDate(last_date)) {
					// last date is valid, calculate the archiveness
					if (last_date.getTime() > Date.now()) {
						groupKey = "dirty-ongoing";
						grouped[groupKey] ??= {
							label: "Ongoing stuff without issue dates",
							assignments: []
						};
					} else {
						groupKey = "dirty-archived";
						grouped[groupKey] ??= {
							label: "Archived assignments without issue dates",
							assignments: []
						};
					}
				} else {
					// literally no words, how messed up this could be if this ever gets executed?
					groupKey = "just-pure-dirty";
					grouped[groupKey] ??= { label: "No words", assignments: [] };
				}

				grouped[groupKey].assignments.push(assignment);

				return grouped;
			},
			{} as Record<
				"just-pure-dirty" | "dirty-ongoing" | "dirty-archived" | string,
				{ label: string; assignments: Assignment[] }
			>
		);
	const groupByLastDate: GroupByFn = (assignments) =>
		assignments.reduce(
			(grouped, assignment) => {
				const last_date = assignment._parsed.last_date;
				const issue_date = assignment._parsed.issue_date;

				let groupKey: string;

				// bypass MySQL zero date bug hits
				if (isValidDate(last_date)) {
					// no issues, just do it
					groupKey = `${last_date.getFullYear()}-${last_date.getMonth()}`;
					grouped[groupKey] ??= {
						label: yearMonthFormatter.format(last_date),
						assignments: []
					};
				} else if (isValidDate(issue_date)) {
					// last date is valid, calculate the archiveness
					if (issue_date.getTime() > Date.now()) {
						groupKey = "dirty-ongoing";
						grouped[groupKey] ??= {
							label: "Ongoing stuff without issue dates",
							assignments: []
						};
					} else {
						groupKey = "dirty-archived";
						grouped[groupKey] ??= {
							label: "Archived assignments without issue dates",
							assignments: []
						};
					}
				} else {
					// literally no words, how messed up this could be if this ever gets executed?
					groupKey = "just-pure-dirty";
					grouped[groupKey] ??= { label: "No words", assignments: [] };
				}

				grouped[groupKey].assignments.push(assignment);

				return grouped;
			},
			{} as Record<
				"just-pure-dirty" | "dirty-ongoing" | "dirty-archived" | string,
				{ label: string; assignments: Assignment[] }
			>
		);

	const groupByOptions: Record<GroupByOption, { label: string; fn: GroupByFn }> = {
		"issued-month": { label: "Issued Month", fn: groupByMonth },
		"last-date-month": { label: "Last Date Month", fn: groupByLastDate },
		subject: { label: "Subject", fn: groupBySubject }
	};

	let groupBy = $state<GroupByOption>("issued-month");

	// sort by
	type SortByOption = "last-date" | "issued-date" | "title";
	type SortByFn = (assignments: Assignment[]) => Assignment[];
	const sortByOptions: Record<SortByOption, { label: string; fn: SortByFn }> = {
		"last-date": { label: "Last Date", fn: (assignments) => assignments },
		"issued-date": { label: "Issued Date", fn: (assignments) => assignments },
		title: {
			label: "Title",
			fn: (assignments) =>
				assignments.toSorted((a, b) => a.title.localeCompare(b.title, "en-IN", { numeric: true }))
		}
	};
	let sortBy = $state<SortByOption>("issued-date");
</script>

<svelte:head>
	<title>Assignments / Retlab</title>
</svelte:head>

<!-- todo: extract this into fancy list select -->
<!-- <div class="no-scrollbar flex w-full place-items-end overflow-scroll">
	{#each data.semesters as semester, i (semester.id)}
		<button
			onclick={() => (chosenSemester = semester.id)}
			class={clsx(
				"border-y-2 px-3 text-sm text-nowrap",
				semester.id == chosenSemester
					? "clicked-button-shadow bg-blue-400 pt-1 pb-2"
					: "unclicked-button-shadow py-2 ",
				i > 0 && chosenSemester == data.semesters[i - 1].id
					? // if the previous one is the chosen one
						"border-l-2"
					: "",
				i + 1 < data.semesters.length && chosenSemester == data.semesters[i + 1].id
					? "border-r-2"
					: ""
			)}>{semester.name}</button
		>
	{/each}
</div> -->

<!-- <div class="bg-foreground px-3 py-1 font-serif font-bold text-background">
	Tricky tricky tricky!
</div> -->

<Select
	type="single"
	items={data.semesters.map((semester) => ({
		label: semester.name,
		value: semester.id.toString()
	}))}
	value={chosenSemester.toString()}
	onValueChange={(v) => (chosenSemester = Number.parseInt(v))}
>
	{#snippet trigger(label)}
		{label}
	{/snippet}
</Select>

<!-- <Dialog buttonText="click">
	{#snippet title()}
		Hello
	{/snippet}

	{#snippet description()}
		Description
	{/snippet}

	Some Content
</Dialog> -->

{#if assignmentsData.loading}
	<Box.Loading>Loading...</Box.Loading>
{:else if assignmentsData.current}
	<div class="py-2 font-serif text-5xl font-bold">
		{overview.due} due, {overview.completed} completed
	</div>

	<Select
		type="single"
		items={Object.entries(groupByOptions).map(([type, option]) => ({
			label: option.label,
			value: type
		}))}
		bind:value={groupBy}
		onValueChange={(v) => (groupBy = v as GroupByOption)}
	>
		{#snippet trigger(label)}
			{#if label}
				Group by {label}
			{:else}
				Group by
			{/if}
		{/snippet}
	</Select>

	<Select
		type="single"
		items={Object.entries(sortByOptions).map(([type, option]) => ({
			label: option.label,
			value: type
		}))}
		bind:value={sortBy}
		onValueChange={(v) => (sortBy = v as SortByOption)}
	>
		{#snippet trigger(label)}
			{#if label}
				Sort by {label}
			{:else}
				Sort by
			{/if}
		{/snippet}
	</Select>

	<div class="space-y-6">
		{#each Object.entries(groupByOptions[groupBy].fn(assignmentsData.current)) as [groupKey, assignmentGroup] (groupKey)}
			<div class="space-y-2">
				<div class="font-bold text-muted-foreground uppercase">{assignmentGroup.label}</div>
				<div class="grid grid-flow-row">
					{#each sortByOptions[sortBy].fn(assignmentGroup.assignments) as assignment (assignment.id)}
						<AssignmentCard {assignment} />
					{/each}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<Box.Error>
		<p>Something went wrong</p>
	</Box.Error>
{/if}

<!-- <div class="flex justify-center">
	<div class="text-enter font-serif font-normal text-muted-foreground italic">
		<p>
			The assignment results API doesn't allow user to switch semesters (option exists, but isn't
			working), and that's why results aren't shown here for semesters other than the current
			semester.
		</p>
	</div>
</div> -->

<!-- <style>
	.unclicked-button-shadow {
		box-shadow: inset 0px -4px 0 0 color-mix(in oklab, var(--color-black) 10%, transparent);
	}
	.clicked-button-shadow {
		box-shadow: inset 0px -2px 0 0 color-mix(in oklab, var(--color-black) 20%, transparent);
	}
</style> -->
