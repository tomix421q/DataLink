<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check, Copy, Download } from '@lucide/svelte';
	import DeleteLogsEntries from './DeleteLogsEntries.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import { dateTimmeUTCformatter } from '$lib/utils/global';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	interface Props {
		isDownloaded: boolean;
		isCopied: boolean;
		machineId: string;
		logEntriesQuery: any;
		logId: string;
		currentLimit: number;
		currentPage: number;
	}

	let {
		isDownloaded,
		isCopied,
		machineId,
		logEntriesQuery,
		logId,
		currentLimit,
		currentPage
	}: Props = $props();

	async function copyVisibleTable() {
		const data = logEntriesQuery.data?.data;
		if (!data || data.length === 0) return;

		const snapshotKeys = Object.keys(data[0].snapshot);
		const headers = ['ID', 'Snapshot', ...snapshotKeys].join('\t');

		const rows = data.map((record: any) => {
			const time = dateTimmeUTCformatter(record.timestamp);
			const snapshotValues = snapshotKeys.map(
				(key) => (record.snapshot as Record<string, any>)[key] ?? ''
			);
			return [record.id, time, ...snapshotValues].join('\t');
		});

		const tsvContent = [headers, ...rows].join('\n');

		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(tsvContent);
			} else {
				const textArea = document.createElement('textarea');
				textArea.value = tsvContent;
				textArea.style.position = 'absolute';
				textArea.style.left = '-999999px';
				document.body.prepend(textArea);

				textArea.select();
				try {
					document.execCommand('copy');
				} catch (fallbackErr) {
					console.error('Fallback copy zlyhal', fallbackErr);
					throw new Error('Kopírovanie zlyhalo');
				} finally {
					textArea.remove();
				}
			}
			isCopied = true;
			toast.success('Dáta boli skopírované do schránky');
			setTimeout(() => (isCopied = false), 2000);
		} catch (err) {
			console.error('Nepodarilo sa skopírovať dáta: ', err);
			toast.error('Kopírovanie zlyhalo (Prehliadač to zablokoval)');
		}
	}

	async function handleLimitChange(e: Event) {
		let input = e.target as HTMLInputElement;
		let newLimit = Number(input.value);
		if (!newLimit || newLimit < 1) {
			toast('⚠️ Min page limit is 1');
			return;
		}
		if (newLimit > 5000) {
			newLimit = 5000;
			toast('⚠️ Max page limit is 5000');
		}
		const url = new URL(page.url);
		url.searchParams.set('limit', newLimit.toString());
		url.searchParams.set('page', '1');
		await goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	const headerNames = $derived(
		Object.keys(logEntriesQuery.data?.data?.[0] || {}).filter(
			(v) => v !== 'ruleId' && v !== 'machineId'
		)
	);
</script>

<section
	class="mt-4 gap-y-2 lg:items-center flex flex-col lg:flex-row lg:flex-wrap justify-between"
>
	<!-- Buttons -->
	<div class="flex my-auto! items-center gap-x-2 mb-3">
		<DeleteLogsEntries {machineId} {logId} />
		<Button
			variant="outline"
			size="sm"
			href={`/api/export/rule/${logId}`}
			data-sveltekit-reload
			onclick={() => {
				isDownloaded = true;
				setTimeout(() => (isDownloaded = false), 5000);
			}}
			class="{isDownloaded ? 'bg-green-500/10! text-green-600' : ''}
					 {logEntriesQuery.data.details.totalCount > 0 ? 'flex' : 'hidden'}"
		>
			{#if isDownloaded}
				<Check class="mr-1" /> Success
			{:else}
				<Download class="mr-1" /> Download
			{/if}
		</Button>
		<Button
			variant="outline"
			size="sm"
			onclick={copyVisibleTable}
			class="w-fit transition-all {isCopied
				? 'bg-green-500/10! text-green-600!'
				: ''} {logEntriesQuery.data.details.totalCount > 0 ? 'flex' : 'hidden'}"
		>
			{#if isCopied}
				<Check class="mr-1" /> Copyed
			{:else}
				<Copy class="mr-1" /> Copy
			{/if}
		</Button>
	</div>

	<!-- Page info -->
	<div class="flex flex-wrap lg:gap-x-6 gap-2 items-center">
		<div class="flex">
			<p class="smallKey">Logger Id</p>
			<p class="smallValue">{logId}</p>
		</div>
		<div class="flex">
			<p class="smallKey">Total records</p>
			<p class="smallValue">
				{logEntriesQuery.data.details.totalCount}
			</p>
		</div>
		<div class="flex">
			<p class="smallKey">Total pages</p>
			<p class="smallValue">
				<span class="text-muted-foreground">{currentPage}</span>/{logEntriesQuery.data.details
					.totalPages}
			</p>
		</div>
		<div class="flex">
			<p class="smallKey block w-[120px]">Page limit</p>
			<Input
				type="number"
				min="1"
				max="5000"
				value={currentLimit}
				onchange={handleLimitChange}
				class="smallValue bg-transparent! max-w-[6
        0px] h-[25px] border-[0.5px]"
			/>
		</div>
	</div>
</section>

<!-- Table -->
<Table.Root>
	<Table.Caption>
		Records for rule with id <span class="text-secondary-foreground font-semibold">{logId}</span>
		and machine with id
		<span class="text-secondary-foreground font-semibold">{machineId}</span>
	</Table.Caption>
	<!-- Header -->
	<Table.Header>
		<Table.Row>
			{#each headerNames as name}
				<Table.Head
					class="text-center uppercase tracking-wider bg-secondary 
							{name === 'id' ? 'w-[80px]' : ''}
              {name === 'machineId' ? 'w-[100px]' : ''}
              {name === 'timestamp' ? 'w-[180px]' : ''}
              {name === 'snapshot' ? 'w-auto' : ''}">{name}</Table.Head
				>
			{/each}
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each logEntriesQuery.data.data as record (record.id)}
			{@const snapshot = Object.entries(record.snapshot)}
			<Table.Row>
				<Table.Cell width="10" align="center">{record.id}</Table.Cell>
				<Table.Cell width="50" align="center" class="w-auto"
					><ul class=" flex flex-wrap gap-2">
						{#each snapshot as s}
							<li class="px-1 rounded bg-primary-foreground dark:bg-secondary">
								<span class="text-muted-foreground">{s[0]}</span>:
								<span class="font-semibold text-emerald-400">{s[1]}</span>
							</li>
						{/each}
					</ul></Table.Cell
				>
				<Table.Cell class="text-center whitespace-nowrap"
					>{dateTimmeUTCformatter(record.timestamp)}</Table.Cell
				>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
