<script lang="ts">
	import HandWavingIcon from "phosphor-svelte/lib/HandWavingIcon";
	import BookOpenIcon from "phosphor-svelte/lib/BookOpenIcon";
	import MoonStarsIcon from "phosphor-svelte/lib/MoonStarsIcon";
	import SunIcon from "phosphor-svelte/lib/SunIcon";

	import { resolve } from "$app/paths";
	import Button from "$lib/components/button.svelte";
	import { mode, toggleMode } from "mode-watcher";

	let { children } = $props();
</script>

<div class="min-h-screen w-full">
	<nav class="sticky top-0 z-50 border-b-2 border-border bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between gap-4 px-4 py-2">
			<div class="flex grow place-items-center gap-2">
				<HandWavingIcon weight="bold" class="shrink-0" />
				the-end?
			</div>

			<div class="flex place-items-center gap-2">
				<Button size="icon-xsm" variant="ghost" shadow="none" href={resolve("/docs")}>
					<BookOpenIcon weight="bold" />
				</Button>
				<Button
					size="icon-xsm"
					variant="ghost"
					shadow="none"
					onclick={() => {
						toggleMode(); // todo: make it a popover theme selector, include "system" as well
					}}
				>
					{#if mode.current === "light"}
						<MoonStarsIcon weight="fill" />
					{:else}
						<SunIcon weight="fill" />
					{/if}
				</Button>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-prose grow space-y-6 px-4 pt-4">
		<article class="docs space-y-6">
			<!-- <section class="space-y-3">
				<h1 class="font-black">The end?</h1>
			</section> -->

			{@render children()}
		</article>
	</main>

	<footer class="mt-6 px-4 pb-4">
		<div class="text-center text-xs font-medium text-muted-foreground/50">
			ret commit <a
				target="_blank"
				href="https://github.com/dcdunkan/retlab/tree/{__GIT_SHA__}"
				class="underline decoration-wavy underline-offset-2 hover:text-ret-accent/50"
			>
				{__GIT_SHORT_SHA__}
			</a>
		</div>
	</footer>

	<div class="h-[25svh]"></div>
</div>
