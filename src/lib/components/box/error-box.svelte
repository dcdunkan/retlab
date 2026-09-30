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
		"border-2 border-error-border bg-error p-2 text-sm font-medium text-error-foreground",
		className
	)}
	{...props}
>
	{@render children()}
</div>
