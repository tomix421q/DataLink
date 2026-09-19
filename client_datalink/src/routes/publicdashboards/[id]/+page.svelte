<script lang="ts">
	import { page } from '$app/state';
	import { useGetPublicDashboardLive } from '$lib/api/queries/public_favorites';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import MoveBackBtn from '$lib/components/atoms/MoveBackBtn.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import TagsValueDisplay from '$lib/components/molecules/TagsValueDisplay.svelte';
	import TvTagsValueDisplay from '$lib/components/molecules/TvTagsValueDisplay.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Activity, Clock, Minimize2, SquareArrowOutUpRight, Tv } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let dashboardId = $derived(page.params.id!);

	// apis
	let getPublicDashboardLiveQuery = useGetPublicDashboardLive(() => dashboardId);

	// vars
	let isTvModeDashboard = $state(false);
	let currentTime = $state(
		new Date().toLocaleTimeString('sk-SK', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		})
	);

	// func
	function toggleTvMode() {
		isTvModeDashboard = !isTvModeDashboard;
		if (isTvModeDashboard) {
			document.documentElement.requestFullscreen().catch(() => {});
		} else if (!isTvModeDashboard) {
			document.exitFullscreen().catch(() => {});
		}
	}

	function handleFullscreenChange() {
		isTvModeDashboard = !!document.fullscreenElement;
	}

	onMount(() => {
		const updateTime = () => {
			currentTime = new Date().toLocaleTimeString('sk-SK', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			});
		};
		updateTime();
		const timer = setInterval(updateTime, 1000);
		return () => clearInterval(timer);
	});

	$inspect(getPublicDashboardLiveQuery.data);
</script>

<!--  -->

