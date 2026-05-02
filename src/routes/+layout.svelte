<script lang="ts">
	import "../app.css";
	import type { LayoutProps } from "./$types";

	import WarningIcon from "phosphor-svelte/lib/WarningIcon";
	import InfoIcon from "phosphor-svelte/lib/InfoIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	let { children }: LayoutProps = $props();

	import { Toaster } from "svelte-sonner";
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<Toaster
	position="bottom-right"
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				"border-2 px-3 py-2 bg-background w-[356px] flex items-center gap-2 place-items-center cursor-default shadow-sshadow",
			title: "font-bold font-serif font-sm",
			description: "text-xs font-sans",
			icon: "size-5 justify-start relative flex shrink-0 items-center",

			loader: "",
			info: "bg-blue-100 text-blue-900",
			success: "bg-green-200 text-green-900",
			warning: "text-orange-600 bg-orange-100",
			error: "bg-red-200 text-red-900"
		}
	}}
>
	{#snippet infoIcon()}
		<InfoIcon size={20} />
	{/snippet}
	{#snippet successIcon()}
		<CheckIcon size={20} />
	{/snippet}
	{#snippet loadingIcon()}
		<SpinnerIcon size={20} class="animate-spin" />
	{/snippet}
	{#snippet errorIcon()}
		<XIcon size={20} />
	{/snippet}
	{#snippet warningIcon()}
		<WarningIcon size={20} />
	{/snippet}
</Toaster>

{@render children()}
