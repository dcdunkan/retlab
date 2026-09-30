<script lang="ts">
	import { SECOND } from "$lib";
	import Timestamp from "$lib/components/timestamp.svelte";
	import { onDestroy } from "svelte";
	import type { ClientWebSession } from "./types";

	let {
		wsession: ws
	}: {
		wsession: ClientWebSession;
	} = $props();

	let switchTimer = $state<NodeJS.Timeout>();
	let resetTimer = $state<NodeJS.Timeout>();

	let inFocusIndex = $state(0);

	function onClick(e: { currentTarget: EventTarget & HTMLDivElement }) {
		if (switchTimer != null) clearTimeout(switchTimer);
		if (resetTimer != null) clearTimeout(resetTimer);

		const div = e.currentTarget;

		switchTimer = setTimeout(() => {
			const next = (inFocusIndex + 1) % div.childElementCount;
			const item = div.children.item(next);
			if (item == null) return;
			const itemRect = item.getBoundingClientRect();
			const containerRect = div.getBoundingClientRect();
			const top = div.scrollTop + itemRect.top - containerRect.top;
			div.scrollTo({ behavior: "smooth", top: top });
			inFocusIndex++;
		}, 50);
	}

	onDestroy(() => {
		clearTimeout(switchTimer);
		clearTimeout(resetTimer);
	});
</script>

<div
	role="button"
	tabindex={0}
	class="no-scrollbar h-24 max-h-24 min-h-24 max-w-52 min-w-52 snap-y snap-proximity overflow-y-hidden border-2 border-border text-left select-none *:flex *:h-23 *:w-full *:cursor-row-resize *:snap-center *:flex-col *:px-3 *:py-2 *:text-left"
	onclick={onClick}
	onkeydown={(e) => {
		if (e.ctrlKey || e.shiftKey || e.altKey) return;
		return onClick(e);
	}}
	onscrollend={(e) => {
		const div = e.currentTarget;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			div.scrollTo({ behavior: "smooth", top: 0 });
		}, 10 * SECOND);
	}}
>
	{#if ws.revokedAt == null}
		<div>
			<div class="font-bold text-warning-foreground">Expired</div>
			<Timestamp timestamp={ws.expiresAt} />
		</div>
	{:else}
		<div>
			<div class="font-bold text-error-foreground">Revoked</div>
			<Timestamp timestamp={ws.revokedAt} />
		</div>

		<div class="text-error-foreground">
			<div class="text-sm">
				{#if ws.revokedReason != null}
					{ws.revokedReason}
				{:else}
					<i class="font-bold">Revoked upon disabling web sessions.</i>
				{/if}
			</div>
		</div>
	{/if}

	<div>
		<div class="font-bold">Requests made</div>
		<div class="font-mono text-3xl font-bold">{ws.requestsMade}</div>
	</div>

	<div>
		<div class="font-bold">Requested at</div>
		<Timestamp timestamp={ws.requestedAt} />
	</div>

	<div>
		<div class="font-bold">Last used at</div>
		<Timestamp timestamp={ws.lastUsedAt} />
	</div>
</div>
