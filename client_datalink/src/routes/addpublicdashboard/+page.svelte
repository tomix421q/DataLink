<script lang="ts">
	import { goto } from '$app/navigation';
	import { useCreatePublicDashboard } from '$lib/api/queries/public_favorites';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';
	import SuccessTemplate from '$lib/components/atoms/SuccessTemplate.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { LayoutPanelLeft } from '@lucide/svelte';

	const createPublicDashboardMutate = useCreatePublicDashboard();

	let formData: { name: string; description?: string } = $state({
		name: '',
		description: ''
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		createPublicDashboardMutate.mutate(formData, {
			onSuccess: () => {
				formData.name = '';
				formData.description = '';
			}
		});
	}

	$effect(() => {
		if (!userStore.isAdminOrEngineer) {
			goto('/');
		}
	});
</script>

<main class="flex flex-col items-center justify-center min-h-[80vh]">
	<!-- Error/Success state -->
	{#if createPublicDashboardMutate.error && createPublicDashboardMutate.isError}
		<ErrorTemplate
			error={createPublicDashboardMutate.error}
			onClose={() => createPublicDashboardMutate.reset()}
		/>
	{/if}

	{#if createPublicDashboardMutate.isSuccess && createPublicDashboardMutate.data}
		<SuccessTemplate
			onClose={() => createPublicDashboardMutate.reset()}
			message={'Created'}
			details={createPublicDashboardMutate.data.message}
		/>
	{/if}

	<article class="form-table">
		<!-- Header -->
		<section class="form-header">
			<div>
				<LayoutPanelLeft />
				<h2>Add new public dashboard</h2>
			</div>
			<p>Create public dashboard for machine data</p>
		</section>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="form-group">
			<!-- ID machine -->
			<InputGroup
				id="name"
				label="Name"
				placeholder="Downtimes"
				type="text"
				bind:value={formData.name}
			/>
			<!-- Name machine -->
			<InputGroup
				id="description"
				label="Description"
				type="text"
				bind:value={formData.description}
				max="64"
				placeholder="Description for this dashboard [max 64 characters]"
			/>

			<!-- Btns -->
			<section class="pt-6 flex gap-3 *:flex-1 *:rounded-lg">
				<Button type="button" variant="outline" onclick={() => history.back()} class="">
					Cancel
				</Button>
				<Button type="submit"
					>{createPublicDashboardMutate.isPending ? 'Creating...' : 'Submit'}</Button
				>
			</section>
		</form>
	</article>
</main>
