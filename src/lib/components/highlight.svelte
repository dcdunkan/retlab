<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<span class="font-medium text-ret-accent">
	{@render children()}
</span>
