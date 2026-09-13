<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import Checkbox from "$lib/components/checkbox.svelte";
	import Switch from "$lib/components/switch.svelte";
	import { toast } from "svelte-sonner";
	import type { PageProps } from "./$types";
	import type { ThemeDeclaration } from "./+page.server";
	import Input from "$lib/components/input.svelte";
	import Inspector from "./inspector.svelte";
	import AdvancedInspector from "./advanced-inspector.svelte";

	let { data }: PageProps = $props();

	function group(
		map: Record<string, ThemeDeclaration>
	): Record<ThemeDeclaration["type"], ThemeDeclaration[]> {
		return Object.entries(map).reduce(
			(rmap, [, token]) => {
				rmap[token.type] ??= [];
				rmap[token.type].push(token);
				return rmap;
			},
			{} as Record<ThemeDeclaration["type"], ThemeDeclaration[]>
		);
	}

	let ref = $state<HTMLInputElement | null>(null);
</script>

<svelte:head>
	<title>Ret Canvas!</title>
</svelte:head>

<AdvancedInspector />

<section>
	<h2 class="scroll-m-14 text-2xl">Buttons</h2>

	<div>
		<Button data-inspectable data-inspectable-name="Default button">Default</Button>
		<Button data-inspectable data-inspectable-name="Destructive button" variant="destructive">
			Destructive
		</Button>
		<Button variant="outline">Outline</Button>
		<Button variant="ghost">Ghost</Button>
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Switch</h2>
	<div>
		<Switch checked />
		<Switch checked={false} />
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Checkbox</h2>
	<div>
		<Checkbox checked />
		<Checkbox checked={false} />
		<Checkbox indeterminate />
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Dang</h2>
	<div class="space-y-2">
		<Input bind:ref type="text" placeholder="Type something here" />
		<Inspector {ref} />
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Input</h2>
	<div>
		<Input type="text" placeholder="Type something here" />
		<Input type="number" placeholder="Values" />
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Toasts</h2>
	<div class="space-y-2 space-x-1">
		<Button
			variant="outline"
			onclick={() => toast("Hello", { description: "Gum would be perfection" })}
		>
			Default toast
		</Button>
		<Button
			variant="outline"
			onclick={() => toast.info("Hello", { description: "How you doin'?" })}
		>
			Info toast
		</Button>
		<Button
			variant="outline"
			onclick={() => toast.loading("Hello", { description: "He's a trans...he's a TRANSPONSTER" })}
		>
			Loading toast
		</Button>
		<Button
			variant="outline"
			onclick={() => toast.success("Hello", { description: "See! He's her lobster!" })}
		>
			Success toast
		</Button>
		<Button variant="outline" onclick={() => toast.warning("Hello", { description: "PIVOT!" })}>
			Warning toast
		</Button>
		<Button
			variant="destructive"
			onclick={() => toast.error("Hello", { description: "THAT'S NOT EVEN A WORD!" })}
		>
			Error toast
		</Button>
	</div>
</section>

<section>
	<h2 class="scroll-m-14 text-2xl">Colors</h2>

	{#each data.themes as theme, i (`theme-${i}`)}
		<div class="space-y-4">
			{#each theme.variants as variant (`theme-${i}-${variant.mode}`)}
				<div class="space-y-2">
					<h3 class="scroll-m-14 text-xl">{theme.name} ({variant.mode})</h3>
					{#each Object.entries(group(variant.theme)) as [groupType, tokens] (`theme-${i}-${variant.mode}-${groupType}`)}
						<div class="space-y-2">
							<h4 class="scroll-m-14 text-lg capitalize">{groupType}</h4>
							<div class="flex flex-wrap gap-1">
								{#each tokens as token (`${token.type}-${token.name}`)}
									{#if token.type === "color"}
										<button
											class="flex place-items-center gap-1 border px-1 py-1 text-sm hover:bg-foreground/10"
											onclick={async () => {
												await navigator.clipboard.writeText(token.value);
												toast("Copied to clipboard!", {
													description: token.value,
													icon: () => "",
													style: `--token-color-for-toast: ${token.value}`,
													classes: {
														icon: "border bg-[var(--token-color-for-toast)]"
													}
												});
											}}
										>
											<span style:background-color={token.value} class="aspect-square size-4 border"
											></span>
											{token.name}
										</button>
									{:else if token.type === "font"}
										<button class="space-x-1 border px-2 py-1 text-left text-sm">
											<b>{token.name}:</b>
											{#each token.fonts as font, i (`font-${i}`)}
												<span style:font-family={font}>
													{font}{i !== token.fonts.length - 1 ? "," : ""}
												</span>
											{/each}
										</button>
									{:else if token.type === "spacing"}
										<button class="border px-2 py-1 text-sm">
											<b>{token.name}:</b>
											<span class="font-mono">
												{#if typeof token.value === "string"}
													{token.value}
												{:else}
													{token.value.number} {token.value.unit}
												{/if}
											</span>
										</button>
									{:else if token.type === "shadow"}
										<button
											class="border px-2 py-1 text-left text-sm"
											style:box-shadow={token.value}
										>
											<b>{token.name}:</b><br />
											<span class="font-mono text-xs">
												{token.value}
											</span>
										</button>
									{:else if token.type === "radius"}
										{@const stringified =
											typeof token.value === "string"
												? token.value
												: token.value.number + token.value.unit}
										<button class="border px-2 py-1 text-sm" style:border-radius={stringified}>
											<b>{token.name}:</b>
											<span class="font-mono">
												{#if typeof token.value === "string"}
													{token.value}
												{:else}
													{token.value.number} {token.value.unit}
												{/if}
											</span>
										</button>
									{:else}
										<button class="border px-2 py-1 text-sm">Broken script!</button>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/each}
</section>

<div class="h-[50vh]"></div>
