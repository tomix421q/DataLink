<script lang="ts">
	import { page } from '$app/state';
	import type { useRemoveTagsFromTracking } from '$lib/api/queries/machines';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { cn } from '$lib/utils';
	import { Check, X } from '@lucide/svelte';
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

	// $inspect(isMachineOnline, hasTrackingTags);
</script>

<article class="flex gap-1">
	<!-- Remove Tags btn -->
	{#if userStore.isAdmin && isMachineOnline}
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
	{/if}
	<!-- Create new bookmark btn -->
</article>
