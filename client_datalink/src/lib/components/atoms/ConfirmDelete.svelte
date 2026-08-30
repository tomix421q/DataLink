<script lang="ts">
	import { LoaderCircle, Trash } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let {
		isConfirmDelete = $bindable(false),
		selectedItems,
		handleDelete,
		isPending,
		text = 'Are you sure you want to delete?',
		showDeleteItems = false
	}: {
		isConfirmDelete: boolean;
		selectedItems: string[];
		isPending?: boolean;
		text?: string;
		showDeleteItems?: boolean;
		handleDelete: () => void;
	} = $props();
</script>

{#if isConfirmDelete && selectedItems.length > 0}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
	>
		<div class="cardNormalize bg-card">
			<!-- Icon -->
			<div class="p-3 rounded-full bg-destructive/10 w-fit mx-auto text-destructive mb-3">
				<Trash class="size-8" />
			</div>
			<!-- Text -->
			<h2 class="text-base font-bold text-foreground">
				{text}
			</h2>
			<p class="text-xs text-center text-muted-foreground mb-4">This action cannot be undone.</p>
			<!-- List -->
			{#if showDeleteItems}
				<article class="my-3 max-h-32 overflow-y-auto w-full flex flex-wrap justify-center gap-1.5">
					{#each selectedItems as item}
						<span
							class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-background border text-chart-3"
						>
							{item}
						</span>
					{/each}
				</article>
			{/if}

			<!-- Btns -->
			<div class="flex items-center justify-center gap-4 mt-4">
				<Button
					variant="outline"
					size="sm"
					disabled={isPending}
					onclick={() => {
						isConfirmDelete = false;
					}}
				>
					Cancel
				</Button>

				<Button
					variant="destructive"
					size="sm"
					disabled={isPending}
					onclick={() => {
						handleDelete();
					}}
				>
					{#if isPending}
						<LoaderCircle class="size-4 animate-spin mr-1.5" />
						Deleting...
					{:else}
						Delete
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}
