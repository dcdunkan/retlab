<script lang="ts">
	import { isValidDate } from "$lib";
	import Button from "$lib/components/button.svelte";
	import type * as models from "$lib/generated/models";
	import DownloadSimpleIcon from "phosphor-svelte/lib/DownloadSimple";
	import UploadSimpleIcon from "phosphor-svelte/lib/UploadSimple";
	import EyeIcon from "phosphor-svelte/lib/Eye";
	import TrashIcon from "phosphor-svelte/lib/Trash";
	import sanitizeHtml from "sanitize-html";
	import { MediaQuery } from "svelte/reactivity";
	import { slide } from "svelte/transition";

	let {
		assignment
	}: {
		assignment: models.assignment.Assignment & {
			_parsed: {
				issue_date: Date;
				last_date: Date;
				has_uploaded: boolean;
				is_due: boolean;
			};
		};
	} = $props();

	let open = $state(false);
	let onActivated = () => (open = !open);

	const tzFormatter = new Intl.DateTimeFormat("en-IN", {
		timeZone: "Asia/Kolkata",
		dateStyle: "long",
		timeStyle: "short"
	});

	const isLarge = new MediaQuery("min-width: 32rem");
</script>

<div class="border-2 border-b-0 last:border-b-2">
	<div role="button" tabindex="0" onclick={onActivated} onkeydown={onActivated} class="px-3 py-2">
		<div class="flex place-items-center justify-between gap-4">
			<div>
				<div class="line-clamp-1 text-xs font-bold text-muted-foreground">
					{assignment.subject}
				</div>
				<div class="font-medium">{assignment.title}</div>
			</div>

			<div class="shrink-0">
				{#if assignment.url != ""}
					<!-- is a downloadable assignment -->
					<Button
						size="icon-sm"
						variant="outline"
						shadow="none"
						href={assignment.url}
						onclick={(e) => {
							e.stopPropagation();
						}}
					>
						<DownloadSimpleIcon />
					</Button>
				{/if}
				{#if assignment.upload}
					<!-- uploadable (online submission) -->
					{#if !assignment._parsed.has_uploaded}
						<!-- has not uploaded yet -->
						<Button
							size="icon-sm"
							shadow="none"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<UploadSimpleIcon />
						</Button>
					{:else}
						<!-- already uploaded -->
						<Button
							size="icon-sm"
							shadow="none"
							variant="outline"
							href={assignment.uploaded_file}
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<EyeIcon />
						</Button>
					{/if}
				{/if}
			</div>
		</div>

		{#if assignment._parsed.is_due}
			<div class="mt-2 text-sm text-red-800">
				Submit before {tzFormatter.format(assignment._parsed.last_date)}
			</div>
		{/if}

		<!-- {#if open}
			<div transition:slide class="mt-2 space-x-1 text-sm *:border-r *:pr-2 *:last:border-r-0">
				{#if assignment.url != ""}
					<a class="text-blue-700 hover:underline" href={assignment.url}>View assignment</a>
				{/if}
				{#if assignment.upload}
					{#if assignment.uploaded_file == "" || assignment.uploaded_file == new URL(college.base_url).origin}
						<a class="text-blue-700 hover:underline" href={assignment.url}>Submit assignment</a>
					{:else}
						<a class="text-blue-700 hover:underline" href={assignment.uploaded_file}
							>View submission</a
						>
					{/if}
				{/if}
			</div>
		{/if} -->
	</div>

	{#if open}
		<div transition:slide class="bg-muted text-sm">
			<div class="border-t-2 border-dashed">
				<!-- todo: find a way to include these classes in the parent without the transition duration acting. -->
			</div>
			<div class="space-y-2 px-3 py-2">
				<div class="flex place-items-center justify-between gap-4">
					<div>
						<div>
							<b>Issued on</b>
							{isValidDate(assignment._parsed.issue_date)
								? tzFormatter.format(assignment._parsed.issue_date)
								: assignment.issue_date}
						</div>
						<div>
							<b>Last date</b>
							{tzFormatter.format(assignment._parsed.last_date)}
						</div>
					</div>
					{#if assignment.upload && assignment._parsed.has_uploaded}
						<Button
							size={isLarge.current ? "sm" : "icon-sm"}
							shadow="none"
							variant="destructive"
							onclick={(e) => {
								e.stopPropagation();
							}}
						>
							<TrashIcon />
							{#if isLarge.current}
								Delete
							{/if}
						</Button>
					{/if}
				</div>

				{#if assignment.details}
					<p>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html sanitizeHtml(assignment.details)}
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
