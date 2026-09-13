<script lang="ts">
	import BackspaceIcon from "phosphor-svelte/lib/BackspaceIcon";
	import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";

	let {
		placeholder = "",
		value = $bindable("")
	}: {
		placeholder?: string;
		value?: string;
	} = $props();
</script>

<div class="relative flex w-full items-center">
	<MagnifyingGlassIcon
		weight="bold"
		class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 transform"
	/>
	<input
		bind:value
		{placeholder}
		class="h-9 w-full min-w-0 border-2 bg-transparent px-8 py-1 text-sm shadow-block-shadow transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-ret-destructive aria-invalid:ring-3 aria-invalid:ring-ret-destructive/20 md:text-sm"
	/>
	<button
		class="absolute top-1/2 right-2.5 -translate-y-1/2 transform p-0"
		onclick={() => (value = "")}
	>
		<BackspaceIcon weight="bold" class="size-4" />
	</button>
</div>
