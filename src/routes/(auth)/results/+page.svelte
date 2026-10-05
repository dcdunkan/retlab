<script lang="ts">
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";

	import box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Select from "$lib/components/select.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { cachedGracefulRemoteQuery } from "../states.svelte";
	import * as remotes from "./results.remote";

	let { data } = $props();

	const sessionalResultsData = cachedGracefulRemoteQuery(
		{ name: "sessional-results", version: 1 },
		remotes.getSessionalResults
	);
	const internalResultsData = cachedGracefulRemoteQuery(
		{ name: "internal-results", version: 1 },
		remotes.getInternalResults
	);
	const moduleTestResultsData = cachedGracefulRemoteQuery(
		{ name: "moduletest-results", version: 1 },
		remotes.getModuleTestResults
	);

	let selectedSemester = $derived(data.sessionUser.account.semesterId);
	let selectedSession = $state(1);

	onMount(async () => {
		await Promise.all([
			sessionalResultsData.load(data.sessionUser, {
				semester_id: selectedSemester,
				session: selectedSession
			}),
			internalResultsData.load(data.sessionUser, { semester_id: selectedSemester }),
			moduleTestResultsData.load(data.sessionUser, { semester_id: selectedSemester })
		]);
	});

	async function switchSemester(semesterId: number) {
		selectedSemester = semesterId;
		await Promise.allSettled([
			sessionalResultsData.load(data.sessionUser, {
				semester_id: selectedSemester,
				session: selectedSession
			}),
			internalResultsData.load(data.sessionUser, { semester_id: selectedSemester }),
			moduleTestResultsData.load(data.sessionUser, { semester_id: selectedSemester })
		]);
	}

	async function switchSession(sessionNo: number) {
		selectedSession = sessionNo;
		await sessionalResultsData.load(data.sessionUser, {
			semester_id: selectedSemester,
			session: selectedSession
		});
	}
</script>

<svelte:head>
	<title>Results / Retlab</title>
</svelte:head>

<h1 class="text-5xl">Results</h1>

<div class="flex w-full place-items-center gap-2">
	<Select
		type="single"
		items={data.semesters.map((semester) => ({
			label: semester.name,
			value: semester.id.toString()
		}))}
		value={selectedSemester.toString()}
		onValueChange={(v) => switchSemester(Number.parseInt(v))}
		class="min-w-0 flex-1 justify-between"
	/>
	<Button
		class="shrink-0"
		variant="outline"
		size="icon"
		disabled={selectedSemester === data.sessionUser.account.semesterId}
		onclick={() => switchSemester(data.sessionUser.account.semesterId)}
	>
		<ArrowUUpLeftIcon weight="bold" />
	</Button>
</div>

<div class="space-y-4">
	<div class="flex gap-2">
		<h2 class="grow text-3xl">Sessional</h2>
		<Select
			type="single"
			items={Array.from({ length: 8 }).map((_, i) => ({
				label: `Session ${i + 1}`,
				value: (i + 1).toString()
			}))}
			value={selectedSession.toString()}
			onValueChange={(v) => switchSession(Number.parseInt(v))}
		/>
	</div>

	{#if sessionalResultsData.loading}
		<box.Loading>Fetching sessional results...</box.Loading>
	{:else if sessionalResultsData.data != null}
		{#if sessionalResultsData.data.length === 0}
			<box.Empty>No results found for this session!</box.Empty>
		{:else}
			<div class="divide-y-2 divide-border border-2 border-border">
				{#each sessionalResultsData.data as result (result.subject)}
					<div class="flex place-items-center justify-between gap-4 px-3 py-2">
						<div>
							<div class="text-sm font-medium text-muted-foreground">
								{result._parsed.subject.code}
							</div>
							<div class="font-medium capitalize">{result._parsed.subject.name}</div>
						</div>
						<div class="shrink-0 font-serif text-3xl font-bold">
							{#if result._parsed.obtainedMark == null || result._parsed.maxMark == null}
								<span class="text-muted-foreground">{result.obtained_mark}</span>
							{:else}
								{result._parsed.obtainedMark}
								<span class="text-lg">/ {result._parsed.maxMark}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if sessionalResultsData.error}
		<box.Error>
			{#if isHttpError(sessionalResultsData.error)}
				{sessionalResultsData.error.body.message}
			{:else}
				Something went wrong!
			{/if}
		</box.Error>
	{:else}
		<box.Error>Something went wrong!</box.Error>
	{/if}
</div>

<div class="space-y-4">
	<div class="flex gap-2">
		<h2 class="grow text-3xl">Internals</h2>
	</div>

	{#if internalResultsData.loading}
		<box.Loading>Fetching internal results...</box.Loading>
	{:else if internalResultsData.data != null}
		{#if internalResultsData.data.length === 0}
			<box.Empty>No results found for this semester!</box.Empty>
		{:else}
			<div class="divide-y-2 divide-border border-2 border-border">
				{#each internalResultsData.data as result (result.subject)}
					<div class="flex place-items-center justify-between gap-4 px-3 py-2">
						<div>
							<div class="text-sm font-medium text-muted-foreground">
								{result._parsed.subject.code}
							</div>
							<div class="font-medium capitalize">{result._parsed.subject.name}</div>
						</div>
						<div class="shrink-0 font-serif text-3xl font-bold">
							{#if result._parsed.obtainedMark == null || result._parsed.maxMark == null}
								<span class="text-muted-foreground">{result.obtained_mark}</span>
							{:else}
								{result._parsed.obtainedMark}
								<span class="text-lg">/ {result._parsed.maxMark}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if internalResultsData.error}
		<box.Error>
			{#if isHttpError(internalResultsData.error)}
				{internalResultsData.error.body.message}
			{:else}
				Something went wrong!
			{/if}
		</box.Error>
	{:else}
		<box.Error>Something went wrong!</box.Error>
	{/if}
</div>

<div class="space-y-4">
	<div class="flex gap-2">
		<h2 class="grow text-3xl">Module tests</h2>
	</div>

	{#if moduleTestResultsData.loading}
		<box.Loading>Fetching module test results...</box.Loading>
	{:else if moduleTestResultsData.data != null}
		{#if moduleTestResultsData.data.length === 0}
			<box.Empty>No results found for this semester!</box.Empty>
		{:else}
			<div class="divide-y-2 divide-border border-2 border-border">
				{#each moduleTestResultsData.data as result (result.subject)}
					<div class="flex place-items-center justify-between gap-4 px-3 py-2">
						<div>
							<div class="text-sm font-medium text-muted-foreground">
								{result._parsed.subject.code}
								{#if result.name}
									&middot; Exam {result.name}
								{/if}
							</div>
							<div class="font-medium capitalize">{result._parsed.subject.name}</div>
						</div>
						<div class="shrink-0 font-serif text-3xl font-bold">
							{#if result._parsed.mark.obtained == null || result._parsed.mark.obtained == null}
								<span class="text-muted-foreground">{result.mark}</span>
							{:else}
								{result._parsed.mark.obtained}
								<span class="text-lg">/ {result._parsed.mark.total}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if moduleTestResultsData.error}
		<box.Error>
			{#if isHttpError(moduleTestResultsData.error)}
				{moduleTestResultsData.error.body.message}
			{:else}
				Something went wrong!
			{/if}
		</box.Error>
	{:else}
		<box.Error>Something went wrong!</box.Error>
	{/if}
</div>

<p class="text-sm text-muted-foreground">
	This is a relatively boring page. Nothing to do here. This page may become interesting someday.
</p>
