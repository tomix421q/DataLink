<script lang="ts">
	import { page } from '$app/state';
	import { useMachineLoggerRules } from '$lib/api/queries/logger';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import ActiveRuleCard from './ActiveRuleCard.svelte';

	const machineId = $derived(page.params.id);
	const machineRules = useMachineLoggerRules(() => machineId!);

	// $inspect(machineRules.data);
</script>

<main>
	{#if machineRules.isLoading}
		<LoadingTemplate />
	{/if}
	{#if machineRules.isError}
		<ErrorTemplate error={machineRules.error} />
	{/if}

	{#if machineRules.isSuccess}
		{#if machineRules.data && machineRules.data.length === 0}
			<NodataTemplate />
		{/if}

		<!-- Data -->
		<div class="flex flex-wrap gap-5">
			{#each machineRules.data as rule}
				<ActiveRuleCard {rule} />
			{/each}
		</div>
	{/if}
</main>
