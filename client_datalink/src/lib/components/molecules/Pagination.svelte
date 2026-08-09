<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	interface MetaType {
		limit: number;
		page: number;
		totalCount: number;
		totalPages: number;
	}

	let { meta, onPageChange }: { meta: MetaType; onPageChange: (pageNum: number) => void } =
		$props();

	// function getPageUrl(pageNum: number) {
	// 	const url = new URL(page.url);
	// 	url.searchParams.set('page', pageNum.toString());
	// 	return url.pathname + url.search;
	// }
</script>

{#if meta && meta.totalPages > 1}
	<div class="mt-8 flex items-center justify-center gap-6">
		{#if meta.page > 1}
			<Button
				title="Späť na predchádzajúcu stranu"
				variant="secondary"
				size="icon-lg"
				onclick={() => onPageChange(meta.page - 1)}
				// href={getPageUrl(meta.page - 1)}
				class="border border-primary/30 px-12 shadow-2xl drop-shadow-2xl transition-all hover:bg-primary/10"
				><ChevronLeft /></Button
			>
		{/if}

		<span class="text-sm text-muted-foreground">
			Page <span class="font-bold">{meta.page}</span>
			of <span class="font-bold">{meta.totalPages}</span>
		</span>

		{#if meta.page < meta.totalPages}
			<Button
				title="Prejsť na nasledujúcu stranu"
				variant="secondary"
				size="icon-lg"
				onclick={() => onPageChange(meta.page + 1)}
				// href={getPageUrl(meta.page + 1)}
				class="animate-float border border-primary/30 px-12 shadow-2xl drop-shadow-2xl transition-all hover:bg-primary/10"
			>
				<ChevronRight class="size-6 stroke-primary" /></Button
			>
		{/if}
	</div>
{/if}
