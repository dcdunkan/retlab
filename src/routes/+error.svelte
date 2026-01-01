<script lang="ts">
	import { page } from "$app/state";
</script>

<div class="flex h-screen w-full flex-col items-center justify-center border-2 p-4 text-center">
	<div class="text-3xl font-bold">{page.status}</div>
	<div class="font-serif">{page.error?.message}</div>
</div>
