<script lang="ts">
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<div class="mx-auto max-w-prose p-8">
	{@render children()}
</div>
