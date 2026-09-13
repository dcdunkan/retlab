<script lang="ts" generics="T extends HTMLElement">
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Input from "$lib/components/input.svelte";
	import SingleSlider from "$lib/components/single-slider.svelte";
	import { Popover } from "bits-ui";
	import parseColor from "color-parse";
	import ArrowCounterClockwiseIcon from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
	import FloppyDiskBackIcon from "phosphor-svelte/lib/FloppyDiskBackIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	let {
		ref
	}: {
		ref: T | null;
	} = $props();

	type ColorDef = { space: "oklch"; l: number; c: number; h: number; a: number };

	type ColorProperty = {
		type: "color";
		rawValue: string;
		parsedValue: ColorDef;
	};

	type PropertyValue = ColorProperty;

	let properties = $state<Record<string, PropertyValue | null>>({});

	function getColor(value: string): ColorProperty | null {
		const parsed = parseColor(value);
		if (parsed.space == null) {
			return null;
		}

		if (parsed.space === "oklch") {
			const [l, c, h] = parsed.values;
			return {
				type: "color",
				rawValue: value,
				parsedValue: {
					space: "oklch",
					l: l,
					c: c,
					h: h,
					a: parsed.alpha
				}
			};
		} else {
			console.log("unhandled color space:", parsed.space);
			console.log(parsed);
			return null;
		}
	}

	type HandledProperties = "color" | "backgroundColor" | "outlineColor" | "borderColor";

	function getCurrentComputedProperties(
		el: HTMLElement
	): Record<HandledProperties, PropertyValue | null> {
		const style = window.getComputedStyle(el);
		return {
			color: getColor(style.color),
			borderColor: getColor(style.borderColor),
			backgroundColor: getColor(style.backgroundColor),
			outlineColor: getColor(style.outlineColor)
		};
	}

	$effect(() => {
		if (ref == null) return;
		properties = getCurrentComputedProperties(ref);
	});

	let popoverOpen = $state(false);

	let popoverAnchor = $state<HTMLButtonElement | null>(null);

	let colorpickerData = $state<{
		key: HandledProperties;
		initialRawValue: string;
		initial: ColorDef;
	}>();
	let colorpickerState = $state<{
		color: ColorDef;
		rawValue: string;
	}>();

	function stringifyColor(def: ColorDef) {
		if (def.space === "oklch") {
			return `oklch(${def.l} ${def.c} ${def.h} / ${def.a})`;
		}
		throw new Error("unknown");
	}

	let calculatedValue = $derived.by<string | undefined>(() => {
		if (colorpickerState == null) return undefined;
		return stringifyColor(colorpickerState.color);
	});
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Portal>
		<Popover.Content
			interactOutsideBehavior="defer-otherwise-ignore"
			trapFocus={false}
			side="right"
			align="start"
			class="fixed z-49 max-w-[90vw] border-2 bg-background p-2 shadow-block-shadow data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
			customAnchor={popoverAnchor}
		>
			<Popover.Arrow />

			<div class="flex h-full flex-col space-y-2">
				<div class="flex place-items-center justify-between gap-2">
					<div class="text- xl font-serif font-bold italic">Color picker</div>

					<div>
						<Button
							size="icon-xsm"
							variant="outline"
							shadow="default"
							onclick={() => {
								if (colorpickerData == null) return;
								colorpickerState = {
									color: colorpickerData.initial,
									rawValue: colorpickerData.initialRawValue
								};
							}}
						>
							<ArrowCounterClockwiseIcon weight="bold" />
						</Button>

						<Popover.Close
							class={buttonVariants({ size: "icon-xsm", variant: "outline", shadow: "default" })}
						>
							<XIcon weight="bold" />
						</Popover.Close>
					</div>
				</div>

				{#if colorpickerState != null}
					<div
						class="h-48 w-full min-w-64 border-2 border-border"
						style:background-color={calculatedValue}
					></div>

					{#if colorpickerState.color.space === "oklch"}
						<div class="space-y-2">
							<SingleSlider
								bind:value={colorpickerState.color.l}
								min={0.0}
								max={1.0}
								step={0.001}
							/>
							<SingleSlider
								bind:value={colorpickerState.color.c}
								min={0.0}
								max={0.4}
								step={0.001}
							/>
							<SingleSlider bind:value={colorpickerState.color.h} min={0} max={360} step={0.1} />
							<SingleSlider bind:value={colorpickerState.color.a} min={0} max={1} step={0.01} />
						</div>

						<div class="flex place-items-center gap-2">
							<Input
								type="number"
								min={0.0}
								max={1.0}
								step={0.001}
								bind:value={colorpickerState.color.l}
								size={4}
								class="no-arrows font-mono text-xs"
							/>
							<Input
								type="number"
								min={0.0}
								max={0.4}
								step={0.001}
								bind:value={colorpickerState.color.c}
								size={4}
								class="no-arrows font-mono text-xs"
							/>
							<Input
								type="number"
								min={0}
								max={360}
								step={0.1}
								bind:value={colorpickerState.color.h}
								size={4}
								class="no-arrows font-mono text-xs"
							/>
							<Input
								type="number"
								min={0}
								max={1}
								step={0.01}
								bind:value={colorpickerState.color.a}
								size={3}
								class="no-arrows font-mono text-xs"
							/>
						</div>
					{:else}
						<div>Not implemented</div>
					{/if}

					<Button
						size="sm"
						variant="outline"
						onclick={() => {
							if (ref == null || colorpickerData == null || colorpickerState == null) return;
							ref.style[colorpickerData.key] = stringifyColor(colorpickerState.color);
							properties[colorpickerData.key] = {
								type: "color",
								parsedValue: colorpickerState.color,
								rawValue: ref.style[colorpickerData.key]
							};
						}}
					>
						<FloppyDiskBackIcon weight="fill" /> Overwrite
					</Button>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<div class="border-2 border-border px-3 py-2">
	{#each Object.entries(properties) as [key, value], i (i)}
		{#if value == null}
			<div class="text-error-foreground">unparseable value</div>
		{:else if value.type === "color"}
			<div class="flex justify-between gap-2">
				<div class="font-bold">{key}</div>
				<button
					class="flex place-items-center gap-1 hover:bg-muted/50"
					onclick={(e) => {
						colorpickerData = {
							key: key as HandledProperties,
							initialRawValue: value.rawValue,
							initial: value.parsedValue
						};
						colorpickerState = {
							color: value.parsedValue,
							rawValue: value.rawValue
						};
						popoverOpen = true;
						popoverAnchor = e.currentTarget;
					}}
				>
					<span
						class="aspect-square size-4 shrink-0 border-2 border-border"
						style:background-color={value.rawValue}
					></span>
					<span class="font-mono text-sm">{value.rawValue}</span>
				</button>
			</div>
		{:else}
			<div class="text-error-foreground">unsupported type: {value.type}</div>
		{/if}
	{/each}
</div>
