<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import type { LayoutProps } from "./$types";

	import WarningIcon from "phosphor-svelte/lib/Warning";
	import InfoIcon from "phosphor-svelte/lib/Info";
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";
	import CheckIcon from "phosphor-svelte/lib/Check";
	import XIcon from "phosphor-svelte/lib/X";

	let { children }: LayoutProps = $props();

	import { Toaster } from "svelte-sonner";
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster
	position="bottom-right"
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				"border-2 px-3 py-2 bg-background w-[356px] flex items-center gap-2 place-items-center cursor-default shadow-sshadow",
			title: "font-bold font-serif font-sm",
			description: "text-xs",
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
