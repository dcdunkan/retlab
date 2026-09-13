<script lang="ts">
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";
	import MinusIcon from "phosphor-svelte/lib/MinusIcon";

	import { cn } from "$lib/cn-utils";
	import { Checkbox, type WithoutChildrenOrChild } from "bits-ui";

	let { class: className, ...restProps }: WithoutChildrenOrChild<Checkbox.RootProps> = $props();
</script>

<Checkbox.Root
	class={cn(
		"group relative inline-flex size-5 shrink-0 border-2 transition-all duration-75 data-disabled:opacity-60 data-[state=checked]:bg-ret-switch-on data-[state=indeterminate]:bg-background data-[state=unchecked]:bg-ret-switch-off",
		className
	)}
	{...restProps}
>
	{#snippet children({ indeterminate })}
		{#if indeterminate}
			<MinusIcon class="absolute inset-0 size-full transition-all duration-150" weight="bold" />
		{:else}
			<CheckIcon
				class="absolute inset-0 size-full transition-all duration-150 group-data-[state=checked]:text-ret-switch-on-foreground group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-0"
				weight="bold"
			/>
			<XIcon
				class="absolute inset-0 size-full transition-all duration-150 group-data-[state=checked]:opacity-0 group-data-[state=unchecked]:text-ret-switch-off-foreground group-data-[state=unchecked]:opacity-100"
				weight="bold"
			/>
		{/if}
	{/snippet}
</Checkbox.Root>
