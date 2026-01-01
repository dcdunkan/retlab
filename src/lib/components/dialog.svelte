<script lang="ts">
	import type { Snippet } from "svelte";
	import { Dialog } from "bits-ui";
	import XIcon from "phosphor-svelte/lib/X";

	type Props = Dialog.RootProps & {
		buttonText: string;
		title: Snippet;
		description: Snippet;
		// ...other component props if you wish to pass them
	};

	let {
		open = $bindable(false),
		children,
		buttonText,
		title,
		description,
		...restProps
	}: Props = $props();
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Trigger>
		{buttonText}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Content
			class="fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] border-2 bg-background p-5 shadow-sshadow outline-hidden sm:max-w-[490px] md:w-full"
		>
			<Dialog.Title>
				{@render title()}
			</Dialog.Title>
			<Dialog.Description>
				{@render description()}
			</Dialog.Description>
			{@render children?.()}

			<Dialog.Close
				class="absolute top-5 right-5 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden"
			>
				<div>
					<XIcon class="size-5 text-foreground" />
					<span class="sr-only">Close</span>
				</div>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
