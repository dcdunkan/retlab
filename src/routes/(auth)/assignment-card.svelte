<script lang="ts">
	import DownloadSimpleIcon from "phosphor-svelte/lib/DownloadSimpleIcon";
	import EyeIcon from "phosphor-svelte/lib/EyeIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import UploadSimpleIcon from "phosphor-svelte/lib/UploadSimpleIcon";

	import { isValidDate } from "$lib";
	import Button from "$lib/components/button.svelte";
	import sanitizeHtml from "sanitize-html";
	import { slide } from "svelte/transition";
	import type { ParsedAssignmentWithResults } from "./assignments/+page.svelte";
	import Timestamp from "$lib/components/timestamp.svelte";

	let {
		assignment,
		showResult = false
	}: {
		showResult?: boolean;
		assignment: ParsedAssignmentWithResults;
	} = $props();

	let open = $state(false);
	let onActivated = () => (open = !open);

	const tzFormatOptions: Intl.DateTimeFormatOptions = {
		timeZone: "Asia/Kolkata",
		dateStyle: "long",
		timeStyle: "short"
	};

	// const isLarge = new MediaQuery("min-width: 32rem");
</script>

<div class="border-2 border-b-0 border-border last:border-b-2">
	<div role="button" tabindex="0" onclick={onActivated} onkeydown={onActivated} class="px-3 py-2">
		<div class="flex place-items-center justify-between gap-4">
			<div>
				<div class="line-clamp-1 text-xs font-bold text-muted-foreground">
					{assignment.subject}
				</div>
				<div class="font-medium">{assignment.title}</div>
			</div>

			<div class="flex shrink-0 place-items-center gap-4">
				{#if showResult && assignment._parsed_result != null}
					<div class="items-center self-stretch font-serif text-2xl font-bold text-nowrap">
						{#if assignment._parsed_result.obtained_mark != null}
							<span class="text-">{assignment._parsed_result.obtained_mark}</span>
						{:else}
							<span class="text-muted-foreground">--</span>
						{/if}
						/
						{assignment._parsed_result.max_mark}
					</div>
				{/if}
				{#if assignment.upload}
					{#if !assignment._parsed.has_uploaded}
						<Button
							size="icon-sm"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<UploadSimpleIcon weight="bold" />
						</Button>
					{:else}
						<Button
							size="icon-sm"
							variant="outline"
							href={assignment.uploaded_file}
							target="_blank"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<EyeIcon weight="bold" />
						</Button>
					{/if}
				{/if}
			</div>
		</div>

		{#if assignment._parsed.is_due}
			<div class="mt-2 text-sm font-bold text-error-foreground">
				Submit before <Timestamp
					timestamp={assignment._parsed.last_date}
					dateTimeFormatOptions={tzFormatOptions}
				/>
			</div>
		{/if}
	</div>

	{#if open}
		<div transition:slide>
			<div class="space-y-2 border-t-2 border-dashed border-border px-3 py-2 text-sm">
				<div class="flex place-items-center justify-between gap-4">
					<div>
						<div>
							<b>Issued</b>
							{#if isValidDate(assignment._parsed.issue_date)}
								<Timestamp
									timestamp={assignment._parsed.issue_date}
									dateTimeFormatOptions={tzFormatOptions}
								/>
							{:else}
								{assignment.issue_date}
							{/if}
						</div>
						<div>
							<b>Last date</b>
							<Timestamp
								timestamp={assignment._parsed.last_date}
								dateTimeFormatOptions={tzFormatOptions}
							/>
						</div>
					</div>
				</div>

				{#if assignment.url !== "" || assignment.upload}
					<div class="mb-1 flex gap-2">
						{#if assignment.url !== ""}
							<Button
								size="sm"
								variant="outline"
								href={assignment.url}
								target="_blank"
								onclick={(e) => {
									e.stopPropagation();
								}}
							>
								<DownloadSimpleIcon weight="bold" /> Question
							</Button>
						{/if}

						{#if assignment.upload}
							{#if assignment._parsed.has_uploaded}
								<Button
									size="sm"
									variant="outline"
									href={assignment.uploaded_file}
									target="_blank"
									onclick={(e) => {
										e.stopPropagation();
									}}
								>
									<EyeIcon weight="bold" />
									Submission
								</Button>

								<Button
									size="sm"
									variant="destructive"
									onclick={(e) => {
										e.stopPropagation();
									}}
									disabled
								>
									<TrashIcon weight="bold" />
									Delete
								</Button>
							{:else if assignment.status === "due" || assignment.status === "closed"}
								<Button
									size="sm"
									variant="default"
									onclick={(e) => {
										e.stopPropagation();
									}}
								>
									<UploadSimpleIcon weight="bold" />
									{#if assignment.status === "closed"}
										Try late upload
									{:else}
										Upload
									{/if}
								</Button>
							{/if}
						{/if}
					</div>
				{/if}

				{#if assignment.details}
					<p class="mt-2">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html sanitizeHtml(assignment.details)}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- <div transition:slide class="text-sm"> -->
	<!-- <div class="border-t-2 border-dashed border-border">
				<!-- todo: find a way to include these classes in the parent without the transition duration acting. --
			</div> -->
</div>
