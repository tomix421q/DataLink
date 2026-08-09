<script lang="ts">
	import { useLoginMutation } from '$lib/api/queries/auth';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { CircleUserRound, EyeIcon } from '@lucide/svelte';

	let username = $state('');
	let password = $state('');
	let isSeePass = $state(false);

	const loginMutation = useLoginMutation();

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loginMutation.mutate({ username, password });
	}

	// $inspect(data);
</script>

<main
	class="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-left-12 duration-800"
>
	<article class="form-table">
		<section class="form-header">
			<div>
				<CircleUserRound />
				<h2>Login</h2>
			</div>

			<p class="text-muted-foreground text-sm">Login with your company pc credentials</p>
		</section>

		<form onsubmit={handleSubmit} class="form-group">
			{#if loginMutation.isError}
				<div class="text-destructive font-semibold w-sm">{loginMutation.error.message}</div>
			{/if}

			<div class="flex flex-col flex-1">
				<Label for="username" class="text-sm text-muted-foreground">Name</Label>
				<Input
					class="inputNormalize placeholder:opacity-30"
					id="username"
					type="text"
					placeholder="uzilt005"
					bind:value={username}
					disabled={loginMutation.isPending}
					required
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
				/>
			</div>

			<div class="flex flex-col flex-1 relative">
				<Label for="password" class="text-sm text-muted-foreground">Password</Label>
				<Input
					class="inputNormalize placeholder:opacity-30"
					id="password"
					type={isSeePass ? 'text' : 'password'}
					placeholder="Namestovo1"
					bind:value={password}
					disabled={loginMutation.isPending}
					required
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
				/>
				{#if password}
					<Button
						size="icon-xs"
						variant="ghost"
						class="absolute top-1/2 right-2"
						onclick={() => (isSeePass = !isSeePass)}
						><EyeIcon class="size-5 {isSeePass ? 'text-destructive' : 'text-green-500'}" /></Button
					>
				{/if}
			</div>

			<Button type="submit" size="lg" disabled={loginMutation.isPending} class="font-bold mt-4">
				{loginMutation.isPending ? 'Pending...' : 'Login user'}
			</Button>
		</form>
	</article>
</main>
