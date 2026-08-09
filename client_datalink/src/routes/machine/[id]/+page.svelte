<script lang="ts">
	import { page } from '$app/state';
	import { useRemoveTagsFromTracking } from '$lib/api/queries/machines';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { getContext } from 'svelte';
	import ButtonsPage from './_components/ButtonsPage.svelte';
	import AddToBookmarksModal from './_components/AddToBookmarksModal.svelte';
	import { useGetAllUserFolders, useToggleFolderDashboard } from '$lib/api/queries/favorites';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import { FolderSearch, LayoutDashboard, LogIn, Minimize2, Trash, Tv, X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';

	const stream = getContext<SseMachineStream>('machine-stream');
	let machineId = $derived(page.params.id!);

	let isOnline = $derived(stream?.data?.connection?.online ?? false);
	let hasTags = $derived((stream?.totalTrackingTags ?? 0) > 0);
	let toggleRemove = $state(false);
	let selectedTags = $state<string[]>([]);
	let searchQuery = $state('');
	let filteredTags = $derived(
		stream?.tagsList?.filter(([tagName]) =>
			tagName.toLowerCase().includes(searchQuery.toLowerCase())
		) ?? []
	);

	const allFoldersBm = useGetAllUserFolders(() => machineId);
	const deleteTagsMutation = useRemoveTagsFromTracking();
	const toggleDashboardMutate = useToggleFolderDashboard();

	let tvModeFolderId = $state<string | null>(null);
	let tvFolder = $derived(allFoldersBm.data?.find((f) => f.id === tvModeFolderId));

	function handleToggleMainDashboard(folderId: string, currentState: boolean) {
		toggleDashboardMutate.mutate({
			machineId,
			folderId,
			show: !currentState // Pošleme opačnú hodnotu
		});
	}

	function toggleTvMode(folderId: string | null) {
		tvModeFolderId = folderId;
		if (folderId && document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen().catch(() => {});
		} else if (!folderId && document.exitFullscreen) {
			document.exitFullscreen().catch(() => {});
		}
	}

	function handleDeleteSelected() {
		if (selectedTags.length === 0) return;
		deleteTagsMutation.mutate(
			{ machineId, tagsNames: selectedTags },
			{
				onSuccess: () => {
					selectedTags = [];
					toggleRemove = false;
				}
			}
		);
	}
	function toggleTagSelection(tagName: string, isChecked: boolean) {
		if (isChecked) {
			selectedTags.push(tagName);
		} else {
			selectedTags = selectedTags.filter((t) => t !== tagName);
		}
	}

	$effect(() => {
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement && tvModeFolderId) {
				tvModeFolderId = null;
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});

	// $inspect(allFoldersBm.data);
</script>

<main>
	<div class="mt-5">
		{#if stream?.data}
			<!-- Connection sse stream error -->
			{#if !stream.data.connection.online && stream.data.connection.error}
				<div class="mb-8">
					<p>
						<span class="text-destructive font-semibold">Error:</span>
						<span>{stream.data.connection.error}</span>
					</p>
					<p>
						<span class="text-destructive font-semibold">Info: </span> No connection with machine
					</p>
				</div>
			{/if}

			<!-- Folders favorite -->
			<section class="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500 group">
				<div class="text-xl font-heading font-bold mb-4 flex">
					<h2>My live Folders</h2>
					<div class="ml-1 size-7 flex items-center justify-center">
						<AddToBookmarksModal />
					</div>
				</div>

				{#if allFoldersBm.isError}
					{#if allFoldersBm.error.message.includes('Unauthorized')}
						<div class="flex justify-center">
							<Button href="/auth/login" size="lg" variant="outline"
								><LogIn /> Please login to access folders</Button
							>
						</div>
					{:else}
						<ErrorTemplate error={allFoldersBm.error} />
					{/if}
				{:else if allFoldersBm.isPending}
					<LoadingTemplate />
				{:else if allFoldersBm.isSuccess}
					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 justify-start"
					>
						{#if allFoldersBm.data.length === 0}
							<p class="text-muted-foreground italic text-sm">No folders created yet...</p>
						{/if}
						{#each allFoldersBm.data as folder}
							{#if folder.tags.length > 0 || folder.showOnMainDashboard}
								<article
									class="border rounded-xl p-3 bg-card shadow-sm w-full sm:min-w-[250px] sm:max-w-full! cardNormalize"
								>
									<div class="border-b pb-1 mb-2 flex place-items-end justify-between font-heading">
										<h3 class="flex items-center gap-1">
											<span class="font-bold">{folder.name}</span>
											<span class="text-xs text-muted-foreground">[{folder.tags.length}]</span>
										</h3>
										<div class="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon-xs"
												title={folder.showOnMainDashboard
													? 'Remove from Main Dashboard'
													: 'Pin to Main Dashboard'}
												class="{folder.showOnMainDashboard
													? 'text-green-500'
													: 'text-muted-foreground hover:text-primary'} mt-0.5"
												onclick={() =>
													handleToggleMainDashboard(folder.id, folder.showOnMainDashboard)}
												disabled={toggleDashboardMutate.isPending}
											>
												<LayoutDashboard class="size-5" />
											</Button>
											<Button
												variant="ghost"
												size="icon-xs"
												title="TV Mode"
												class="text-muted-foreground"
												onclick={() => toggleTvMode(folder.id)}><Tv class="size-5" /></Button
											>
										</div>
									</div>

									<div class="flex flex-col gap-1 2xl:grid 2xl:grid-cols-2">
										{#if folder.tags.length === 0}
											<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
										{/if}
										{#each folder.tags as savedTag}
											{@const liveTag = stream.tagsList.find(([name]) => name === savedTag.keyName)}
											{#if liveTag}
												<div class="flex items-center group">
													{@render tagValueDisplay(liveTag[0], liveTag[1])}
													<!-- Add to bookmark -->
													<div class="ml-1 size-5 flex items-center justify-center">
														<AddToBookmarksModal tagName={liveTag[0]} />
													</div>
												</div>
											{:else}
												<p class="text-muted-foreground text-sm">{savedTag.keyName}: Offline</p>
											{/if}
										{/each}
									</div>
								</article>
							{/if}
						{/each}
					</div>
				{/if}
			</section>

			<!-- All tags  -->
			<section class="border-t animate-in fade-in slide-in-from-bottom-8 duration-1000">
				<article class="sm:flex items-center justify-between my-5">
					<div class="flex items-end gap-4">
						<p class="text-xl font-heading font-bold">All Live tags</p>
					</div>

					<div class="flex items-center gap-2">
						<div class="relative">
							<Input
								type="text"
								bind:value={searchQuery}
								placeholder="Search tag"
								class="inputNormalize sm:w-[140px] pr-8"
							/>
							{#if searchQuery}
								<Button
									size="icon-xs"
									variant="destructive"
									class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
									onclick={() => (searchQuery = '')}
									title="Remove search"><X /></Button
								>
							{/if}
						</div>
						<ButtonsPage
							bind:selectedTags
							bind:toggleRemove
							{handleDeleteSelected}
							{deleteTagsMutation}
							isMachineOnline={isOnline}
							hasTrackingTags={hasTags}
						/>
					</div>
				</article>

				<article
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2"
				>
					{#if stream.totalTrackingTags === 0}
						<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
					{/if}
					{#each filteredTags as [tagName, tagValue]}
						<div
							class="flex items-center p-2 rounded-lg border transition-all group max-w-full cardNormalize2"
						>
							<!-- IF toggle remove -->
							{#if toggleRemove}
								<div class="mr-2 flex items-center justify-center">
									<Checkbox
										checked={selectedTags.includes(tagName)}
										onCheckedChange={(v) => toggleTagSelection(tagName, v as boolean)}
										class="cursor-pointer dark:bg-secondary-foreground"
									/>
								</div>
							{/if}
							{@render tagValueDisplay(tagName, tagValue)}

							<!-- Add to bookmark -->
							<div class="ml-auto flex items-center justify-center">
								{#if userStore.user}
									<AddToBookmarksModal {tagName} />
								{/if}
							</div>
						</div>
					{/each}
				</article>
			</section>
		{/if}
	</div>
</main>

{#snippet tagValueDisplay(tagName: string, tagValue: any)}
	{@const tagValueSliceText =
		String(tagValue).length > 16 ? String(tagValue).slice(0, 15) + '...' : String(tagValue)}

	<section class="flex gap-1 text-sm items-center pr-1">
		<p class="text-muted-foreground truncate">{tagName}:</p>
		<p>
			{#if typeof tagValue === 'boolean'}
				<span class={tagValue ? 'text-green-500 font-bold' : 'text-destructive font-bold'}>
					{tagValue ? 'true' : 'false'}
				</span>
			{:else}
				<span
					class="font-bold truncate {tagValue.length > 16 ? 'cursor-help' : ''}"
					title={tagValue.length > 16 ? tagValue : null}>{tagValueSliceText}</span
				>
			{/if}
		</p>
	</section>
{/snippet}

{#snippet tvTagValueDisplay(tagName: string, tagValue: any)}
	<div
		class="flex flex-col items-center justify-center p-8 bg-card border-2 border-secondary rounded-2xl shadow-xl"
	>
		<p class="text-3xl text-muted-foreground font-heading mb-4 truncate w-full text-center">
			{tagName}
		</p>

		{#if typeof tagValue === 'boolean'}
			<span
				class="text-6xl font-black {tagValue ? 'text-green-500' : 'text-destructive'} uppercase"
			>
				{tagValue ? 'true' : 'false'}
			</span>
		{:else}
			<span class="text-7xl font-black text-primary truncate max-w-full" title={String(tagValue)}>
				{tagValue ?? '--'}
			</span>
		{/if}
	</div>
{/snippet}

{#if tvFolder}
	<div class="fixed inset-0 z-50 bg-background flex flex-col p-8 overflow-y-auto">
		<header class="flex justify-between items-center mb-8 border-b pb-6">
			<div>
				<h1 class="text-5xl font-heading font-black text-primary">{tvFolder.name}</h1>
				<p class="text-xl text-muted-foreground mt-2">
					Live Data [{tvFolder.tags.length}]
				</p>
			</div>

			<Button
				variant="destructive"
				size="lg"
				class="text-xl px-6 py-6 rounded-xl flex items-center gap-2 shadow-lg"
				onclick={() => toggleTvMode(null)}
			>
				<Minimize2 class="size-6" />
			</Button>
		</header>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
			{#each tvFolder.tags as savedTag}
				{@const liveTag = stream?.tagsList.find(([name]) => name === savedTag.keyName)}

				{#if liveTag}
					{@render tvTagValueDisplay(liveTag[0], liveTag[1])}
				{:else}
					<div
						class="flex flex-col items-center justify-center p-8 bg-card border-2 border-dashed border-muted rounded-2xl opacity-50"
					>
						<p class="text-3xl text-muted-foreground font-heading mb-4 text-center">
							{savedTag.keyName}
						</p>
						<span class="text-5xl font-black text-muted-foreground">Offline</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
