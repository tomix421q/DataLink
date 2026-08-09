<script lang="ts">
	import { Check, X } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let {
		message,
		details,
		onClose
	}: { message: string; details?: object | string; onClose: () => void } = $props();
</script>

<div
	class="bg-green-300 lg:w-2xl border-green-400 border-2 hover:border-green-500 transition-all rounded mb-6 font-heading mx-auto shadow-xl relative w-full"
>
	<div class="flex items-center gap-2 p-3 text-sm md:text-lg font-semibold">
		<Check class="stroke-green-600" />
		<p class="text-green-700">{message}</p>
	</div>

	{#if details}
		<div class="text-green-600 bg-green-200 p-3 text-xs">
			{#if typeof details === 'string'}
				<p class="">{details}</p>
			{:else}
				<ul>
					{#each Object.entries(details) as [key, value]}
						<li>
							<span class="">{key}:</span>
							<span>{String(value)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<Button
		variant="ghost"
		size="icon-sm"
		onclick={onClose}
		class="absolute right-1 top-1 hover:bg-green-400! rounded-full"
		><X class="stroke-green-600" /></Button
	>
</div>
