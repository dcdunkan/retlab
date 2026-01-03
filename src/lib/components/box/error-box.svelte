<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="border-2 bg-red-100 p-2 text-sm font-medium text-red-800">
	{@render children()}
</div>
