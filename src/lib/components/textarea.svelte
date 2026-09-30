<script lang="ts" module>
	import { cn } from "$lib/cn-utils";
	import { tv } from "tailwind-variants";

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
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		class: className,
		value = $bindable(""),
		ref = $bindable(null),
		showCharacterCount = true,
		maxlength,
		...props
	}: WithElementRef<HTMLTextareaAttributes> & {
		showCharacterCount?: boolean;
	} = $props();
</script>

{#if showCharacterCount && typeof value === "string"}
	<div>
		{@render main()}
		<div class="mt-1 flex justify-end font-mono text-xs text-muted-foreground">
			<span
				class={[
					"font-bold transition-all duration-100",
					maxlength != null && value.length > maxlength ? "text-error-foreground" : ""
				]}
			>
				{value.length}&nbsp;
			</span>
			{#if maxlength != null}
				/ {maxlength}
			{/if}
		</div>
	</div>
{:else}
	{@render main()}
{/if}

{#snippet main()}
	<textarea
		bind:this={ref}
		bind:value
		class={cn(inputVariants({ class: ["w-full"] }), className)}
		{...props}
	></textarea>
{/snippet}
