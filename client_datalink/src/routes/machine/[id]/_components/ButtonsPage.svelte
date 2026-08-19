<script lang="ts">
	import { page } from '$app/state';
	import type { useRemoveTagsFromTracking } from '$lib/api/queries/machines';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { cn } from '$lib/utils';
	import { Check, DownloadIcon, X } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let {
		selectedTags = $bindable(),
		toggleRemove = $bindable(),
		handleDeleteSelected,
		deleteTagsMutation,
		isMachineOnline,
		hasTrackingTags
	}: {
		selectedTags: string[];
		toggleRemove: boolean;
		handleDeleteSelected: () => void;
		deleteTagsMutation: ReturnType<typeof useRemoveTagsFromTracking>;
		isMachineOnline: boolean;
		hasTrackingTags: boolean;
	} = $props();

	const machineId = $derived(page.params.id);
	let isDownloaded = $state(false);

	// $inspect(isMachineOnline, hasTrackingTags);
</script>

<article class="flex gap-1">
	{#if userStore.isAdmin}
		<!-- Download tags configs -->
		<Button
			href={`/api/export/tags/${machineId}`}
			variant="outline"
			size="xs"
			data-sveltekit-reload
			onclick={() => {
				isDownloaded = true;
				setTimeout(() => (isDownloaded = false), 5000);
			}}
			class={isDownloaded ? 'bg-green-500/10! text-green-600' : ''}
			><DownloadIcon />Tags config</Button
		>
	{/if}
	{#if userStore.isAdmin && isMachineOnline}
		<!-- Add new tag btn -->
		<Button
			variant="outline"
			size="xs"
			href="/machine/{machineId}/addnewtags"
			onclick={(e) => {
				if (!userStore.isAdmin) {
					e.preventDefault();
					toast.error('⚠️ Authorization required');
					return;
				}
				if (!isMachineOnline) {
					e.preventDefault();
					toast.error('🔌 This machine is offline. Try later. ');
					return;
				}
			}}
			disabled={!userStore.isAdmin || !isMachineOnline}
			class={cn('group hover:bg-chart-3', {
				'bg-chart-4! *:block': page.url.pathname.endsWith('/addnewtags'),
				hidden: !userStore.isAdmin || isMachineOnline === undefined
			})}
			><span class="">Add plc tags</span>
		</Button>

		<!-- Remove Tags btn -->
		<Button
			variant="destructive"
			size="xs"
			class={hasTrackingTags ? 'flex' : 'hidden'}
			onclick={() => {
				toggleRemove = !toggleRemove;
				if (!toggleRemove) {
					selectedTags = [];
				}
			}}
		>
			{#if !toggleRemove}
				<p class="flex gap-1 items-center">Remove tags</p>
			{:else}
				<X /> Cancel
			{/if}
		</Button>
		{#if toggleRemove && selectedTags.length > 0}
			<Button
				variant="destructive"
				size="sm"
				onclick={handleDeleteSelected}
				disabled={deleteTagsMutation.isPending}
			>
				<Check /> Confirm delete ({selectedTags.length})
			</Button>
		{/if}
	{/if}

	<!-- Create new bookmark btn -->
</article>
