<script lang="ts">
	import { cn } from "$lib/cn-utils";
	import type { WithElementRef } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		children,
		class: className = "",
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { children: Snippet } = $props();
</script>

<div
	class={cn(
		"border-2 border-border bg-muted p-2 text-center text-sm font-medium text-muted-foreground",
		className
	)}
	{...props}
>
	{@render children()}
</div>
