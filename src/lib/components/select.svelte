<script lang="ts">
	import { Select, type WithoutChildren } from "bits-ui";
	import CaretDoubleDownIcon from "phosphor-svelte/lib/CaretDoubleDown";
	import CaretDoubleUpIcon from "phosphor-svelte/lib/CaretDoubleUp";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDown";
	import CheckIcon from "phosphor-svelte/lib/Check";
	import type { Snippet } from "svelte";
	import { buttonVariants } from "./button.svelte";

	type Props = WithoutChildren<Select.RootProps> & {
		items: { value: string; label: string; disabled?: boolean }[];
		trigger: Snippet<[selected: string | undefined]>;
	};

	let { value = $bindable(), trigger, items, ...restProps }: Props = $props();

	const selected = $derived(items.find((item) => item.value === value));
</script>

<!--
TypeScript Discriminated Unions + destructing (required for "bindable") do not
get along, so we shut typescript up by casting `value` to `never`, however,
from the perspective of the consumer of this component, it will be typed appropriately.
-->
<Select.Root bind:value={value as never} {...restProps}>
	<Select.Trigger
		class={buttonVariants({
			variant: "outline",
			size: "sm",
			shadow: "none"
		})}
	>
		{@render trigger(selected?.label)}
		<CaretDownIcon />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content class="z-99 border-2 bg-background shadow-sshadow" align="start">
			<Select.ScrollUpButton class="flex w-full items-center justify-center">
				<CaretDoubleUpIcon class="size-3" />
			</Select.ScrollUpButton>
			<Select.Viewport class="divide-y-2">
				{#each items as { value, label, disabled } (value)}
					<Select.Item
						{value}
						{label}
						{disabled}
						class="flex w-full items-center justify-between px-2.5 py-1.5 text-sm capitalize select-none data-disabled:opacity-50 data-highlighted:bg-black/10"
					>
						{#snippet children({ selected })}
							<div class="mr-2 pr-2">{label}</div>

							{#if selected}
								<div>
									<CheckIcon aria-label="check" class="size-4" />
								</div>
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
			<Select.ScrollDownButton class="flex w-full items-center justify-center">
				<CaretDoubleDownIcon class="size-3" />
			</Select.ScrollDownButton>
		</Select.Content>
	</Select.Portal>
</Select.Root>