<main class=" max-w-screen-2xl mx-auto">
	<header class=" p-4 border-b flex flex-col gap-3">
		<div class="flex items-center gap-3">
			<Activity class="size-8 text-primary" />
			<h1 class="text-xl md:text-3xl font-heading font-black">
				Public Dashboard {getPublicDashboardLiveQuery.data?.data.dashboard.name}
			</h1>
			<Button
				variant="ghost"
				size="icon-xs"
				title="TV Mode"
				class="text-muted-foreground hidden sm:flex"
				onclick={() => toggleTvMode()}><Tv class="size-5" /></Button
			>
			{#if getPublicDashboardLiveQuery.isFetching}
				<span
					out:fade={{ duration: 1000 }}
					class="ml-auto text-xs text-green-500 font-bold animate-pulse flex items-center gap-1"
				>
					<span class="size-3 rounded-full bg-green-500"></span>
				</span>
			{/if}
		</div>

		{#if getPublicDashboardLiveQuery.isSuccess && getPublicDashboardLiveQuery.data?.data}
			{@const liveData = getPublicDashboardLiveQuery.data.data.liveData}
		{/if}
	</header>
	<MoveBackBtn path={'/publicdashboards'} text="Back to all dashboards" />

	{#if getPublicDashboardLiveQuery.isLoading}
		<LoadingTemplate />
	{:else if getPublicDashboardLiveQuery.isError}
		<ErrorTemplate error={getPublicDashboardLiveQuery.error?.message} />
	{:else if getPublicDashboardLiveQuery.isSuccess && getPublicDashboardLiveQuery.data?.data}
		{@const { dashboard, liveData } = getPublicDashboardLiveQuery.data.data}

		{#if dashboard.folders.length === 0}
			<NodataTemplate text="No folders..." />
		{:else}
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-start mt-2"
			>
				{#each dashboard.folders as folder (folder.subscriptionId ?? folder.id)}
					{@render folderCard({
						id: folder.id,
						name: folder.name,
						machineId: folder.machineId,
						tags: folder.tags,
						author: folder.user?.name ?? 'Unknown',
						machineData: liveData[folder.machineId]
					})}
				{/each}
			</div>
		{/if}
	{/if}
</main>
<svelte:window onfullscreenchange={handleFullscreenChange} />

{#snippet folderCard(info: {
	id: string;
	name: string;
	machineId: string;
	tags: { keyName: string }[];
	author: string;
	machineData?: Record<string, any>;
})}
	<article class="border rounded-xl p-3 bg-card shadow-sm w-full cardNormalize">
		<div class="border-b pb-1 mb-2 flex justify-between font-heading">
			<h3
				class="flex items-center gap-1.5 truncate text-sm font-semibold"
				title="📌 Created by: {info.author}"
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
			{#each info.tags as tag (tag.keyName)}
				{@const tagVal = info.machineData?.[tag.keyName]}

				{#if tagVal !== undefined}
					<!-- Live value -->
					<TagsValueDisplay tagName={tag.keyName} tagValue={tagVal} />
				{:else}
					<!-- Is offline -->
					<div class="text-muted-foreground text-sm flex justify-between px-1 py-0.5">
						<span class="truncate">{tag.keyName}:</span>
						<span class="text-destructive font-bold text-xs shrink-0">Offline</span>
					</div>
				{/if}
			{:else}
				<p class="text-xs text-muted-foreground italic py-2 text-center">No tags in folder</p>
			{/each}
		</div>
	</article>
{/snippet}

<!-- TV Mode -->
{#if isTvModeDashboard && getPublicDashboardLiveQuery.isSuccess && getPublicDashboardLiveQuery.data?.data}
	{@const { dashboard, liveData } = getPublicDashboardLiveQuery.data.data}

	<section class="fixed inset-0 z-50 bg-background flex flex-col p-6 overflow-y-auto select-none">
		<header class="flex justify-between items-center mb-6 border-b pb-4 shrink-0">
			<div class="flex items-center gap-6">
				<div>
					<h1
						class="text-3xl md:text-5xl font-heading font-black text-primary flex gap-3 items-center"
					>
						<Activity class="size-10 text-primary" />
						{dashboard.name}
						{#if getPublicDashboardLiveQuery.isFetching}
							<span
								out:fade={{ duration: 1000 }}
								class="size-3.5 rounded-full bg-green-500 animate-pulse ml-2"
								title="Live PLC polling"
							></span>
						{/if}
					</h1>
					<p class="text-base text-muted-foreground mt-1 font-medium">
						{dashboard.folders.length}
						{dashboard.folders.length === 1 ? 'folder' : 'folders'} active
					</p>
				</div>
			</div>

			<div class="flex gap-5">
				<!-- Time -->
				<div
					class="hidden sm:flex items-center gap-2.5 bg-muted/40 border px-4 py-2 rounded-xl text-muted-foreground font-mono text-xl md:text-2xl font-bold tracking-wider"
				>
					<Clock class="size-6 text-primary" />
					<span>{currentTime}</span>
				</div>
				<Button
					variant="destructive"
					size="lg"
					class="text-xl px-5 py-6 rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
					onclick={toggleTvMode}
					title="Exit TV Mode"
				>
					<Minimize2 class="size-7" />
				</Button>
			</div>
		</header>

		<div
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start w-full"
		>
			{#each dashboard.folders as folder (folder.subscriptionId ?? folder.id)}
				{@const machineData = liveData[folder.machineId] ?? {}}

				<article class="border-2 rounded-xl p-3.5 bg-card shadow-md flex flex-col">
					<div class="border-b pb-2 mb-2.5 flex justify-between items-center font-heading">
						<h3 class="flex items-center gap-2 truncate">
							<span class="font-black text-lg md:text-xl truncate">{folder.name}</span>
							<span
								class="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md"
							>
								{folder.machineId}
							</span>
						</h3>
					</div>

					<!-- Tags values -->
					<div class="flex flex-col gap-2">
						{#each folder.tags as tag (tag.keyName)}
							{@const tagVal = machineData[tag.keyName]}

							{#if tagVal !== undefined}
								<TvTagsValueDisplay tagName={tag.keyName} tagValue={tagVal} />
							{:else}
								<div
									class="flex flex-col items-center justify-center p-2.5 bg-muted/20 border border-destructive/30 border-dashed rounded-lg"
								>
									<p class="text-xs text-muted-foreground font-heading truncate">{tag.keyName}</p>
									<p class="text-xl font-black text-destructive mt-0.5 tracking-wider">OFFLINE</p>
								</div>
							{/if}
						{:else}
							<p class="text-xs text-muted-foreground text-center py-2 italic">No tags assigned</p>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	</section>
{/if}
