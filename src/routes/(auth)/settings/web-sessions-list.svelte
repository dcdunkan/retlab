<script lang="ts">
	import ArrowLeftIcon from "phosphor-svelte/lib/ArrowLeftIcon";
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";

	import { cn } from "$lib/cn-utils";
	import Button from "$lib/components/button.svelte";
	import type { ClientWebSession } from "./types";
	import WebSessionCard from "./web-session-card.svelte";
	import { onDestroy } from "svelte";

	let {
		wsessions,
		ref = $bindable(undefined)
	}: {
		wsessions: ClientWebSession[];
		ref?: HTMLDivElement | undefined;
	} = $props();

	let hasReachedEnd = $state(false);
	let hasReachedStart = $state(true);
	let scrollTimer = $state<NodeJS.Timeout>();

	const BREAK = 2;

	$effect(() => {
		if (ref == null) return;
		if (ref.clientWidth >= ref.scrollWidth) {
			hasReachedEnd = true;
		}
	});

	onDestroy(() => {
		clearTimeout(scrollTimer);
	});
</script>

<div
	bind:this={ref}
	onscroll={() => {
		clearTimeout(scrollTimer); // nicely debounce
		scrollTimer = setTimeout(() => {
			if (ref == null) {
				hasReachedStart = true;
				hasReachedEnd = true;
				return;
			}
			hasReachedStart = ref.scrollLeft <= BREAK;
			hasReachedEnd = ref.scrollLeft + ref.clientWidth >= ref.scrollWidth - BREAK;
		}, 10);
	}}
	class={cn(
		"no-scrollbar flex snap-x snap-mandatory snap-start gap-1 overflow-x-scroll",
		"border-x border-border transition-all duration-500",
		hasReachedEnd ? "border-r-transparent" : "",
		hasReachedStart ? "border-l-transparent" : ""
	)}
>
	{#each wsessions as ws, i (ws.id + i)}
		<WebSessionCard wsession={ws} />
	{/each}
</div>

<div class="flex items-center justify-between gap-2">
	<div class="text-xs text-muted-foreground">Click on a session for more information.</div>
	<div class="flex gap-0.5">
		<Button
			variant="outline"
			size="icon-xsm"
			disabled={hasReachedStart}
			onclick={() => {
				if (ref == null) return;
				const first = ref.firstElementChild;
				if (!(first instanceof HTMLElement)) return;

				const inView = Math.floor(ref.clientWidth / first.clientWidth);
				const alreadyPast = Math.floor(ref.scrollLeft / first.clientWidth);
				const prev = Math.max(alreadyPast - inView, 0);
				const item = ref.children.item(prev) as HTMLDivElement;
				const itemRect = item.getBoundingClientRect();
				const containerRect = ref.getBoundingClientRect();
				const left = ref.scrollLeft + itemRect.left - containerRect.left;
				ref.scrollTo({ behavior: "smooth", left: prev == 0 ? 0 : left });
			}}
		>
			<ArrowLeftIcon />
		</Button>
		<Button
			variant="outline"
			size="icon-xsm"
			disabled={hasReachedEnd}
			onclick={() => {
				if (ref == null) return;
				const first = ref.firstElementChild;
				if (!(first instanceof HTMLElement)) return;

				const inView = Math.floor(ref.clientWidth / first.clientWidth);
				const alreadyPast = Math.floor(ref.scrollLeft / first.clientWidth);
				const next = inView + alreadyPast;
				const item = ref.children.item(
					next < ref.childElementCount ? next : ref.childElementCount - 1
				) as HTMLDivElement;
				const itemRect = item.getBoundingClientRect();
				const containerRect = ref.getBoundingClientRect();
				const left = ref.scrollLeft + itemRect.left - containerRect.left;
				ref.scrollTo({ behavior: "smooth", left: left });
			}}
		>
			<ArrowRightIcon />
		</Button>
	</div>
</div>
