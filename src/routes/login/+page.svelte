<script lang="ts">
	import Box from "$lib/components/box";
	import { loginForm } from "./data.remote";
	import Button from "$lib/components/button.svelte";
	import { loginSchema } from "./login-schema";

	import HeartIcon from "phosphor-svelte/lib/HeartIcon";
	import SealWarningIcon from "phosphor-svelte/lib/SealWarningIcon";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Login to Retlab</title>
</svelte:head>

<section class="mb-6 flex place-items-start gap-2 border-2 border-amber-400 bg-amber-200 p-2">
	<SealWarningIcon weight="fill" size="1.5em" class="block shrink-0 text-amber-600" />
	<p class="text-xs font-medium text-amber-900">
		Retlab is under heavy construction at the moment. You may see features and tweaks come and go
		and work unreliably. I am currently working on bringing notifications support and PWA stuff.
		<b>DO NOT TRY THOSE YET even if you are prompted to do so.</b>
	</p>
</section>

<div class="mb-4 space-y-4">
	<h1 class="text-3xl">Login to Retlab</h1>
	<p>Login with your Etlab credentials to use Retlab.</p>
</div>

<form {...loginForm.preflight(loginSchema)} class="flex flex-col space-y-2">
	<div class="space-y-1">
		<select
			class="w-full"
			{...loginForm.fields.collegeId.as("select")}
			onchange={() => loginForm.validate({})}
		>
			<option disabled selected>Choose institution</option>
			{#each data.colleges as college (college.id)}
				<option value={`${college.id}`}>{college.name}</option>
			{/each}
		</select>
		<ul class="text-sm text-red-600">
			{#each loginForm.fields.collegeId.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-1">
		<input
			autocomplete="off"
			class="w-full"
			{...loginForm.fields.username.as("text")}
			placeholder="Username"
			oninput={() => loginForm.validate({})}
		/>
		<ul class="text-sm text-red-600">
			{#each loginForm.fields.username.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-1">
		<input
			autocomplete="off"
			class="w-full"
			{...loginForm.fields.password.as("password")}
			placeholder="Shhh..."
			oninput={() => loginForm.validate({})}
		/>
		<ul class="text-sm text-red-600">
			{#each loginForm.fields.password.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	{#if loginForm.fields.issues()?.length}
		<Box.Error>
			{#each loginForm.fields.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</Box.Error>
	{/if}

	<Button {...loginForm.fields.action.as("submit", "login")} disabled={!!loginForm.pending}>
		Login
	</Button>
</form>

<section class="mt-6 flex place-items-center gap-2 border-2 border-muted-foreground p-2">
	<HeartIcon weight="fill" size="2em" class="text-rose-600/70" />
	<div class="text-xs font-medium text-muted-foreground">
		Retlab is open-source btw! Checkout the source code on GitHub:
		<a href="https://github.com/dcdunkan/retlab" class="text-primary underline hover:text-blue-500">
			https://github.com/dcdunkan/retlab
		</a>. Any kind of help with the development is appreciated :)
	</div>
</section>
