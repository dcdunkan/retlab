<script lang="ts">
	import { afterNavigate } from "$app/navigation";
	import { Popover } from "bits-ui";
	import { setMode, userPrefersMode } from "mode-watcher";
	import { onDestroy, onMount, tick } from "svelte";
	import { SvelteMap } from "svelte/reactivity";
	import type { LayoutProps } from "./$types";

	import SearchInput from "$lib/components/search-input.svelte";
	import ListMagnifyingGlassIcon from "phosphor-svelte/lib/ListMagnifyingGlassIcon";
	import PaletteIcon from "phosphor-svelte/lib/PaletteIcon";
	import ContentTree, { type Tree } from "./content-tree.svelte";

	let { children }: LayoutProps = $props();

	let activeSectionId = $state<string>();
	let activeHeading = $state<string>("");
	const slugs = new SvelteMap<string, number>();
	let navigationBarElement = $state<HTMLDivElement>();
	let sectionIntersectionObserver = $state<IntersectionObserver>();
	let tree = $state<Tree[] | null>(null);
	// const timers = new WeakMap();
	let activeTimer = $state<NodeJS.Timeout>();

	function toPx(value: string, ref: number): number {
		if (value.endsWith("px")) return parseFloat(value);
		if (value.endsWith("%")) return (parseFloat(value) / 100) * ref;
		return 0;
	}

	function drawRootMargin(rootMargin: string, elementId: string) {
		const el = document.getElementById(elementId);
		if (el == null) {
			console.error("draw root margin was called, but no element found with given id");
			return;
		}

		const parts = rootMargin.split(/\s+/);
		const [top, right = top, bottom = top, left = right] = parts;

		const w = window.innerWidth;
		const h = window.innerHeight;

		const mt = toPx(top, h);
		const mr = toPx(right, w);
		const mb = toPx(bottom, h);
		const ml = toPx(left, w);

		el.style.top = `${0 - mt}px`;
		el.style.left = `${0 - ml}px`;
		el.style.width = `${w + ml + mr}px`;
		el.style.height = `${h + mt + mb}px`;
	}

	function setupNavigation() {
		if (navigationBarElement == null) return;
		const firstWhitespace = navigationBarElement?.firstElementChild as HTMLElement;
		const lastWhitespace = navigationBarElement?.lastElementChild as HTMLElement;
		if (
			navigationBarElement == null ||
			firstWhitespace == null ||
			firstWhitespace.tagName !== "DIV" ||
			lastWhitespace == null ||
			lastWhitespace.tagName !== "DIV"
		)
			return;

		const navigationBarRect = navigationBarElement.getBoundingClientRect();

		if (firstWhitespace.nextElementSibling === lastWhitespace) {
			firstWhitespace.style.minWidth = "0px";
			lastWhitespace.style.minWidth = "0px";
		} else {
			const firstNav = firstWhitespace.nextElementSibling;
			const lastNav = lastWhitespace.previousElementSibling;
			if (firstNav == null || lastNav == null) return;

			const firstRect = firstNav.getBoundingClientRect();
			const lastRect = lastNav.getBoundingClientRect();

			const leftWidth = `${navigationBarRect.width / 2 - firstRect.width / 2 - 24}px`;
			const rightWidth = `${navigationBarRect.width / 2 - lastRect.width / 2 - 24}px`;
			firstWhitespace.style.minWidth =
				firstWhitespace.style.maxWidth =
				firstWhitespace.style.width =
					leftWidth;
			lastWhitespace.style.minWidth =
				lastWhitespace.style.maxWidth =
				lastWhitespace.style.width =
					rightWidth;
		}
	}

	async function pageSetup() {
		// setup section observer
		sectionIntersectionObserver?.disconnect();
		slugs.clear();

		await tick(); // waiting for h2

		const headings = document
			.querySelectorAll<HTMLHeadingElement>("h2, h3, h4, h5, h6")
			.values()
			.toArray()
			.map<Tree>((element) => {
				const level = Number(element.tagName.slice(1));
				const title = element.textContent;

				if (element.id === "") {
					const baseSlug =
						"h-" +
						title
							.trim()
							.normalize("NFD")
							.toLowerCase()
							.replaceAll(/[^\w]/g, "-")
							.replaceAll(/\s/g, "-")
							.replaceAll(/-{2,}/g, "-")
							.replaceAll(/^-|-$/g, "");
					const count = slugs.get(baseSlug) ?? 0;
					const slug = baseSlug + (count === 0 ? "" : `_${count}`);
					element.id = slug;
					slugs.set(baseSlug, count + 1);
				}

				return { id: element.id, level, title, element, children: [], parent: null };
			});

		const TOP_LEVEL_HEADING_LEVEL = 2;
		if (headings.length === 0) {
			tree = [];
		} else if (headings.at(0)?.level === TOP_LEVEL_HEADING_LEVEL) {
			tree = [];
			const stack: Tree[] = [];
			for (const node of headings) {
				while (stack.length > 0 && stack[stack.length - 1]!.level >= node.level) stack.pop();
				if (stack.length === 0) tree.push(node);
				else stack[stack.length - 1].children.push({ ...node, parent: stack[stack.length - 1] });
				stack.push(node);
			}
		} else {
			tree = null;
		}

		if (tree != null) {
			await tick();

			setupNavigation();
			window.addEventListener("resize", setupNavigation);

			const headerOffset = 54;
			const contentSpacing = 28; // NOTE: keep it to the smallest height of headings. (h4 or something)
			const extraHeight = 0;
			const areaHeight = contentSpacing + extraHeight;
			const stableHeight = window.visualViewport?.height ?? window.innerHeight;
			const rootMargin = `-${headerOffset}px 0px -${stableHeight - headerOffset - areaHeight}px 0px`;

			sectionIntersectionObserver = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						// if (activeTimer != null) {
						// 	console.log(
						// 		`%cclearing timeout ${activeTimer}%c ${entry.target.id}`,
						// 		"color: magenta"
						// 	);
						// 	// clearTimeout(activeTimer);
						// }

						if (entry.isIntersecting) {
							// const rect = entry.target.getBoundingClientRect();
							// console.log("i", entry.target.id, rect);

							// todo: if new thing is intersecting, but mine still hasn't exited

							activeHeading = entry.target.id;

							// if (activeSectionId === entry.target.id) continue;

							let headingIndex = headings.findIndex((h) => h.id === entry.target.id);

							// if (headingIndex > 0) {
							// 	const prevHeading = headings[headingIndex - 1];
							// 	const prevHeadingRect = prevHeading.element.getBoundingClientRect();

							// 	// console.log(prevHeadingRect.bottom, headerOffset + areaHeight);

							// 	const rectIntersectionHeight = prevHeadingRect.bottom - headerOffset;
							// 	const areaCovered = rectIntersectionHeight / areaHeight;

							// 	if (areaCovered > 0.7) {
							// 		console.log(prevHeading.id, "should stay");
							// 		activeHeading = prevHeading.id;
							// 	} else {
							// 		console.warn("COME INTO VIEW");
							// 	}

							// 	// if (prevHeadingRect.bottom > headerOffset + areaHeight / 2) {
							// 	// 	activeHeading = prevHeading.id;
							// 	// } else {
							// 	// 	activeHeading = entry.target.id;
							// 	// }
							// }

							console.log(`%c${entry.target.id}%c`, "color: yellow", "color: none");

							while (headingIndex > 0 && headings[headingIndex].level !== TOP_LEVEL_HEADING_LEVEL)
								headingIndex--;
							if (headingIndex >= 0 && headings[headingIndex].level === 2) {
								const h2 = headings[headingIndex];

								activeSectionId = h2.id;
								console.log(
									`%c${activeSectionId}%c`,
									"color: red; font-weight: bold",
									"color: none"
								);

								const target = h2.element;

								clearTimeout(activeTimer);
								activeTimer = setTimeout(() => {
									console.log(`%ctimer fired for%c ${target.id}`, "color: green;");
									const button = navigationBarElement?.querySelector<HTMLButtonElement>(
										`button[data-section-id=${target.id}]`
									);

									if (button && navigationBarElement) {
										const buttonRect = button.getBoundingClientRect();
										const navRect = navigationBarElement.getBoundingClientRect();
										console.log(button.dataset);
										navigationBarElement.scrollTo({
											left:
												navigationBarElement.scrollLeft +
												buttonRect.left -
												navRect.left -
												navRect.width / 2 +
												buttonRect.width / 2,
											behavior: "smooth"
										});
									}
								}, 400);

								// timers.set(target, timeout);
								console.log(`%ctimer set for%c ${target.id}`, "color: skyblue;");
							}
						} else {
							// console.log([...activeHeadings].join(" "));
							// activeHeadings.delete(entry.target.id);
							const rect = entry.target.getBoundingClientRect();
							// console.log("o", entry.target.id, rect);

							// section exited out of the margin, through bottom (scrolling up, entered previous content)
							if (rect.top > headerOffset) {
								console.log("%cshould switch to top%c", "font-style: italic");

								let headingIndex = headings.findIndex((h) => h.id === entry.target.id);
								if (headingIndex < 0) continue;

								if (headingIndex > 0) {
									const prevHeading = headings[headingIndex - 1];
									activeHeading = prevHeading.id;
									// if (activeHeadingId !== prevHeading.id) {
									// 	activeHeadingId = prevHeading.id;
									// }
								}

								// skip until h2
								while (
									headingIndex > 0 &&
									headings[headingIndex - 1].level !== TOP_LEVEL_HEADING_LEVEL
								) {
									headingIndex--;
								}

								const prevH2 = headings[headingIndex - 1];

								if (activeSectionId !== prevH2.id) {
									activeSectionId = prevH2.id;

									if (prevH2.level === TOP_LEVEL_HEADING_LEVEL) {
										clearTimeout(activeTimer);
										activeTimer = setTimeout(() => {
											console.log(
												`%ctimer fired for%c ${prevH2.id} by non-intesection`,
												"color: green;"
											);
											const button = navigationBarElement?.querySelector<HTMLButtonElement>(
												`button[data-section-id=${prevH2.id}]`
											);
											if (button && navigationBarElement) {
												const buttonRect = button.getBoundingClientRect();
												const navRect = navigationBarElement.getBoundingClientRect();
												navigationBarElement.scrollTo({
													left:
														navigationBarElement.scrollLeft +
														buttonRect.left -
														navRect.left -
														navRect.width / 2 +
														buttonRect.width / 2,
													behavior: "smooth"
												});
											}
										}, 400);

										// timers.set(prevH2.element, timeout);
										console.log(
											`%ctimer set for%c ${prevH2.id} by non-intesection`,
											"color: skyblue;"
										);
									}
								}
							}
						}
					}
				},
				{ rootMargin: rootMargin, threshold: 0 }
			);

			drawRootMargin(rootMargin, "debug-root-margin");
			window.addEventListener("resize", () => drawRootMargin(rootMargin, "debug-root-margin"));

			for (const heading of headings) {
				sectionIntersectionObserver.observe(heading.element);
			}
		}
	}

	onMount(pageSetup);
	afterNavigate(pageSetup);

	onDestroy(() => sectionIntersectionObserver?.disconnect());
