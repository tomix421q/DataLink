<script lang="ts">
	import { useDeleteLoggerEntriesLogs } from '$lib/api/queries/logger';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Calendar, Hash, Trash2 } from '@lucide/svelte';

	let { machineId, logId } = $props<{ machineId: string; logId: string }>();

	const deleteMutation = useDeleteLoggerEntriesLogs(
		() => machineId,
		() => logId
	);

	let mode = $state<'range' | 'single'>('range');
	let fromDate = $state('');
	let toDate = $state('');
	let singleEntryId = $state(null);
	let open = $state(false);

	function handleDelete() {
		if (mode === 'range') {
			if (!fromDate || !toDate) return;
			deleteMutation.mutate(
				{
					from: new Date(fromDate),
					to: new Date(toDate)
				},
				{
					onSuccess: () => {
						open = false;
						resetForm();
					}
				}
			);
		} else {
			if (!singleEntryId) return;
			console.log(singleEntryId);
			deleteMutation.mutate(
				{
					entryId: String(singleEntryId)
				},
				{
					onSuccess: () => {
						open = false;
						resetForm();
					}
				}
			);
		}
	}

	function resetForm() {
		fromDate = '';
		toDate = '';
		singleEntryId = null;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button variant="destructive" size="sm">
			<Trash2 class="mr-1" /> Delete
		</Button>
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-[425px] overflow-auto">
		<Dialog.Header>
			<Dialog.Title>Delete data</Dialog.Title>
			<Dialog.Description>Choose from range or single id</Dialog.Description>
		</Dialog.Header>

		<div class="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-lg my-4">
			<Button
				variant={mode === 'range' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => (mode = 'range')}
				class="rounded-xl"
			>
				<Calendar class="mr-1 font-semibold" /> Range [from&to]
			</Button>
			<Button
				variant={mode === 'single' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => (mode = 'single')}
				class="rounded-xl"
			>
				<Hash class="mr-1" /> Only one [by ID]
			</Button>
		</div>

		<div class="grid gap-4 py-4">
			{#if mode === 'range'}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="from">From:</Label>
					<Input id="from" type="datetime-local" bind:value={fromDate} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="to">To:</Label>
					<Input id="to" type="datetime-local" bind:value={toDate} class="col-span-3" />
				</div>
			{:else}
				<div class="grid grid-cols-4 items-center gap-4 min-h-[80px]!">
					<Label for="entryId">Log ID:</Label>
					<Input
						type="number"
						id="entryId"
						bind:value={singleEntryId}
						class="col-span-3"
						placeholder="Insert number"
					/>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={handleDelete}
				disabled={deleteMutation.isPending ||
					(mode === 'range' ? !fromDate || !toDate : !singleEntryId)}
			>
				{#if deleteMutation.isPending}
					<LoadingTemplate transparant={true} />
				{:else}
					Remove
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
