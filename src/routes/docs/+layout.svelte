<script lang="ts">
	import BookOpenIcon from "phosphor-svelte/lib/BookOpenIcon";
	import MoonIcon from "phosphor-svelte/lib/MoonIcon";
	import SunIcon from "phosphor-svelte/lib/SunIcon";
	import TextAaIcon from "phosphor-svelte/lib/TextAaIcon";

	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { Pathname } from "$app/types";
	import Button from "$lib/components/button.svelte";
	import Timestamp from "$lib/components/timestamp.svelte";
	import { mode, toggleMode } from "mode-watcher";
	import { type Snippet } from "svelte";

	let { children }: { children: Snippet } = $props();

	const navigationLinks: {
		label: string;
		href: Pathname;
	}[] = [
		{ label: "Introduction", href: "/docs" },
		{ label: "Roadmap", href: "/docs/roadmap" },
		{ label: "Notification Server", href: "/docs/notifications" },
		{ label: "Web Access", href: "/docs/web-access" },
		{ label: "Cool Stuff", href: "/docs/cool-stuff" },
		{ label: "Release Notes", href: "/docs/release-notes" }
		// { label: "Source code", href: "https://github.com/dcdunkan/retlab" }
	];

	let currentPage = $derived.by<{
		title: string;
		label: string;
		href: Pathname;
		pieces: string[];
		details?: DocsDetails[string];
	}>(() => {
		if (page.params.tag != null && page.url.pathname === `/docs/release-notes/${page.params.tag}`) {
			return {
				title: `${page.params.tag} / Release Notes`,
				label: `${page.params.tag} &mdash; Release Notes`,
				href: `/docs/release-notes/${page.params.tag}`,
				pieces: ["docs", "release-notes"],
				details: __DOCS_DETAILS__[`/docs/release-notes/${page.params.tag}`]
			};
		}

		const n = navigationLinks.find((link) => link.href === page.url.pathname);
		if (n == null)
			return {
				title: "Introduction",
				label: "Introduction",
				href: "/docs",
				pieces: ["docs"],
				details: __DOCS_DETAILS__["/docs"]
			};
		return {
			...n,
			title: n.label,
			pieces: n.href.split("/").slice(1),
			details: __DOCS_DETAILS__[n.href]
		};
	});

	let articleFont = $state<"reader" | "sans">("sans");
	$effect.pre(() => {
		const storedFont = localStorage.getItem("docs-font");
		articleFont = storedFont === "reader" || storedFont === "sans" ? storedFont : "reader";
	});
</script>

<svelte:head>
	<script>
		try {
			const font = localStorage.getItem("docs-font");
			if (font === "reader" || font === "sans") document.documentElement.dataset.docsFont = font;
		} catch {}
	</script>
	<title>Docs / {currentPage.title} / Retlab</title>
</svelte:head>

<div class="min-h-screen w-full">
	<nav class="sticky top-0 z-50 border-b-2 border-border bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between gap-4 px-4 py-2">
			<div class="flex grow place-items-center gap-2">
				<BookOpenIcon weight="bold" class="shrink-0" />
				{#each currentPage.pieces as piece, i (i)}
					{#if i == currentPage.pieces.length - 1}
						<span class="font-semibold">{piece}</span>
					{:else}
						<span class="text-muted-foreground">
							<a
								class="hover:bg-foreground/10"
								href={resolve(
									("/" + currentPage.pieces.slice(0, i + 1).join("/")) as unknown as Pathname
								)}>{piece}</a
							>&nbsp;/</span
						>
					{/if}
				{/each}
			</div>

			<div class="flex place-items-center gap-2">
				<Button
					size="icon-xsm"
					variant="ghost"
					shadow="none"
					onclick={() => {
						articleFont = articleFont === "reader" ? "sans" : "reader";
						document.documentElement.dataset.docsFont = articleFont;
						localStorage.setItem("docs-font", articleFont);
					}}
				>
					<TextAaIcon weight="bold" />
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
						<MoonIcon weight="fill" />
					{:else}
						<SunIcon weight="fill" />
					{/if}
				</Button>
				<a class="hover:bg-foreground/10" href={resolve("/")}>back to ret</a>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-prose grow space-y-6 px-4 pt-4">
		<article class="docs space-y-6">
			<section class="space-y-3">
				<h1 class="font-black">
					{#if page.url.pathname === `/docs/release-notes/${page.params.tag}`}
						{page.params.tag} &ndash; Release notes
					{:else}
						{currentPage?.label}
					{/if}
				</h1>

				<div class="flex flex-wrap gap-1">
					{#each navigationLinks as link, i (link.href)}
						{#if i > 0}
							&middot;
						{/if}
						<a
							href={resolve(link.href)}
							class="link"
							aria-disabled={link.href === page.url.pathname}>{link.label}</a
						>
					{/each}
				</div>
			</section>

			{@render children()}

			{#if currentPage.details != null}
				{@const date = new Date(currentPage.details.lastUpdatedAt)}
				<div class="text-sm text-muted-foreground">
					This page was last updated <Timestamp timestamp={date} />.
				</div>
			{/if}
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
