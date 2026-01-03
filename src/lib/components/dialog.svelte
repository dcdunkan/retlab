<script lang="ts">
	import { Dialog, type DialogContentPropsWithoutHTML } from "bits-ui";
	import XIcon from "phosphor-svelte/lib/X";
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		children,
		showCloseIcon = true,
		trigger,
		title,
		description,
		footer,
		interactionOutsideBehavior,
		...restProps
	}: Dialog.RootProps & {
		showCloseIcon?: boolean;
		trigger: Snippet;
		title: Snippet;
		description?: Snippet;
		footer?: Snippet;
		interactionOutsideBehavior?: DialogContentPropsWithoutHTML["interactOutsideBehavior"];
	} = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	{@render trigger()}

	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			interactOutsideBehavior={interactionOutsideBehavior ?? "close"}
			class="fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] space-y-4 border-2 bg-background p-5 shadow-sshadow outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-[490px] md:w-full"
		>
			<div class="flex flex-col gap-1 text-center sm:text-start">
				<Dialog.Title class="font-serif text-2xl font-bold">
					{@render title()}
				</Dialog.Title>
				{#if description}
					<Dialog.Description class="text-sm text-muted-foreground">
						{@render description()}
					</Dialog.Description>
				{/if}
			</div>

			{#if showCloseIcon}
				<Dialog.Close
					class="absolute top-4 right-4 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden"
				>
					<div>
						<XIcon class="size-5 text-foreground" />
						<span class="sr-only">Close</span>
					</div>
				</Dialog.Close>
			{/if}

			{@render children?.()}

			{#if footer}
				<div class="flex flex-col-reverse gap-1 sm:flex-row sm:justify-end">
					{@render footer()}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
