<script lang="ts" module>
	export type ParsedAssignmentStatus = "due" | "submitted" | "closed" | "graded";
	export type ParsedAssignmentWithResults = Awaited<
		ReturnType<typeof remotes.getAssignments>
	>[number] & {
		status: ParsedAssignmentStatus;
		_parsed_result?: {
			obtained_mark?: number;
			max_mark?: number;
		};
		result?: Awaited<ReturnType<typeof remotes.getAssignmentResults>>[number];
	};
</script>

<script lang="ts">
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";

	import { isValidDate } from "$lib";
	import Box from "$lib/components/box";
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Select from "$lib/components/select.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import AssignmentCard from "../assignment-card.svelte";
	import { cachedGracefulRemoteQuery } from "../states.svelte";
	import * as remotes from "./assignments.remote";
	import { slide } from "svelte/transition";
	import Timestamp from "$lib/components/timestamp.svelte";
	import box from "$lib/components/box";

	let { data } = $props();

	function num(x: string) {
		const parsed = Number.parseFloat(x);
		if (Number.isNaN(parsed)) return undefined;
		return parsed;
	}

	let chosenSemester = $derived(data.sessionUser.account.semesterId);

	const assignmentsData = cachedGracefulRemoteQuery(
		{ name: "getAssignments", version: 1 },
		remotes.getAssignments
	);
	const assignmentResultsData = cachedGracefulRemoteQuery(
		{ name: "getAssignmentResults", version: 1 },
		remotes.getAssignmentResults
	);

	onMount(async () => {
		await Promise.all([
			assignmentsData.load(data.sessionUser, { semester_id: chosenSemester }),
			assignmentResultsData.load(data.sessionUser, { semester_id: chosenSemester })
		]);
	});

	function getAssignmentStatus(
		a: Omit<ParsedAssignmentWithResults, "status">
	): ParsedAssignmentStatus {
		if (a._parsed_result?.obtained_mark !== undefined) return "graded";
		if (a._parsed.is_due) return "due";
		return a._parsed.has_uploaded ? "submitted" : "closed"; // closed = no online submission, may be offline
	}

	const assignments = $derived.by<ParsedAssignmentWithResults[] | undefined>(() => {
		return assignmentsData.data != null
			? assignmentsData.data.map((ass) => {
					const result =
						assignmentResultsData.data != null
							? assignmentResultsData.data.find(
									(result) => result.subject === ass.subject && result.name === ass.title
								)
							: undefined;

					if (result == null) {
						const assignment = { ...ass, result: undefined, _parsed_result: undefined };
						return { ...assignment, status: getAssignmentStatus(assignment) };
					}

					const obtainedMark = num(result.obtained_mark),
						maxMark = num(result.max_mark);

					if (obtainedMark == null && maxMark == null) {
						const assignment = {
							...ass,
							result: result,
							_parsed_result: undefined
						};
						return { ...assignment, status: getAssignmentStatus(assignment) };
					}

					const assignment = {
						...ass,
						result: result,
						_parsed_result: {
							obtained_mark: obtainedMark,
							max_mark: maxMark
						}
					};
					return { ...assignment, status: getAssignmentStatus(assignment) };
				})
			: undefined;
	});

	const overview = $derived(
		assignments?.reduce((p, c) => (p[c.status]++, p), {
			due: 0,
			closed: 0,
			submitted: 0,
			graded: 0
		}) ?? null
	);

	const yearMonthFormatter = new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "long"
	});

	// group by
	type GroupByOption = "issued-month" | "last-date-month" | "subject";
	type GroupByFn = (
		assignments: ParsedAssignmentWithResults[]
	) => Record<string, { label: string; assignments: ParsedAssignmentWithResults[] }>;

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
			{} as Record<string, { label: string; assignments: ParsedAssignmentWithResults[] }>
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
				{ label: string; assignments: ParsedAssignmentWithResults[] }
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
				{ label: string; assignments: ParsedAssignmentWithResults[] }
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
	type SortByFn = (assignments: ParsedAssignmentWithResults[]) => ParsedAssignmentWithResults[];
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

	let filterByStatus = $state<Record<ParsedAssignmentStatus, boolean>>({
		closed: true,
		due: true,
		graded: true,
		submitted: true
	});

	let showResults = $state(true);

	async function switchSemester(semesterId: number) {
		chosenSemester = semesterId;
		await Promise.allSettled([
			assignmentsData.load(data.sessionUser, { semester_id: chosenSemester }),
			assignmentResultsData.load(data.sessionUser, { semester_id: chosenSemester })
		]);
	}
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
					? "clicked-button-shadow bg-ret-accent pt-1 pb-2"
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

