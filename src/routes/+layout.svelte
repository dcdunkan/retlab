<script lang="ts">
	import "../app.css";
	import type { LayoutProps } from "./$types";

	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import InfoIcon from "phosphor-svelte/lib/InfoIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import WarningIcon from "phosphor-svelte/lib/WarningIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	import { onMount } from "svelte";
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "svelte-sonner";

	let { children }: LayoutProps = $props();

	onMount(async () => {
		// Clear indexedDB databases:
		const databases = await indexedDB.databases();
		for (const database of databases) {
			if (database.name != null) indexedDB.deleteDatabase(database.name);
		}
	});
</script>

<!-- <svelte:window
	onbeforeinstallprompt={(event) => {
		event.preventDefault();
		deferredInstallPromptEvent.set(
			// @ts-expect-error not yet a standard, understandable
			event
		);
	}}
/> -->

<ModeWatcher defaultMode="system" />

<Toaster
	position="bottom-right"
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				"border-2 px-3 py-2 bg-background w-[356px] flex items-center gap-2 place-items-center cursor-default",
			title: "font-bold font-serif text-base",
			description: "text-xs font-sans",
			icon: "size-5 justify-start relative flex shrink-0 items-center",

			loader: "",

			loading: "bg-background text-foreground shadow-block-shadow",
			success: "bg-success text-success-foreground shadow-success-block-shadow",
			error: "bg-error text-error-foreground shadow-error-block-shadow",
			warning: "text-warning-foreground bg-warning shadow-warning-block-shadow",
			info: "bg-info text-info-foreground shadow-info-block-shadow"
		}
	}}
>
	{#snippet infoIcon()}
		<InfoIcon size={20} weight="bold" />
	{/snippet}
	{#snippet successIcon()}
		<CheckIcon size={20} weight="bold" />
	{/snippet}
	{#snippet loadingIcon()}
		<SpinnerIcon size={20} weight="bold" class="animate-spin" />
	{/snippet}
	{#snippet errorIcon()}
		<XIcon size={20} weight="bold" class="animate-pulse" />
	{/snippet}
	{#snippet warningIcon()}
		<WarningIcon size={20} weight="bold" class="animate-pulse" />
	{/snippet}
</Toaster>

{@render children()}
