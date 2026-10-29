<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import ReleaseNote from "../release-note.svelte";

	let { data } = $props();
</script>

<ReleaseNote details={data.details} content={data.details.content} />

<section>
	<div class="flex flex-wrap gap-x-2 gap-y-0.5">
		<div class="font-semibold">History:</div>
		{#each data.tags as tag (tag)}
			{#if tag === page.params.tag}
				<span class="font-bold text-muted-foreground underline decoration-wavy">{tag}</span>
			{:else}
				<a href={resolve("/docs/release-notes/[tag]", { tag: tag })}>{tag}</a>
			{/if}
		{/each}
	</div>
</section>
