<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { PinIcon, PinOff, Rss, Search, X } from '@lucide/svelte';
	import { page } from '$app/state';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import {
		useGetAllPublicDashboards,
		useToggleFolderToPublicDash
	} from '$lib/api/queries/public_favorites';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import Input from '$lib/components/ui/input/input.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	let {
		folderName,
		folderId,
		isText
	}: {
		folderName: string;
		folderId: string;
		isText?: boolean;
	} = $props();

	// api
	const allPublicDashboardsQuery = useGetAllPublicDashboards();
	const addFolderToPublicDashMutate = useToggleFolderToPublicDash();

	// vars
	let open = $state(false);
	let searchQuery = $state('');
	let isFolderInAnyDashboard = $state(false);

	// funcs
	let filteredDashboards = $derived.by(() => {
		const list = allPublicDashboardsQuery.data?.data ?? [];
		const query = searchQuery.trim().toLowerCase();
		const filtered = query ? list.filter((d) => d.name.toLowerCase().includes(query)) : list;
		return [...filtered].sort((a, b) => {
			const aPinned = a.folders.some((t) => t.folderId === folderId);
			const bPinned = b.folders.some((t) => t.folderId === folderId);
			if (aPinned && !bPinned) return -1;
			if (!aPinned && bPinned) return 1;
			return 0;
		});
	});

	function handleToggle(dashboardId: string, folderId: string) {
		// console.log(dashboardId, folderId);
		addFolderToPublicDashMutate.mutate({ dashboardId, folderId, order: 1 });
	}

	$effect(() => {
		let isAnyFolderInDash = filteredDashboards.some((t) =>
			t.folders.some((v) => v.folderId === folderId)
		);
		isFolderInAnyDashboard = isAnyFolderInDash && true;
	});

	// $inspect(isFolderInAnyDashboard);
</script>

<Dialog.Root bind:open>
	<!-- Trigger btn -->
	<Dialog.Trigger>
		<Button
			size={isText ? 'xs' : 'icon-xs'}
			variant={isText ? 'outline' : 'ghost'}
			title="Manage folder in public dashboards"
			// class={isText ? '' : 'hover:text-secondary-foreground!'}
		>
			<Rss
				class="size-4 {isText ? 'hidden' : 'block'} {isFolderInAnyDashboard
					? 'text-green-500'
					: ''}"
			/>
			<span class={isText ? 'block' : 'hidden'}>Public Folders</span>
		</Button>
	</Dialog.Trigger>

	<Dialog.Content class="flex flex-col h-[525px] cardNormalize overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="font-heading font-bold text-lg flex flex-wrap justify-center gap-1"
				><h3>Public dashboards</h3>
			</Dialog.Title>
			<Dialog.Description class="mx-auto"
				>Add/Remove folder <span class="text-destructive font-semibold">{folderName}</span> from public
				dashboards</Dialog.Description
			>
			<Separator />
			<div class="relative mx-auto w-[175px] focus-within:w-[300px] transition-all duration-500">
				<Search
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
				/>
				<Input
					type="text"
					bind:value={searchQuery}
					placeholder="Search folder..."
					class="inputNormalize pl-9 pr-8 h-9 text-xs w-full"
				/>
				{#if searchQuery}
					<Button
						size="icon-xs"
						variant="ghost"
						class="absolute right-1.5 top-1/2 inset-y-2 size-6 rounded-full text-muted-foreground hover:text-foreground"
						onclick={() => (searchQuery = '')}
						title="Clear search"
					>
						<X class="size-3.5" />
					</Button>
				{/if}
			</div>
		</Dialog.Header>

		<div>
			<section class="p-1 h-[370px] scroll-auto overflow-y-auto">
				{#if allPublicDashboardsQuery.isLoading}
					<LoadingTemplate />
				{:else if allPublicDashboardsQuery.isError}
					<p>{allPublicDashboardsQuery.error}</p>
				{:else if allPublicDashboardsQuery.isSuccess && allPublicDashboardsQuery.data?.data}
					{#if allPublicDashboardsQuery.data.data.length === 0}
						<NodataTemplate text="No public folders created yet" />
					{/if}

					{#each filteredDashboards as dashboard (dashboard.id)}
						{@const isExistInDashboard = dashboard.folders.some((t) => t.folderId === folderId)}
						<div
							animate:flip={{ duration: 350, easing: cubicOut }}
							class="flex justify-between odd:bg-muted-foreground/5 p-1 border-b-1 border-transparent hover:border-primary/30 rounded-xs transition-colors"
						>
							<div class="flex items-center gap-0.5 text-sm">
								<p class="font-bold">{dashboard.name}</p>
								<p class="text-muted-foreground mb-0.5">({dashboard.folders.length})</p>
							</div>

							<Button
								size="xs"
								variant={isExistInDashboard ? 'destructive' : 'outline'}
								class="rounded-xl "
								onclick={() => handleToggle(dashboard.id, folderId)}
							>
								{#if isExistInDashboard}
									<span class="font-light">Remove</span>
									<PinOff class="text-chart-2 size-4" />
								{:else}
									<span class="font-light">Add</span>
									<PinIcon class="text-green-400 size-4" />
								{/if}
							</Button>
						</div>
					{/each}
				{/if}
			</section>
		</div>

		<Dialog.Footer>
			<!-- Btns -->
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
