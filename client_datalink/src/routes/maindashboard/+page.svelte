<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMainDashboardLive } from '$lib/api/queries/favorites';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import {
		Activity,
		Bookmark,
		Layers,
		Minimize2,
		SquareArrowOutUpRight,
		Tv,
		UserIcon
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';

	const dashboardQuery = useMainDashboardLive();
	let isTvModeDashboard = $state(false);
	let folderFilter = $state<'All folders' | 'My folders' | 'Other folders'>('All folders');

	function toggleTvMode() {
		isTvModeDashboard = !isTvModeDashboard;
		if (isTvModeDashboard) {
			document.documentElement.requestFullscreen().catch(() => {});
		} else if (!isTvModeDashboard) {
			document.exitFullscreen().catch(() => {});
		}
	}

	$effect(() => {
		if (!userStore.user) {
			goto('/auth/login');
			toast.warning('Login is required');
		}

		const handleFullscreenChange = () => {
			if (!document.fullscreenElement && isTvModeDashboard) {
				isTvModeDashboard = false;
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});

	$inspect(dashboardQuery.data);
</script>

<main class="p-4 md:p-8 max-w-screen-2xl mx-auto">
	<header class="mb-6 pb-2 border-b flex flex-col gap-3">
		<div class="flex items-center gap-3">
			<Activity class="size-8 text-primary" />
			<h1 class="text-xl md:text-3xl font-heading font-black">Global Dashboard</h1>
			<Button
				variant="ghost"
				size="icon-xs"
				title="TV Mode"
				class="text-muted-foreground hidden sm:flex"
				onclick={() => toggleTvMode()}><Tv class="size-5" /></Button
			>
			{#if dashboardQuery.isFetching}
				<span
					out:fade={{ duration: 1000 }}
					class="ml-auto text-xs text-green-500 font-bold animate-pulse flex items-center gap-1"
				>
					<span class="size-3 rounded-full bg-green-500"></span>
				</span>
			{/if}
		</div>

		{#if dashboardQuery.isSuccess && dashboardQuery.data}
			{@const { folders, subsFolders } = dashboardQuery.data.data}

			<div class="flex items-center gap-1.5">
				<Button
					variant={folderFilter === 'All folders' ? 'outline' : 'ghost'}
					size="sm"
					class="h-7 px-2.5 rounded-lg gap-1.5 font-bold"
					onclick={() => (folderFilter = 'All folders')}
				>
					<Layers class="size-3.5" />
					All ({folders.length + subsFolders.length})
				</Button>
				<Button
					variant={folderFilter === 'My folders' ? 'outline' : 'ghost'}
					size="sm"
					class="h-7 px-2.5 rounded-lg gap-1.5 font-bold"
					onclick={() => (folderFilter = 'My folders')}
				>
					<UserIcon class="size-3.5" />
					My folders ({folders.length})
				</Button>
				<Button
					variant={folderFilter === 'Other folders' ? 'outline' : 'ghost'}
					size="sm"
					class="h-7 px-2.5 rounded-lg gap-1.5 font-bold"
					onclick={() => (folderFilter = 'Other folders')}
				>
					<Bookmark class="size-3.5" />
					Other folders ({subsFolders.length})
				</Button>
			</div>
		{/if}
	</header>

	{#if dashboardQuery.isLoading}
		<LoadingTemplate />
	{:else if dashboardQuery.isError}
		<ErrorTemplate error={dashboardQuery.error?.message} />
	{:else if dashboardQuery.isSuccess && dashboardQuery.data}
		{@const { folders, liveData, subsFolders } = dashboardQuery.data.data}

		{@const totalVisible =
			folderFilter === 'All folders'
				? folders.length + subsFolders.length
				: folderFilter === 'My folders'
					? folders.length
					: subsFolders.length}

		{#if totalVisible === 0}
			<div
				class="py-12 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl mt-4 bg-card/50"
			>
				<p class="text-xl font-heading font-bold mb-2">No folders found...</p>
				<p class="text-sm">No folders match the selected filter or none were pinned yet.</p>
			</div>
		{:else}
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-start"
			>
				<!-- my folders -->
				{#if folderFilter === 'All folders' || folderFilter === 'My folders'}
					{#each folders as folder (folder.id)}
						{@render folderCard({
							id: folder.id,
							name: folder.name,
							machineId: folder.machineId,
							tags: folder.tags,
							author: 'Me',
							dataMap: liveData
						})}
					{/each}
				{/if}

				<!-- subs folders -->
				{#if folderFilter === 'All folders' || folderFilter === 'Other folders'}
					{#each subsFolders as sub (sub.id)}
						{@render folderCard({
							id: sub.id,
							name: sub.folder.name,
							machineId: sub.machineId,
							tags: sub.folder.tags,
							author: sub.folder.user?.name ?? 'Unknown',
							dataMap: liveData
						})}
					{/each}
				{/if}
			</div>
		{/if}
	{/if}
</main>

{#snippet folderCard(info: {
	id: string;
	name: string;
	machineId: string;
	tags: { keyName: string }[];
	author: string;
	dataMap: Record<string, any>;
})}
	<article class="border rounded-xl p-3 bg-card shadow-sm w-full cardNormalize">
		<div class="border-b pb-1 mb-2 flex justify-between font-heading">
			<h3
				class="flex items-center gap-1 truncate"
				title="📌 Created by: {String(info.author).split('(')[0]}"
			>
				<span class="font-bold truncate">{info.name}</span>
				<span class="text-xs text-muted-foreground shrink-0">[{info.machineId}]</span>
			</h3>

			<Button
				href={`/machine/${info.machineId}`}
				variant="ghost"
				size="icon-xs"
				class="hover:scale-105! text-muted-foreground shrink-0"
				title="Machine detail"
			>
				<SquareArrowOutUpRight class="size-4" />
			</Button>
		</div>

		<div class="flex flex-col gap-1">
			{#each info.tags as savedTag}
				{@const machineData = info.dataMap[info.machineId] || {}}
				{@const tagLiveValue = machineData[savedTag.keyName]}

				{#if tagLiveValue !== undefined}
					{@render tagValueDisplay(savedTag.keyName, tagLiveValue)}
				{:else}
					<p class="text-muted-foreground text-sm flex justify-between px-1 py-0.5">
						<span class="truncate">{savedTag.keyName}:</span>
						<span class="text-destructive font-bold text-xs shrink-0">Offline</span>
					</p>
				{/if}
			{/each}
		</div>
	</article>
{/snippet}

{#snippet tagValueDisplay(tagName: string, tagValue: any)}
	{@const tagValueSliceText =
		String(tagValue).length > 16 ? String(tagValue).slice(0, 15) + '...' : String(tagValue)}

	<section
		class="flex gap-1 text-sm items-center justify-between pr-1 hover:bg-muted/50 rounded transition-colors px-1 py-0.5"
	>
		<p class="text-muted-foreground truncate" title={tagName}>{tagName}:</p>
		<p class="shrink-0">
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
	</section>
{/snippet}

{#snippet tvTagValueDisplay(tagName: string, tagValue: any)}
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
{/snippet}

<!-- TV Mode -->
{#if isTvModeDashboard && dashboardQuery.isSuccess && dashboardQuery.data}
	{@const { folders, subsFolders, liveData } = dashboardQuery.data.data}
	{@const totalCount = folders.length + subsFolders.length}

	<section class="fixed inset-0 z-50 bg-background flex flex-col p-6 overflow-y-auto">
		<header class="flex justify-between items-center mb-6 border-b pb-4">
			<div>
				<h1
					class="text-4xl md:text-5xl font-heading font-black text-primary flex gap-3 items-center"
				>
					<Activity class="size-10 text-primary" />
					Main Dashboard
					{#if dashboardQuery.isFetching}
						<span
							out:fade={{ duration: 1000 }}
							class="size-4 rounded-full bg-green-500 animate-pulse ml-2"
						></span>
					{/if}
				</h1>
				<p class="text-xl text-muted-foreground mt-1 font-medium">
					{totalCount}
					{totalCount === 1 ? 'folder' : 'folders'}
				</p>
			</div>

			<Button
				variant="destructive"
				size="lg"
				class="text-xl px-5 py-5 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
				onclick={toggleTvMode}
			>
				<Minimize2 class="size-6" />
			</Button>
		</header>

		<div
			class="grid grid-cols-[repeat(auto-fill,minmax(450px,1fr))] gap-3 xl:gap-5 items-start w-full"
		>
			<!-- my folders -->
			{#if folderFilter === 'All folders' || folderFilter === 'My folders'}
				{#each folders as folder (folder.id)}
					<article class="border-2 rounded-2xl p-4 bg-card shadow-lg cardNormalize flex flex-col">
						<div
							class="border-b-2 border-muted pb-2 mb-3 flex justify-between items-center font-heading"
						>
							<h3 class="flex items-center gap-2 truncate">
								<span class="font-black text-xl md:text-2xl truncate">{folder.name}</span>
								<span
									class="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-lg"
								>
									{folder.machineId}
								</span>
							</h3>
						</div>

						<div class="flex flex-col gap-2 md:gap-3">
							{#each folder.tags as savedTag}
								{@const machineData = liveData[folder.machineId] || {}}
								{@const tagLiveValue = machineData[savedTag.keyName]}

								{#if tagLiveValue !== undefined}
									{@render tvTagValueDisplay(savedTag.keyName, tagLiveValue)}
								{:else}
									<div
										class="flex flex-col items-center justify-center p-4 bg-card border-2 border-secondary border-dashed rounded-xl"
									>
										<p class="text-xl text-muted-foreground font-heading">{savedTag.keyName}</p>
										<p class="text-3xl font-black text-destructive mt-1">OFFLINE</p>
									</div>
								{/if}
							{/each}
						</div>
					</article>
				{/each}
			{/if}

			<!-- subs -->
			{#if folderFilter === 'All folders' || folderFilter === 'Other folders'}
				{#each subsFolders as sub (sub.id)}
					<article
						class="border-2 border-primary/30 rounded-2xl p-4 bg-card shadow-lg cardNormalize flex flex-col"
					>
						<div
							class="border-b-2 border-muted pb-2 mb-3 flex justify-between items-center font-heading"
						>
							<h3 class="flex items-center gap-2 truncate">
								<span class="font-black text-xl md:text-2xl truncate">{sub.folder.name}</span>
								<span
									class="text-xs font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-lg"
								>
									{sub.machineId}
								</span>
								<span class="text-xs text-muted-foreground">({sub.folder.user?.name})</span>
							</h3>
						</div>

						<div class="flex flex-col gap-2 md:gap-3">
							{#each sub.folder.tags as savedTag}
								{@const machineData = liveData[sub.machineId] || {}}
								{@const tagLiveValue = machineData[savedTag.keyName]}

								{#if tagLiveValue !== undefined}
									{@render tvTagValueDisplay(savedTag.keyName, tagLiveValue)}
								{:else}
									<div
										class="flex flex-col items-center justify-center p-4 bg-card border-2 border-secondary border-dashed rounded-xl"
									>
										<p class="text-xl text-muted-foreground font-heading">{savedTag.keyName}</p>
										<p class="text-3xl font-black text-destructive mt-1">OFFLINE</p>
									</div>
								{/if}
							{/each}
						</div>
					</article>
				{/each}
			{/if}
		</div>
	</section>
{/if}
