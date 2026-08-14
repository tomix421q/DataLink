<script lang="ts">
	import { useDeleteLoggerRule } from '$lib/api/queries/logger';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { dateTimmeUTCformatter } from '$lib/utils/global';
	import { BookSearch, Check, Loader, Trash, X } from '@lucide/svelte';

	let { rule } = $props();

	let isConfirm = $state(false);

	const deleteMutation = useDeleteLoggerRule();

	// $inspect(rule);
</script>

<main>
	<article class="cardNormalize w-full sm:min-w-sm max-w-xl">
		<header class="border-b mb-3 pb-3">
			<h3 class="text-primary text-xl font-semibold">
				{rule.name}
			</h3>
			<p class="text-xs"><span class="text-muted-foreground mr-2">Rule Id</span>{rule.id}</p>
			<p class="text-xs">
				<span class="text-muted-foreground mr-2">Created</span>{dateTimmeUTCformatter(
					rule.createdAt
				)}
			</p>
			<p class="text-xs">
				<span class="text-muted-foreground mr-2">By</span>{String(rule.user?.name).split('(')[0] ??
					''}
			</p>
			<p class="text-xs">
				<span class="text-muted-foreground mr-2 text-xs">Last update</span>{dateTimmeUTCformatter(
					rule.updatedAt
				)}
			</p>
		</header>

		<!-- Card -->
		<section class="text-xs">
			<p>
				<span class="text-muted-foreground mr-2 my-auto">Trigger type</span>{rule.triggerType}
			</p>
			{#if rule.triggerType === 'TIME'}
				<p>
					<span class="text-muted-foreground mr-2 my-auto">Interval</span>{rule.interval}ms [{(
						rule.interval! / 1000
					).toFixed(0)}s]
				</p>
			{:else if rule.triggerType === 'EDGE'}
				<p>
					<span class="text-muted-foreground mr-2 my-auto">Trigger tag</span>{rule.triggerTag}
				</p>
				<p>
					<span class="text-muted-foreground mr-2 my-auto">Trigger operator</span
					>{rule.triggerOperator}
				</p>
				<p>
					<span class="text-muted-foreground mr-2 my-auto">Trigger value</span>{rule.triggerValue}
				</p>
			{:else if rule.triggerType === 'CHANGE'}
				<p>
					<span class="text-muted-foreground mr-2 my-auto">Trigger tag</span>{rule.triggerTag}
				</p>
			{/if}

			<div class="flex flex-wrap">
				<span class="text-muted-foreground mr-2 my-auto">Values to write in db</span>
				{#each JSON.parse(rule.tagToSave) as tag}
					<span class="text-green-400 font-semibold items-center mr-1">{tag},</span>
				{/each}
			</div>
		</section>

		<!-- Btns -->
		<section class="flex flex-wrap mt-5 gap-2 items-center justify-between">
			<Button variant="outline" href="/machine/{rule.machineId}/logger/activelogers/{rule.id}"
				><BookSearch />View data</Button
			>
			<div class="flex">
				<Button
					variant="destructive"
					class="z-20 {userStore.isAdmin || userStore.isEngineer ? 'flex' : 'hidden'}"
					onclick={() => {
						isConfirm = true;
					}}
					disabled={deleteMutation.isPending}
				>
					{#if deleteMutation.isPending}
						<Loader class="animate-spin mr-2" />Processing
					{:else if isConfirm}
						<p>Are you sure?</p>
					{:else}
						<Trash /> Remove
					{/if}
				</Button>

				{#if isConfirm}
					<div class="flex items-center gap-1 justify-center z-30">
						<Button
							variant="outline"
							size="icon-sm"
							title="Remove"
							class="text-green-500 bg-green-100 rounded-full border-none"
							onclick={() => {
								isConfirm = false;
								deleteMutation.mutate(rule.id);
							}}><Check /></Button
						>
						<Button
							variant="outline"
							size="icon-sm"
							title="Cancel"
							class="text-red-500 bg-red-100 rounded-full border-none"
							onclick={() => {
								isConfirm = false;
							}}><X /></Button
						>
					</div>
				{/if}
			</div>
		</section>
	</article>
</main>
