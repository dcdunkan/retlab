<script lang="ts">
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";
	import type { Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();
</script>

<div class="border-2 bg-blue-100 p-2 text-sm font-medium text-blue-800">
	<p class="flex place-items-center gap-2 italic">
		<SpinnerIcon class="size-4 animate-spin" />
		{@render children()}
	</p>
</div>
