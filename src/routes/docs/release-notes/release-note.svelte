<script lang="ts">
	import GitCommitIcon from "phosphor-svelte/lib/GitCommitIcon";
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import ArrowLeftIcon from "phosphor-svelte/lib/ArrowLeftIcon";

	import { resolve } from "$app/paths";
	import MdastRenderer from "$lib/components/mdast-renderer.svelte";
	import Timestamp from "$lib/components/timestamp.svelte";
	import type { Parent } from "mdast";

	let {
		details,
		content
	}: {
		details: Omit<Scripts.ReleaseNoteEntry, "filepath">;
		content: Parent;
	} = $props();
</script>

{#snippet release_note_navigation()}
	<section>
		<div class="flex place-items-center justify-between gap-2">
			{#if details.prev != null}
				<a href={resolve("/docs/release-notes/[tag]", { tag: details.prev })}>
					<ArrowLeftIcon weight="bold" />
					{details.prev}
				</a>
			{:else}
				<span class="grow"></span>
			{/if}
			{#if details.next != null}
				<a href={resolve("/docs/release-notes/[tag]", { tag: details.next })}>
					{details.next}
					<ArrowRightIcon weight="bold" />
				</a>
			{/if}
		</div>
	</section>
{/snippet}

{@render release_note_navigation()}

<section>
	<MdastRenderer tree={content.children} />
</section>

<!-- {@render release_note_navigation()} -->

<section class="border-t-2 border-border py-4">
	<div class="space-y-1">
		<div class="text-2xl font-bold">{details.tag}</div>

		<div class="flex place-items-end gap-1 text-muted-foreground">
			<a target="_blank" href="https://github.com/dcdunkan/retlab/commit/{details.commitSha}">
				<GitCommitIcon weight="bold" />
				commit {details.commitShortSha}
			</a>
			&middot;
			<div>
				released <Timestamp class="text-base" timestamp={new Date(details.date)} />
			</div>
		</div>
	</div>
</section>
