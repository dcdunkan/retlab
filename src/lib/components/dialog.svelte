<script lang="ts">
	import { Dialog } from "bits-ui";
	import XIcon from "phosphor-svelte/lib/XIcon";
	import type { Snippet } from "svelte";
	import { buttonVariants } from "./button.svelte";

	let {
		open = $bindable(false),
		children,
		showCloseIcon = true,
		enableBorders = false,
		trigger,
		title,
		description,
		footer,
		interactOutsideBehavior,
		onOpenChange,
		onOpenChangeComplete,
		class: className,
		...restProps
	}: Dialog.RootProps &
		Omit<Dialog.ContentProps, "title"> & {
			enableBorders?: boolean;
			showCloseIcon?: boolean;
			trigger?: Snippet;
			title: Snippet;
			description?: Snippet;
			footer?: Snippet;
		} = $props();

	let contentRef = $state<HTMLDivElement>();
	let showScrollBorders = $state<"none" | "top" | "bottom" | "both">("none");
</script>

<Dialog.Root bind:open {onOpenChange} {onOpenChangeComplete}>
	{@render trigger?.()}

	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<Dialog.Content
			interactOutsideBehavior={interactOutsideBehavior ?? "close"}
			class={[
				"fixed top-[50%] left-[50%] z-50 max-h-[90svh] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
				"flex flex-col gap-4 border-2 bg-background p-5 shadow-sshadow",
				"outline-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
				"sm:max-w-122.5 md:w-full",
				className
			]}
			{...restProps}
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
					<div class={buttonVariants({ variant: "destructive", size: "icon-sm", shadow: "none" })}>
						<XIcon weight="bold" />
						<span class="sr-only">Close</span>
					</div>
				</Dialog.Close>
			{/if}

			{#if children != null}
				<div
					bind:this={contentRef}
					onscroll={() => {
						if (contentRef == null) {
							showScrollBorders = "none";
							return;
						}
						if (contentRef.scrollHeight <= contentRef.clientHeight) {
							showScrollBorders = "none";
							return;
						}
						const height = Math.abs(contentRef.scrollHeight - contentRef.clientHeight);
						const current = Math.round(contentRef.scrollTop);
						if (current === height) {
							showScrollBorders = "top";
						} else if (current === 0) {
							showScrollBorders = "bottom";
						} else {
							showScrollBorders = "both";
						}
					}}
					class={[
						"min-h-0 grow overflow-y-auto transition-all duration-150",
						enableBorders && "border-2 px-2 py-1",
						showScrollBorders === "none" ? "" : "border-t-2 border-b-2",
						showScrollBorders === "bottom"
							? "border-t-transparent"
							: showScrollBorders === "top"
								? "border-b-transparent"
								: ""
					]}
				>
					{@render children?.()}
				</div>
			{/if}

			{#if footer}
				<div class="flex flex-col-reverse gap-1 sm:flex-row sm:justify-end">
					{@render footer()}
				</div>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
