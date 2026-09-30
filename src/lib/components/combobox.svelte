<script lang="ts">
	import { Combobox } from "bits-ui";
	import CaretDoubleDownIcon from "phosphor-svelte/lib/CaretDoubleDownIcon";
	import CaretDoubleUpIcon from "phosphor-svelte/lib/CaretDoubleUpIcon";
	import CaretUpDownIcon from "phosphor-svelte/lib/CaretUpDownIcon";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import { inputVariants } from "./input.svelte";

	import { type WithoutChildrenOrChild, mergeProps } from "bits-ui";
	import type { Component } from "svelte";
	import type { IconComponentProps } from "phosphor-svelte";
	import { buttonVariants } from "./button.svelte";

	type Props = Combobox.RootProps & {
		inputProps?: WithoutChildrenOrChild<Combobox.InputProps>;
		contentProps?: WithoutChildrenOrChild<Combobox.ContentProps>;
		icon: Component<IconComponentProps> | undefined;
	};

	let {
		items = [],
		value = $bindable(),
		open = $bindable(false),
		inputProps,
		contentProps,
		icon: Icon = undefined,
		type,
		...restProps
	}: Props = $props();

	let searchValue = $state("");

	const filteredItems = $derived.by(() => {
		if (searchValue === "") return items;
		return items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()));
	});

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		searchValue = e.currentTarget.value;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) searchValue = "";
	}

	const mergedRootProps = $derived(mergeProps(restProps, { onOpenChange: handleOpenChange }));
	const mergedInputProps = $derived(mergeProps(inputProps, { oninput: handleInput }));
</script>

<Combobox.Root {type} {items} bind:value={value as never} bind:open {...mergedRootProps}>
	<div class="relative">
		<Icon
			weight="bold"
			class="absolute inset-s-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
		/>
		<Combobox.Input
			{...mergedInputProps}
			class={inputVariants({ class: ["w-full", Icon != null ? "px-10" : "pr-10"] })}
		/>
		<Combobox.Trigger
			class={buttonVariants({
				variant: "ghost",
				size: "icon-xsm",
				class: "absolute inset-e-3 top-1/2 size-5 -translate-y-1/2 touch-none"
			})}
		>
			<CaretUpDownIcon class="size-5 text-muted-foreground" weight="bold" />
		</Combobox.Trigger>
	</div>
	<Combobox.Portal>
		<Combobox.Content
			class="focus-override z-50 h-96 max-h-(--bits-combobox-content-available-height) w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) border-2 border-border bg-background px-1 py-3 shadow-block-shadow outline-hidden select-none data-[side=bottom]:translate-y-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:-translate-x-1 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-1 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-1 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
			{...contentProps}
		>
			<Combobox.ScrollUpButton
				class="flex w-full items-center justify-center border-b-2 border-border py-1"
			>
				<CaretDoubleUpIcon class="size-3" weight="bold" />
			</Combobox.ScrollUpButton>
			<Combobox.Viewport class="p-1">
				{#each filteredItems as item, i (i + item.value)}
					<Combobox.Item
						class="flex w-full items-center py-1.5 pr-1.5 pl-3 text-sm capitalize outline-hidden select-none data-highlighted:bg-muted"
						value={item.value}
						label={item.label}
					>
						{#snippet children({ selected })}
							{item.label}
							{#if selected}
								<div class="ml-auto">
									<CheckIcon weight="bold" />
								</div>
							{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<span class="block px-5 py-2 text-sm text-muted-foreground">
						No results found, may be not a Etlab consumer?
					</span>
				{/each}
			</Combobox.Viewport>
			<Combobox.ScrollDownButton
				class="flex w-full items-center justify-center border-t-2 border-border py-1 "
			>
				<CaretDoubleDownIcon class="size-3" weight="bold" />
			</Combobox.ScrollDownButton>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