<div class="flex w-full place-items-center gap-2">
	<Select
		type="single"
		items={data.semesters.map((semester) => ({
			label: semester.name,
			value: semester.id.toString()
		}))}
		value={chosenSemester.toString()}
		onValueChange={(v) => switchSemester(Number.parseInt(v))}
		class="min-w-0 flex-1 justify-between"
	/>
	<Button
		class="shrink-0"
		variant="outline"
		size="icon"
		disabled={chosenSemester === data.sessionUser.account.semesterId}
		onclick={() => switchSemester(data.sessionUser.account.semesterId)}
	>
		<ArrowUUpLeftIcon />
	</Button>
</div>

{#if assignmentsData.loading}
	<Box.Loading>Loading...</Box.Loading>
{:else if assignmentsData.data && assignments}
	<div class="space-y-2 py-2">
		{#if overview}
			<h1 class="font-serif text-5xl font-bold">
				<button
					class="transition-all duration-150"
					onclick={() => (filterByStatus.due = !filterByStatus.due)}
					class:text-muted-foreground={!filterByStatus.due}>{overview.due} due</button
				>{#if overview.closed}, <button
						class="transition-all duration-150"
						onclick={() => (filterByStatus.closed = !filterByStatus.closed)}
						class:text-muted-foreground={!filterByStatus.closed}
					>
						{overview.closed} closed
					</button>
				{/if}
			</h1>
			<p class="font-medium">
				<button
					class="transition-all duration-150"
					onclick={() => (filterByStatus.submitted = !filterByStatus.submitted)}
					class:text-muted-foreground={!filterByStatus.submitted}
					>{overview.submitted} awaiting grade</button
				>,
				<button
					class="transition-all duration-150"
					onclick={() => (filterByStatus.graded = !filterByStatus.graded)}
					class:text-muted-foreground={!filterByStatus.graded}>{overview.graded} graded</button
				>
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		<Button variant="outline" size="sm" onclick={() => (showResults = !showResults)}>
			<!-- disabled={data.sessionUser.account.semesterId !== chosenSemester} -->
			Hide scores
			{#if showResults}
				<XIcon weight="bold" />
			{:else}
				<CheckIcon weight="bold" />
			{/if}
		</Button>

		<Select
			type="single"
			items={Object.entries(groupByOptions).map(([type, option]) => ({
				label: option.label,
				value: type
			}))}
			bind:value={groupBy}
			onValueChange={(v) => (groupBy = v as GroupByOption)}
			class={buttonVariants({ variant: "outline", size: "sm" })}
		>
			{#snippet single({ placeholder, selected })}
				{#if selected != null}
					<b>Group by</b> {selected.label}
				{:else}
					{placeholder}
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
			class={buttonVariants({ variant: "outline", size: "sm" })}
		>
			{#snippet single({ placeholder, selected })}
				{#if selected != null}
					<b>Sort by</b> {selected.label}
				{:else}
					{placeholder}
				{/if}
			{/snippet}
		</Select>
	</div>

	{#if showResults && data.sessionUser.account.semesterId !== chosenSemester}
		<div transition:slide>
			<Box.Warning>
				Results can only be fetched correctly for the current semester as there is a bug on Etlab's
				side. Still not fixed even after reported since
				<Timestamp timestamp={new Date("Dec 29, 2025, 12:00 PM")} />.
			</Box.Warning>
		</div>
	{/if}

	<div class="space-y-6">
		{#each Object.entries(groupByOptions[groupBy].fn(assignments)) as [groupKey, assignmentGroup] (groupKey)}
			<div class="space-y-2">
				<div class="font-bold text-muted-foreground uppercase">{assignmentGroup.label}</div>
				<div class="grid grid-flow-row">
					{#each sortByOptions[sortBy]
						.fn(assignmentGroup.assignments)
						.filter((a) => filterByStatus[a.status]) as assignment (assignment.id)}
						<AssignmentCard {assignment} showResult={showResults} />
					{:else}
						<box.Empty class="text-xs">
							There were some assignments here, but they are hidden because of the applied filters.
						</box.Empty>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<Box.Error>
		{isHttpError(assignmentsData.error)
			? assignmentsData.error.body.message
			: "Something went wrong"}
	</Box.Error>
{/if}

<p class="text-left text-sm font-normal text-muted-foreground">
	Click on a card for more information & actions. You can also filter assignments by clicking on the
	overview stats shown at the top. What all those mean? <b>Due</b> = Not past late date & not yet
	submitted, <b>closed</b> = past last date & not submitted (maybe offline submissions),
	<b>awaiting grade</b> = submitted & not yet graded, and <b>graded</b> = graded!!
</p>

<!-- <style>
	.unclicked-button-shadow {
		box-shadow: inset 0px -4px 0 0 color-mix(in oklab, var(--color-black) 10%, transparent);
	}
	.clicked-button-shadow {
		box-shadow: inset 0px -2px 0 0 color-mix(in oklab, var(--color-black) 20%, transparent);
	}
</style> -->
