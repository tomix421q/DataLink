<script lang="ts">
	let { tagName, tagValue }: { tagName: string; tagValue: any } = $props();

	const tagValueSliceText = $derived(
		String(tagValue).length > 16 ? String(tagValue).slice(0, 15) + '...' : String(tagValue)
	);
</script>

<div
	class="flex flex-col items-center justify-center p-4 bg-card border-2 border-secondary rounded-xl shadow-sm"
>
	<p
		class="text-xl md:text-2xl text-muted-foreground font-heading mb-1 truncate w-full text-center"
	>
		{tagName}
	</p>

	{#if typeof tagValue === 'boolean'}
		<span
			class="text-4xl md:text-5xl font-black {tagValue
				? 'text-green-500'
				: 'text-destructive'} uppercase"
		>
			{tagValue ? 'true' : 'false'}
		</span>
	{:else}
		<span
			class="text-5xl md:text-6xl font-black text-primary truncate max-w-full"
			title={String(tagValue)}
		>
			{tagValue ?? '--'}
		</span>
	{/if}
</div>
