<script lang="ts">
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	import { Checkbox, type WithoutChildrenOrChild } from "bits-ui";
	import clsx from "clsx";

	let { class: className, ...restProps }: WithoutChildrenOrChild<Checkbox.RootProps> = $props();
</script>

<Checkbox.Root
	class={clsx(
		"group relative inline-flex size-5 shrink-0 border-2 transition-all duration-75 data-disabled:opacity-60 data-[state=checked]:bg-emerald-400 data-[state=unchecked]:bg-red-400",
		className
	)}
	{...restProps}
>
	<CheckIcon
		class="absolute inset-0 size-full transition-all duration-150 group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-0"
		weight="bold"
	/>
	<XIcon
		class="absolute inset-0 size-full transition-all duration-150 group-data-[state=checked]:opacity-0 group-data-[state=unchecked]:text-white group-data-[state=unchecked]:opacity-100"
		weight="bold"
	/>
</Checkbox.Root>
