<script lang="ts">
	import { resolve } from "$app/paths";
	import { type Pathname } from "$app/types";
	import type { Root } from "mdast";
	import { mode } from "mode-watcher";
	import sanitize from "sanitize-html";
	import box from "./box";
	import MdastRenderer from "./mdast-renderer.svelte";

	let { tree }: { tree: Root["children"] } = $props();
</script>

{#each tree as node, i (`${node.type}-${i}`)}
	{#if node.type === "blockquote"}
		<blockquote>
			<MdastRenderer tree={node.children} />
		</blockquote>
	{:else if node.type === "break"}
		<br />
	{:else if node.type === "code"}
		<!-- todo: syntax highlight as well -->
	{:else if node.type === "definition"}
		<!-- definitions -->
	{:else if node.type === "delete"}
		<s>
			<MdastRenderer tree={node.children} />
		</s>
	{:else if node.type === "emphasis"}
		<em>
			<MdastRenderer tree={node.children} />
		</em>
		<!-- {:else if node.type === "figure"}
		{#if node.child.type === "image"}
			<figure>
				<img
					src={IMAGE_URL_PREFIX + node.child.url}
					alt={node.child.alt}
					loading="lazy"
					decoding="async"
					data-caption={node.child.title}
				/>
				<figcaption>{node.child.title}</figcaption>
			</figure>
		{:else if node.child.type === "d2"}
			{#if node.child.diagram.type === "svg"}
				{@html node.child.diagram.raw}
			{:else}
				<box.Error>
					Node type not implemented: <code>{node.child.diagram.type}</code>
				</box.Error>
			{/if}
		{:else}
			<box.Error>
				Unexpected type of figure child: {JSON.stringify(node.child, null, 2)}
			</box.Error>
		{/if} -->
	{:else if node.type === "footnoteDefinition"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "footnoteReference"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "heading"}
		{#if node.depth === 1}
			<h1>
				<MdastRenderer tree={node.children} />
			</h1>
		{:else if node.depth === 2}
			<h2>
				<MdastRenderer tree={node.children} />
			</h2>
		{:else if node.depth === 3}
			<h3>
				<MdastRenderer tree={node.children} />
			</h3>
		{:else if node.depth === 4}
			<h4>
				<MdastRenderer tree={node.children} />
			</h4>
		{:else if node.depth === 5}
			<h5>
				<MdastRenderer tree={node.children} />
			</h5>
		{:else if node.depth === 6}
			<h6>
				<MdastRenderer tree={node.children} />
			</h6>
		{/if}
	{:else if node.type === "html"}
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html sanitize(node.value)}
		<!-- todo: investigate for a better way to output "truly" html -->
	{:else if node.type === "image"}
		<figure>
			<!-- {#if node.data?.darkUrl != null}
					<source srcset={node.data.darkUrl} media="(prefers-color-scheme: dark)" />
					<source srcset={node.url} media="(prefers-color-scheme: light)" />
				{/if} -->

			<picture>
				{#if mode.current === "dark" && node.data?.dark != null}
					<img
						src={node.data.dark.url}
						alt={node.alt}
						loading="lazy"
						decoding="async"
						data-caption={node.title}
						width={node.data.dark.width}
						height={node.data.dark.height}
					/>
				{:else}
					<img
						src={node.url}
						alt={node.alt}
						loading="lazy"
						decoding="async"
						data-caption={node.title}
						width={node.data?.width}
						height={node.data?.height}
					/>
				{/if}
			</picture>
			<figcaption>{node.title}</figcaption>
		</figure>
	{:else if node.type === "imageReference"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "inlineCode"}
		<code>{node.value}</code>
	{:else if node.type === "link"}
		<a target="_blank" title={node.title} href={resolve(node.url as unknown as Pathname)}>
			<MdastRenderer tree={node.children} />
		</a>
	{:else if node.type === "linkReference"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "list"}
		<!-- todo: node.spread -->
		{#if node.ordered === true}
			<ol start={node.start || 1}>
				<MdastRenderer tree={node.children} />
			</ol>
		{:else}
			<ul>
				<MdastRenderer tree={node.children} />
			</ul>
		{/if}
	{:else if node.type === "listItem"}
		<li class="list-item">
			<MdastRenderer tree={node.children} />
		</li>
	{:else if node.type === "paragraph"}
		<p>
			<MdastRenderer tree={node.children} />
		</p>
	{:else if node.type === "strong"}
		<strong>
			<MdastRenderer tree={node.children} />
		</strong>
	{:else if node.type === "table"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "tableCell"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "tableRow"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
	{:else if node.type === "text"}
		{node.value}
	{:else if node.type === "thematicBreak"}
		<hr />
	{:else if node.type === "yaml"}
		<box.Error>
			Node type not implemented: <code>{node.type}</code>
		</box.Error>
		<!-- {:else if node.type === "math"}
		{@html node.renderedString}
	{:else if node.type === "inlineMath"}
		{@html node.renderedString} -->
	{:else}
		<box.Error>
			Node type not implemented: {JSON.stringify(node, null, 2)}
		</box.Error>
	{/if}
{/each}
