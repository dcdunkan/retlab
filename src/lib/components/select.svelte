<script lang="ts">
	import CaretDoubleDownIcon from "phosphor-svelte/lib/CaretDoubleDownIcon";
	import CaretDoubleUpIcon from "phosphor-svelte/lib/CaretDoubleUpIcon";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";

	import { Select, type WithoutChildren } from "bits-ui";
	import { buttonVariants } from "./button.svelte";
	import { cn } from "$lib/cn-utils";
	import type { Snippet } from "svelte";

	type Props = WithoutChildren<Select.RootProps> & {
		placeholder?: string;
		items: { value: string; label: string; disabled?: boolean }[];
		contentProps?: WithoutChildren<Select.ContentProps>;
		class?: string;
		single?: Snippet<
			[
				{
					selected?: { value: string; label: string; disabled?: boolean } | undefined;
					placeholder?: string | undefined;
				}
			]
		>;
		multiple?: Snippet<
			[
				{
					selected: { value: string; label: string; disabled?: boolean }[];
					placeholder?: string | undefined;
				}
			]
		>;
	};

	let {
		class: className = "",
		value = $bindable(),
		items,
		contentProps,
		placeholder,
		disabled,
		single,
		multiple,
		...restProps
	}: Props = $props();
</script>

<!--
TypeScript Discriminated Unions + destructing (required for "bindable") do not
get along, so we shut typescript up by casting `value` to `never`, however,
from the perspective of the consumer of this component, it will be typed appropriately.
-->
<Select.Root bind:value={value as never} {...restProps}>
	<Select.Trigger {disabled} class={cn(buttonVariants({ variant: "outline" }), className)}>
		{@const selected = value}
		{#if restProps.type === "single"}
			{#if single != null}
				{@render single?.({
					selected:
						typeof selected === "string" ? items.find((v) => selected === v.value) : undefined,
					placeholder: placeholder
				})}
			{:else if typeof selected === "string"}
				{items.find((v) => selected === v.value)?.label ?? placeholder}
			{:else}
				{placeholder}
			{/if}
		{:else if restProps.type === "multiple"}
			{#if multiple != null}
				{@render multiple?.({
					selected:
						Array.isArray(selected) && selected.length > 0
							? selected
									.map((value) => items.find((item) => item.value === value))
									.filter((item) => item != null)
							: [],
					placeholder: placeholder
				})}
			{:else if Array.isArray(selected) && selected.length > 0}
				{items.find((v) => selected[0] === v.value)?.label}
				{#if selected.length > 1}
					+ {selected.length - 1}
				{/if}
			{:else}
				{placeholder}
			{/if}
		{/if}
		<CaretDownIcon weight="bold" />

		<!-- fix: use this once the fix for this (https://github.com/huntabyte/bits-ui/issues/2062) lands -->
		<!-- <Select.Value {placeholder}>
			{#snippet child({ selection, placeholder })}
				{#if selection.type === "single"}
					{selection.selected?.label ?? placeholder}
				{:else if selection.type === "multiple"}
					{selection.selected[0]?.label ?? placeholder}
					{#if selection.selected.length > 1}
						+ {selection.selected.length - 1}
					{/if}
				{:else}
					What the hell?!
				{/if}
				<CaretDownIcon weight="bold" />
			{/snippet}
		</Select.Value> -->
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			class="z-99 border-2 border-border bg-background shadow-block-shadow"
			align="end"
			{...contentProps}
		>
			<Select.ScrollUpButton class="flex w-full items-center justify-center">
				<CaretDoubleUpIcon class="size-3" weight="bold" />
			</Select.ScrollUpButton>

			<Select.Viewport class="divide-y-2 divide-border">
				{#each items as { value, label, disabled } (value)}
					<Select.Item
						{value}
						{label}
						{disabled}
						class="flex w-full items-center justify-between px-2.5 py-1.5 text-sm capitalize select-none data-disabled:opacity-50 data-highlighted:bg-foreground/10"
					>
						{#snippet children({ selected })}
							{#if selected}
								<div class="mr-2 pr-2 font-bold">{label}</div>
								<div>
									<CheckIcon weight="bold" aria-label="check" class="size-4" />
								</div>
							{:else}
								<div class="mr-2 pr-2">{label}</div>
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>

			<Select.ScrollDownButton class="flex w-full items-center justify-center">
				<CaretDoubleDownIcon class="size-3" weight="bold" />
			</Select.ScrollDownButton>
		</Select.Content>
	</Select.Portal>
</Select.Root>
