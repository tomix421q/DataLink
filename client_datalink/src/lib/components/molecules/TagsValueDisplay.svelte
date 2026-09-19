<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	let { tagName, tagValue }: { tagName: string; tagValue: any } = $props();

	const tagValueSliceText = $derived(
		String(tagValue).length > 16 ? String(tagValue).slice(0, 15) + '...' : String(tagValue)
	);
</script>

<section class="flex gap-1 text-sm items-center justify-between pr-1 hover:bg-muted/50">
	<p class="text-muted-foreground truncate" title={tagName}>{tagName}:</p>
	{#key tagValue}
		<p in:scale={{ duration: 420, start: 0.75, easing: cubicOut }} class="shrink-0">
			{#if typeof tagValue === 'boolean'}
				<span class={tagValue ? 'text-green-500 font-bold' : 'text-destructive font-bold'}>
					{tagValue ? 'true' : 'false'}
				</span>
			{:else}
				<span
					class="font-bold {String(tagValue).length > 16 ? 'cursor-help' : ''}"
					title={String(tagValue).length > 16 ? String(tagValue) : null}
				>
					{tagValueSliceText}
				</span>
			{/if}
		</p>
	{/key}
</section>
