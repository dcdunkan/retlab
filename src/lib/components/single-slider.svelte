<script lang="ts">
	import { Slider } from "bits-ui";

	let {
		value = $bindable(),
		...restProps
	}: {
		value: number;
		min?: number;
		max?: number;
		step?: number;
	} = $props();
</script>

<Slider.Root
	type="single"
	bind:value
	class="relative flex w-full touch-none items-center select-none"
	{...restProps}
>
	<span
		class="relative h-3 w-full grow cursor-pointer overflow-hidden border-2 border-border bg-background"
	>
		<Slider.Range class="absolute h-full bg-foreground" />
	</span>
	<Slider.Thumb index={0} class="block size-4 cursor-pointer border-2 bg-background shadow-sm" />
</Slider.Root>
