<script lang="ts">
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<div class="mx-auto flex min-h-screen max-w-prose flex-col justify-center p-4">
	{@render children()}
</div>
