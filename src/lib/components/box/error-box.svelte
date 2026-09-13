<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="border-2 border-error-border bg-error p-2 text-sm font-medium text-error-foreground">
	{@render children()}
</div>
