<script lang="ts">
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="border-2 border-info-border bg-info p-2 text-sm font-medium text-info-foreground">
	<p class="flex place-items-center gap-2">
		<SpinnerIcon class="size-4 animate-spin" />
		{@render children()}
	</p>
</div>
