<script lang="ts" module>
	import type { ClassValue } from "svelte/elements";
	import ContentTree from "./content-tree.svelte";
	export type Tree = {
		id: string;
		level: number;
		title: string;
		element: HTMLHeadingElement;
		parent: Tree | null;
		children: Tree[];
	};
</script>

<script lang="ts">
	let {
		tree,
		onClick,
		activeHeading,
		class: className
	}: {
		tree: Tree[];
		activeHeading?: string;
		class?: ClassValue;
		onClick?: (element: Tree) => void;
	} = $props();
</script>

<div class={className}>
	{#each tree as t, i (i)}
		<button
			class={["block flex-nowrap text-sm", activeHeading === t.id ? "font-bold" : ""]}
			onclick={() => onClick?.(t)}
		>
			{t.title}
		</button>
		{#if t.children.length}
			<ContentTree
				class={["border-l-2 border-l-foreground/10 pl-4"]}
				tree={t.children}
				{onClick}
				{activeHeading}
			/>
		{/if}
	{/each}
</div>
