<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import { toast } from "svelte-sonner";

	import MinusIcon from "phosphor-svelte/lib/MinusIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";
	import EyedropperIcon from "phosphor-svelte/lib/EyedropperIcon";
	import CornersOutIcon from "phosphor-svelte/lib/CornersOutIcon";

	let selectedElement = $state<HTMLElement>();
	let minimized = $state(true);
</script>

<div
	class={[
		"fixed bottom-6 left-[50%] z-49 max-h-[40svh] w-full max-w-[calc(var(--max-prose-width,65ch))] translate-x-[-50%]",
		"border-2 border-border bg-background shadow-block-shadow"
	]}
>
	<div
		class={[
			"flex place-items-center justify-between gap-2 px-2 py-1",
			minimized ? "" : "border-b-2 border-border"
		]}
	>
		<div class="font-serif font-bold">
			{#if selectedElement == null}
				<span class="text-muted-foreground">Select an element to start tweaking.</span>
			{:else}
				{selectedElement.dataset.inspectableName}
				<span class="text-muted-foreground">({selectedElement.tagName.toLowerCase()})</span>
			{/if}
		</div>

		<div class="flex place-items-center gap-1">
			<Button
				size="icon-xsm"
				variant="outline"
				onclick={() => {
					document.body.style.cursor = "crosshair";
					function listener(event: PointerEvent) {
						event.preventDefault();
						event.stopPropagation();
						event.stopImmediatePropagation();
						document.body.style.cursor = "default";

						let target = event.target;
						while (
							target != null &&
							target instanceof HTMLElement &&
							typeof target.dataset.inspectable !== "string" &&
							target !== document.body
						) {
							target = target.parentElement;
						}
						if (!(target instanceof HTMLElement) || target === document.body) {
							toast.info("Selected element cannot be inspected.");
							return;
						}
						selectedElement = target;
						minimized = false;
					}
					setTimeout(() => {
						document.body.addEventListener("click", listener, { once: true, capture: true });
						// document.body.addEventListener("pointerdown", listener, { once: true, capture: true });
					}, 0);
				}}
			>
				<EyedropperIcon weight="fill" />
			</Button>
			<Button
				size="icon-xsm"
				variant="outline"
				disabled={selectedElement == null}
				onclick={() => {
					minimized = !minimized;
				}}
			>
				{#if minimized}
					<CornersOutIcon weight="bold" />
				{:else}
					<MinusIcon weight="bold" />
				{/if}
			</Button>
			<Button size="icon-xsm" variant="destructive">
				<XIcon weight="bold" />
			</Button>
		</div>
	</div>

	{#if selectedElement != null && !minimized}
		<div class="px-2 py-1"></div>
	{/if}
</div>
