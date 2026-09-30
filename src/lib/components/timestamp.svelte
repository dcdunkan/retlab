<script lang="ts">
	import { SECOND, timeDistanceToNow } from "$lib";
	import { cn } from "$lib/cn-utils";
	import { onDestroy, onMount } from "svelte";
	import Button from "./button.svelte";

	let {
		timestamp,
		raw = false,
		class: className = "",
		dateTimeFormatOptions
	}: {
		timestamp: Date;
		raw?: boolean;
		class?: string;
		dateTimeFormatOptions?: Intl.DateTimeFormatOptions;
	} = $props();

	const timeFormatter = $derived(
		new Intl.DateTimeFormat("en-IN", {
			dateStyle: "medium",
			timeStyle: "medium",
			...dateTimeFormatOptions
		})
	);
	let displayText = $derived(raw ? timeFormatter.format(timestamp) : timeDistanceToNow(timestamp));

	let interval = $state<NodeJS.Timeout>();

	onMount(() => {
		interval = setInterval(() => {
			if (!raw) {
				displayText = timeDistanceToNow(timestamp);
			}
		}, 10 * SECOND);
	});

	let suppressClick = $state(false);
	let startTime = $state<number>();

	function interactionStart() {
		startTime = Date.now();
		setTimeout(() => {
			if (startTime == null) return;
			if (Date.now() - startTime) {
				suppressClick = true;
				raw = !raw;
			}
		}, 300);
	}
	function interactionEnd() {
		startTime = undefined;
	}

	onDestroy(() => {
		clearTimeout(interval);
	});
</script>

<Button
	shadow="none"
	size="min"
	variant="ghost"
	class={cn(
		"w-fit text-left font-normal whitespace-normal underline decoration-border decoration-dashed underline-offset-4",
		className
	)}
	onmousedown={interactionStart}
	ontouchstart={interactionStart}
	ontouchend={interactionEnd}
	onmouseup={interactionEnd}
	onclick={(e) => {
		if (suppressClick) {
			suppressClick = false;
			e.stopPropagation();
			e.preventDefault();
		}
	}}
>
	{displayText}
</Button>