</script>

<!-- todo: make it visible in canvas -->
<div id="debug-root-margin" class="visible"></div>

<div class="flex min-h-screen w-full flex-col">
	<nav class="sticky top-0 z-50 border-b-2 bg-background/50 backdrop-blur-lg">
		<div class="mx-auto flex max-w-prose place-items-center justify-between px-4 py-2">
			<div class="font-bold">
				<PaletteIcon weight="bold" />
			</div>
			<div class="flex gap-2 text-sm">
				<button
					class={[userPrefersMode.current === "system" && "underline decoration-2"]}
					onclick={() => setMode("system")}
				>
					System
				</button>
				<button
					class={[userPrefersMode.current === "light" && "underline decoration-2"]}
					onclick={() => setMode("light")}
				>
					Light
				</button>
				<button
					class={[userPrefersMode.current === "dark" && "underline decoration-2"]}
					onclick={() => setMode("dark")}
				>
					Dark
				</button>
			</div>
		</div>
	</nav>

	<main class="mx-auto flex w-full max-w-prose grow flex-col px-4 py-4">
		<div class="w-full grow space-y-6 *:space-y-2">
			{@render children()}
		</div>

		<footer class="px-4 py-2">
			<div class="text-center text-xs font-medium text-muted-foreground">
				ret commit <a
					target="_blank"
					href="https://github.com/dcdunkan/retlab/tree/{__GIT_SHA__}"
					class="underline hover:text-ret-accent"
				>
					{__GIT_SHORT_SHA__}
				</a>
			</div>
		</footer>
	</main>

	<nav class="sticky bottom-0 z-50 border-t-2 bg-background/50 backdrop-blur-lg">
		<div class="relative mx-auto w-full max-w-prose">
			<!-- <button
				class="absolute top-1/2 left-0 z-10 mx-2 aspect-square -translate-y-1/2 border-2 bg-background p-1"
			>
				<ListMagnifyingGlassIcon class="size-5" weight="bold" />
			</button> -->

			<Popover.Root>
				<Popover.Trigger
					class="absolute top-1/2 left-0 z-10 mx-2 aspect-square -translate-y-1/2 border-2 bg-background p-1"
				>
					<ListMagnifyingGlassIcon class="size-5" weight="bold" />
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Overlay
						class="fixed inset-0 z-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
					/>
					<Popover.Content
						side="top"
						sideOffset={8}
						align="start"
						class="z-60 w-full max-w-[90vw] border-2 bg-background p-3 shadow-block-shadow data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
					>
						<div class="flex h-full flex-col space-y-2">
							<div class="font-serif text-sm font-bold uppercase italic">On this page</div>

							<!-- todo: come back to this and make it look nice -->
							<div class="max-h-[60vh] overflow-y-scroll">
								{#if tree != null}
									<ContentTree
										{tree}
										onClick={(tree) => {
											tree.element.scrollIntoView({ behavior: "smooth", block: "start" });
										}}
										{activeHeading}
									/>
								{/if}
							</div>

							<SearchInput placeholder="Search for stuff..." />
						</div>

						<!-- <Popover.Close>Close</Popover.Close> -->
						<Popover.Arrow />
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>

			<div
				bind:this={navigationBarElement}
				class="fade-edges no-scrollbar flex snap-x snap-proximity place-items-center gap-2 overflow-x-auto px-4 py-2"
			>
				<!-- <div class=" w-max snap-x snap-proximity flex-nowrap gap-2"> -->
				<div class="h-px"></div>
				{#each tree as topHeading (topHeading.id)}
					<button
						data-section-id={topHeading.id}
						class={[
							"whitespace-nowrap",
							activeSectionId === topHeading.id ? "font-bold" : "font-normal"
						]}
						onclick={(e) => {
							topHeading.element.scrollIntoView({ behavior: "smooth", block: "start" });
							// const sectionRect = section.element.getBoundingClientRect();
							// const parentRect = section.element.parentElement!.getBoundingClientRect();
							// window.scrollTo({
							// 	behavior: "smooth",
							// 	top: topHeading.element.parentElement!.scrollTop + sectionRect.top - parentRect.top
							// });

							// const button = e.currentTarget;
							const buttonRect = e.currentTarget.getBoundingClientRect();
							const navRect = navigationBarElement!.getBoundingClientRect();

							clearTimeout(activeTimer);
							activeTimer = setTimeout(() => {
								// activeHeadings.clear();
								activeSectionId = topHeading.id;
								navigationBarElement?.scrollTo({
									left:
										navigationBarElement.scrollLeft +
										buttonRect.left -
										navRect.left -
										navRect.width / 2 +
										buttonRect.width / 2,
									behavior: "smooth"
								});
							}, 400);
							// timers.set(button, timer);
						}}
					>
						{topHeading.title}
					</button>
				{/each}
				<div class="h-px"></div>
				<!-- </div> -->
			</div>
		</div>
	</nav>
</div>

<style>
	#debug-root-margin {
		position: fixed;
		pointer-events: none;
		border: 2px dashed red;
		z-index: 999999;
	}

	.fade-edges {
		mask-image: linear-gradient(
			to right,
			transparent,
			black calc(32px),
			black calc(100% - 32px),
			transparent
		);
	}
</style>
