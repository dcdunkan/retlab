<script lang="ts">
	import { Checkbox, type WithoutChildrenOrChild } from "bits-ui";
	import clsx from "clsx";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";

	let { class: className, ...restProps }: WithoutChildrenOrChild<Checkbox.RootProps> = $props();
</script>

<Checkbox.Root
	class={clsx(
		"group inline-flex size-5 shrink-0 border-2 transition-all duration-75 data-[state=checked]:bg-emerald-400",
		className
	)}
	{...restProps}
>
	<CheckIcon
		class="size-4 h-full w-full transition-all duration-150 group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:opacity-0"
		weight="bold"
	/>
</Checkbox.Root>
