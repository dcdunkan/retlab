<script module>
	const Piece = {
		HOME: "home",
		ATTENDANCE: "attendance",
		ASSIGNMENTS: "assignments",
		SETTINGS: "settings"
	};
</script>

<script lang="ts">
	import { page } from "$app/state";
	import type { LayoutProps } from "./$types";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";

	let { children }: LayoutProps = $props();

	let pieces: {
		label: string;
		href: Pathname;
	}[] = $derived(
		page.route.id == "/(auth)/attendance"
			? [
					{ label: Piece.HOME, href: "/" },
					{ label: Piece.ATTENDANCE, href: "/attendance/" }
				]
			: page.route.id === "/(auth)/assignments"
				? [
						{ label: Piece.HOME, href: "/" },
						{ label: Piece.ASSIGNMENTS, href: "/assignments/" }
					]
				: page.route.id == "/(auth)"
					? [{ label: Piece.HOME, href: "/" }]
					: page.route.id == "/(auth)/settings"
						? [{ label: Piece.SETTINGS, href: "/settings/" }]
						: [{ label: Piece.HOME, href: "/" }]
	);
</script>

<div class="min-h-screen w-full">
	<nav class="sticky top-0 z-50 border-b-2 bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between px-4 py-2">
			<div>
				{#each pieces as piece, i (i)}
					{#if i == pieces.length - 1}
						<span>{piece.label}</span>
					{:else}
						<span class="text-muted-foreground">
							<a class="hover:bg-foreground/10" href={resolve(piece.href)}>{piece.label}</a> /&nbsp;
						</span>
					{/if}
				{/each}
			</div>
			{#if page.route.id !== "/(auth)/settings"}
				<a class="hover:bg-foreground/10" href={resolve("/settings/")}>settings</a>
			{:else}
				<a class="hover:bg-foreground/10" href={resolve("/")}>home</a>
			{/if}
		</div>
	</nav>
	<main class="mx-auto max-w-prose space-y-6 p-4">
		{@render children()}
	</main>
</div>
