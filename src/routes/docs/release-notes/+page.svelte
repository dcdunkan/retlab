<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import ReleaseNote from "./release-note.svelte";

	let { data } = $props();
</script>

{#if data.latest == null}
	<section><p>No latest tag?</p></section>
{:else}
	<section>
		<h2>{data.latest.tag}</h2>
	</section>

	<ReleaseNote content={data.latest.content} details={data.latest} />
{/if}

<section>
	<div class="flex flex-wrap gap-x-2 gap-y-0.5">
		<div class="font-semibold">History:</div>
		{#each data.tags as tag, i (tag)}
			{#if i === 0}
				<span class="font-bold text-muted-foreground underline decoration-wavy">{tag}</span>
			{:else}
				<a href={resolve("/docs/release-notes/[tag]", { tag: tag })}>{tag}</a>
			{/if}
		{/each}
	</div>
</section>
