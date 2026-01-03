<script lang="ts">
	import Box from "$lib/components/box";
	import { getColleges, loginForm } from "./data.remote";
	import Button from "$lib/components/button.svelte";
	import { loginSchema } from "./login-schema";

	const collegeList = getColleges();
</script>

<svelte:head>
	<title>Login to Retlab</title>
</svelte:head>

<div class="mb-4 space-y-4">
	<h1 class="text-3xl">Login to Retlab</h1>
	<p>Login with your Etlab credentials to use Retlab.</p>
</div>

{#if collegeList.loading}
	<Box.Loading>Loading institutions</Box.Loading>
{:else if collegeList.ready}
	<form {...loginForm.preflight(loginSchema)} class="flex flex-col space-y-2">
		<div class="space-y-1">
			<select
				class="w-full"
				{...loginForm.fields.collegeId.as("select")}
				onchange={() => loginForm.validate({})}
			>
				<option disabled selected>Choose institution</option>
				{#each collegeList.current as college (college.id)}
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

		<Button {...loginForm.buttonProps} disabled={!!loginForm.pending}>Login</Button>
	</form>
{:else if collegeList.error}
	<Box.Error>Failed to load institutions</Box.Error>
{/if}
