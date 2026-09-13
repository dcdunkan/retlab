<script lang="ts" module>
	import { tv } from "tailwind-variants";
	import { cn } from "$lib/cn-utils";

	export const inputVariants = tv({
		base: cn(
			"border-2 border-border bg-background px-2.5 py-1.5 text-foreground ring-0",
			"focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
			"invalid:border-error-border invalid:text-error-foreground invalid:ring-2 invalid:ring-error-border",
			"transition-all duration-150",
			"shadow-block-shadow"
		)
	});
</script>

<script lang="ts">
	import type { WithElementRef } from "bits-ui";
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { Component } from "svelte";
	import type { IconComponentProps } from "phosphor-svelte";

	let {
		class: className,
		value = $bindable(),
		ref = $bindable(null),
		icon: Icon = undefined,
		...props
	}: WithElementRef<HTMLInputAttributes> & {
		icon?: Component<IconComponentProps>;
	} = $props();
</script>

{#if Icon != null}
	<div class="relative">
		<Icon class="absolute inset-s-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
		<input
			bind:this={ref}
			bind:value
			class={cn(inputVariants({ class: ["w-full", Icon != null ? "pl-10" : ""] }), className)}
			{...props}
		/>
	</div>
{:else}
	<input bind:this={ref} bind:value class={cn(inputVariants(), className)} {...props} />
{/if}
