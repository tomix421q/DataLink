<script lang="ts">
	import { ApiValidationError } from '$lib/utils/global';
	import { TriangleAlertIcon, X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let { error, onClose } = $props<{
		error: any;
		onClose?: () => void;
	}>();
</script>

{#if error}
	<section
		class="bg-destructive/10 lg:w-2xl rounded mb-6 font-heading mx-auto shadow-xl relative border-destructive/50 border-1 hover:border-destructive/20! transition-all"
	>
		<div
			class="p-3 text-sm md:text-lg text-destructive font-medium bg-destructive/10 tracking-widest flex items-center gap-2"
		>
			<TriangleAlertIcon class="animate-pulse" />
			{error.message || 'ERROR'}
		</div>

		<div class="py-4 p-2 md:p-4">
			{#if error instanceof ApiValidationError && error.details && Object.keys(error.details).length > 0}
				<ul class="text-destructive/80 text-xs md:text-sm">
					{#each Object.entries(error.details) as [field, messages]}
						<li class="flex gap-1">
							<span class="font-bold text-secondary-foreground">{field}:</span>
							<p>{(messages as string[]).join(', ')}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if onClose}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onClose}
				class="absolute right-1 top-1 rounded-full hover:bg-destructive/30!"
				><X class="stroke-destructive" /></Button
			>
		{/if}
	</section>
{/if}
