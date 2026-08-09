<script lang="ts">
	import { page } from '$app/state';
	import { useLoggerLogsEntries } from '$lib/api/queries/logger';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import Pagination from '$lib/components/molecules/Pagination.svelte';
	import { goto } from '$app/navigation';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import MoveBackBtn from '$lib/components/atoms/MoveBackBtn.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import LogsTable from './LogsTable.svelte';

	const machineId = $derived(page.params.id!);
	const logId = $derived(page.params.logId!!);
	let isCopied = $state(false);
	let isDownloaded = $state(false);

	const currentPage = $derived(Number(page.url.searchParams.get('page')) || 1);
	let currentLimit = $derived(Number(page.url.searchParams.get('limit')) || 200);
	const pagination = {
		get page() {
			return currentPage;
		},
		get limit() {
			return currentLimit;
		}
	};

	const logEntriesQuery = useLoggerLogsEntries(
		() => machineId,
		() => logId,
		pagination
	);

	// $inspect(currentLimit);
</script>

<main id="top" class="flex flex-col gap-4 relative">
	<MoveBackBtn path="/machine/{machineId}/logger/activelogers" />

	{#if logEntriesQuery.error && logEntriesQuery.isError}
		<ErrorTemplate error={logEntriesQuery.error} />
	{/if}
	{#if logEntriesQuery.isLoading}
		<LoadingTemplate isAbsolute={true} />
	{/if}

	<!-- If data -->
	{#if logEntriesQuery.isSuccess && logEntriesQuery.data.ok}
		{#if logEntriesQuery.data.data.length === 0}
			<NodataTemplate />
		{:else}
			<LogsTable
				{isDownloaded}
				{isCopied}
				{logEntriesQuery}
				{logId}
				{machineId}
				{currentLimit}
				{currentPage}
			/>

			<Pagination
				meta={logEntriesQuery.data.details}
				onPageChange={(newPage) => {
					const url = new URL(page.url);
					url.searchParams.set('page', newPage.toString());
					goto(url.pathname + url.search, { noScroll: true, keepFocus: false });

					setTimeout(() => {
						const topElement = document.getElementById('top');
						if (topElement) {
							topElement.scrollIntoView({
								behavior: 'smooth',
								block: 'start'
							});
						}
					}, 10);
				}}
			/>
		{/if}
	{/if}
</main>
