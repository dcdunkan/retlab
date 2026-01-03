<script lang="ts">
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="border-2 bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
	{@render children()}
</div>
