<script lang="ts">
	import { cn } from "$lib/cn-utils";
	import type { Snippet } from "svelte";

	let {
		class: className,
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn("inline-block px-1 font-medium uppercase", className)}>
	{@render children()}
</div>
