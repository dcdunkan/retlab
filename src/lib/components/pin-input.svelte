<script lang="ts">
	import { cn } from "$lib/cn-utils";
	import { PinInput, type PinInputRootProps, type PinInputRootSnippetProps } from "bits-ui";

	type CellProps = PinInputRootSnippetProps["cells"][0];

	let {
		hide = false,
		value = $bindable(""),
		...props
	}: PinInputRootProps & {
		hide?: boolean;
	} = $props();
</script>

<PinInput.Root
	bind:value
	class="group/pininput flex items-center text-foreground has-disabled:opacity-30"
	{...props}
>
	{#snippet children({ cells })}
		<div class="flex">
			{#each cells.slice(0, 6) as cell, i (i)}
				{@render Cell(cell)}
			{/each}
		</div>
	{/snippet}
</PinInput.Root>

{#snippet Cell(cell: CellProps)}
	<PinInput.Cell
		{cell}
		class={cn(
			// Custom class to override global focus styles
			// "focus-override",
			// "relative h-12 w-10 text-2xl",
			// "flex items-center justify-center",
			// "transition-all duration-75",
			// "border-y border-r border-border/20 first:border-l",
			// "text-foreground group-focus-within/pininput:border-foreground/40 group-hover/pininput:border-foreground/40",
			// "outline-0",
			// "data-active:outline-1 data-active:outline-foreground",
			// todo: make the active/inactive styles better
			"relative h-12 w-10 text-2xl",
			"flex items-center justify-center",
			"transition-all duration-75",
			"border-y-2 border-r-2 border-border first:border-l-2",
			"bg-background text-foreground",
			"shadow-block-shadow",
			"group-focus-within/pininput:border-border/50 group-hover/pininput:border-border/50",
			"outline-0",
			"z-10 data-active:z-999 data-active:outline-3 data-active:outline-border"
		)}
	>
		{#if cell.char !== null}
			<div>{hide ? "*" : cell.char}</div>
		{/if}
		{#if cell.hasFakeCaret}
			<div
				class="pointer-events-none absolute inset-0 flex animate-caret-blink items-center justify-center"
			>
				<div class="h-8 w-px bg-foreground"></div>
			</div>
		{/if}
	</PinInput.Cell>
{/snippet}
