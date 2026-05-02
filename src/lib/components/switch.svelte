<script lang="ts">
	import { Switch, useId, type WithoutChildrenOrChild } from "bits-ui";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	let {
		id = useId(),
		checked = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<Switch.RootProps> & {
		// labelText?: string;
	} = $props();

	// some size info backups, if needs to be changed later:
	// root: h-6 min-h-6 w-11; thumb: size-4 checked:x-5.5 unchecked:x-0.5
</script>

<Switch.Root
	bind:checked
	bind:ref
	{id}
	{...restProps}
	class="inline-flex h-6 min-h-6 w-11 shrink-0 cursor-pointer items-center border-2 transition-colors focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-200 data-[state=unchecked]:bg-red-200"
>
	<Switch.Thumb
		class="group pointer-events-none flex size-4 shrink-0 border-2 bg-red-400 transition-all data-[state=checked]:translate-x-5.5 data-[state=checked]:bg-emerald-400 data-[state=unchecked]:translate-x-0.5"
	>
		<CheckIcon
			class="absolute size-3 h-full w-full transition-all duration-75 group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-0"
			weight="bold"
		/>
		<XIcon
			class="absolute size-3 h-full w-full transition-all duration-75 group-data-[state=checked]:opacity-0 group-data-[state=unchecked]:text-white group-data-[state=unchecked]:opacity-100"
			weight="bold"
		/>
	</Switch.Thumb>
</Switch.Root>
