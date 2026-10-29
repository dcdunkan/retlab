<script lang="ts">
	import AsteriskSimpleIcon from "phosphor-svelte/lib/AsteriskSimpleIcon";
	import AtIcon from "phosphor-svelte/lib/AtIcon";
	import GithubLogoIcon from "phosphor-svelte/lib/GithubLogoIcon";
	import GraduationCapIcon from "phosphor-svelte/lib/GraduationCapIcon";
	import HeartIcon from "phosphor-svelte/lib/HeartIcon";
	import KeyIcon from "phosphor-svelte/lib/KeyIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import { getLocalSubscription } from "$lib/browser";
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Combobox from "$lib/components/combobox.svelte";
	import Input from "$lib/components/input.svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import type { PageProps } from "./$types";
	import { loginForm } from "./data.remote";
	import { loginSchema } from "./login-schema";
	import { resolve } from "$app/paths";

	let { data }: PageProps = $props();

	onMount(async () => {
		try {
			const subscription = await getLocalSubscription();
			if (subscription != null) {
				await subscription.unsubscribe();
			}
		} catch {
			// ignore
		}
	});

	let isLoggingIn = $state(false);
</script>

<svelte:head>
	<title>Login to Retlab</title>
</svelte:head>

<div class="mb-4 space-y-2">
	<div class="flex place-items-end gap-2">
		<!-- <div class="">Login to</div> -->
		<h1 class="grow text-4xl">Retlab</h1>
	</div>

	<p class="text-sm">
		An opinionated, slightly convenient client for Etlab (see <a
			class="text-ret-accent underline hover:decoration-wavy"
			href={resolve("/docs")}>/docs</a
		>).
		<span class="font-semibold">Login with your Etlab credentials to continue.</span>
	</p>
</div>

<form
	{...loginForm.preflight(loginSchema).enhance(async ({ submit }) => {
		isLoggingIn = true;
		try {
			await submit();
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong!");
		} finally {
			isLoggingIn = false;
		}
	})}
	class="flex flex-col space-y-2"
>
	<div class="space-y-1">
		<Combobox
			type="single"
			name={loginForm.fields.collegeId.as("select").name}
			value={loginForm.fields.collegeId.value()}
			onValueChange={(value) => {
				loginForm.fields.collegeId.set(value);
				loginForm.validate({ includeUntouched: false, preflightOnly: true });
			}}
			icon={GraduationCapIcon}
			inputProps={{
				"aria-invalid": loginForm.fields.collegeId.issues() != undefined,
				placeholder: "Choose institution"
			}}
			items={data.colleges.map((college) => ({
				label: college.name,
				value: college.id.toString()
			}))}
			allowDeselect={false}
			disabled={isLoggingIn}
		/>

		<ul class="text-sm text-error-foreground">
			{#each loginForm.fields.collegeId.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-1">
		<Input
			autocomplete="off"
			class="w-full"
			{...loginForm.fields.username.as("text")}
			placeholder="Username"
			oninput={() => loginForm.validate({ includeUntouched: false, preflightOnly: true })}
			icon={AtIcon}
			disabled={isLoggingIn}
		/>
		<ul class="text-sm text-error-foreground">
			{#each loginForm.fields.username.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	<div class="space-y-1">
		<Input
			autocomplete="off"
			class="w-full"
			{...loginForm.fields.password.as("password")}
			placeholder="Shhh..."
			oninput={() => loginForm.validate({ includeUntouched: false, preflightOnly: true })}
			icon={AsteriskSimpleIcon}
			disabled={isLoggingIn}
		/>
		<ul class="text-sm text-error-foreground">
			{#each loginForm.fields.password.issues() as issue, i (i)}
				<li>{issue.message}</li>
			{/each}
		</ul>
	</div>

	{#if loginForm.fields.issues()?.length}
		<Box.Error>
			<ul class="list-inside list-[square] text-sm text-error-foreground">
				{#each loginForm.fields.issues() as issue, i (i)}
					<li>{issue.message}</li>
				{/each}
			</ul>
		</Box.Error>
	{/if}

	<Button {...loginForm.fields.action.as("submit", "login")} disabled={isLoggingIn}>
		{#if isLoggingIn}
			<SpinnerIcon class="animate-spin" /> Logging in... hold on
		{:else}
			<KeyIcon weight="bold" /> Login to Ret
		{/if}
	</Button>
</form>

<section class="relative mt-6 border-t-2 border-border py-3">
	<span
		class="absolute top-0 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1 bg-background px-2 leading-none text-ret-favourite"
	>
		<HeartIcon weight="fill" class="block shrink-0 text-ret-favourite" />
		<GithubLogoIcon weight="fill" class="block shrink-0 text-foreground" />
	</span>

	<p class="text-sm">
		Retlab is open-source btw&excl; Checkout the source code on GitHub:
		<a
			target="_blank"
			href="https://github.com/dcdunkan/retlab"
			class="font-medium underline hover:text-ret-accent"
		>
			https://github.com/dcdunkan/retlab
		</a>. Any kind of help with the development is appreciated :&rpar;
	</p>
</section>
