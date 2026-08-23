<script lang="ts">
	import { page } from '$app/state';
	import {
		useGetAllPublicFolders,
		useGetAllUserFolders,
		useToggleFolderDashboard,
		useToggleFolderSubscribe
	} from '$lib/api/queries/favorites';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { LayoutDashboard, LogIn, Minimize2, Tv } from '@lucide/svelte';
	import FoldersModal from './FoldersModal.svelte';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import type { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import TagsValueDisplay from '$lib/components/molecules/TagsValueDisplay.svelte';
	import TvTagsValueDisplay from '$lib/components/molecules/TvTagsValueDisplay.svelte';

	let { stream }: { stream: SseMachineStream } = $props();
	let machineId = $derived(page.params.id!);

	// apis
	const allFoldersBm = useGetAllUserFolders(() => machineId);
	const allFoldersBmPublic = useGetAllPublicFolders(() => machineId);
	const toggleDashboardMutate = useToggleFolderDashboard();
	const toggleDashboardSubscribeMutate = useToggleFolderSubscribe();

	// vars
	let tvModeFolderId = $state<string | null>(null);
	let tvFolder = $derived(allFoldersBm.data?.find((f) => f.id === tvModeFolderId));
	let tvFolderPublic = $derived(allFoldersBmPublic.data?.find((f) => f.id === tvModeFolderId));

	// func
	function handleToggleMainDashboard(folderId: string, currentState: boolean) {
		toggleDashboardMutate.mutate({
			machineId,
			folderId,
			show: !currentState // Pošleme opačnú hodnotu
		});
	}
	function handleToggleSubscribeFolder(folderId: string) {
		toggleDashboardSubscribeMutate.mutate({ folderId, machineId });
	}
	function toggleTvMode(folderId: string | null) {
		tvModeFolderId = folderId;
		if (folderId && document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen().catch(() => {});
		} else if (!folderId && document.exitFullscreen) {
			document.exitFullscreen().catch(() => {});
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
</script>

<main>
	<!-- Folders favorite user -->
	<section
		class="mb-10 animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-20 max-h-[1000px] overflow-y-auto snap-y snap-mandatory"
	>
		<div class="text-xl font-heading font-bold mb-4 flex justify-between" tabindex="-1">
			<h2>My live Folders</h2>
			{#if userStore.user}
				<FoldersModal isText={true} isOtherFolder={false} />
			{/if}
		</div>

		{#if allFoldersBm.isError}
			{#if !userStore.user}
				<div class="flex justify-center">
					<Button href="/auth/login" size="lg" variant="outline"
						><LogIn /> Please login to access folders</Button
					>
				</div>
			{:else}
				<ErrorTemplate error={allFoldersBm.error} />
			{/if}
		{:else if allFoldersBm.isPending}
			<LoadingTemplate transparant={true} />
		{:else if allFoldersBm.isSuccess}
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 justify-start"
			>
				{#if allFoldersBm.data.filter((f) => f.userId === userStore.user?.id).length === 0}
					<p class="text-muted-foreground italic text-sm">No folders created yet...</p>
				{/if}
				{#each allFoldersBm.data as folder}
					{#if (folder.tags.length > 0 || folder.showOnMainDashboard) && folder.userId === userStore.user?.id}
						<article
							class="border rounded-xl p-3 bg-card shadow-sm w-full sm:min-w-[250px]! sm:max-w-full! cardNormalize snap-center"
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
											: 'Add to Main Dashboard'}
										class="{folder.showOnMainDashboard
											? 'text-green-500 hover:text-green-600'
											: 'text-muted-foreground'} mt-0.5"
										onclick={() => handleToggleMainDashboard(folder.id, folder.showOnMainDashboard)}
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

							<div class="flex flex-col gap-1">
								{#if folder.tags.length === 0}
									<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
								{/if}
								{#each folder.tags as savedTag}
									{@const liveTag = stream.tagsList.find(([name]) => name === savedTag.keyName)}
									<div class="group" tabindex="-1">
										{#if liveTag}
											<div class="flex items-center">
												<TagsValueDisplay tagName={liveTag[0]} tagValue={liveTag[1]} />
												<!-- Add to bookmark -->
												<div
													class="ml-1 size-4 items-center group-focus:flex hidden sm:group-hover:flex"
												>
													<FoldersModal tagName={liveTag[0]} isOtherFolder={false} />
												</div>
											</div>
										{:else}
											<p class="text-muted-foreground text-sm">{savedTag.keyName}: Offline</p>
										{/if}
									</div>
								{/each}
							</div>
						</article>
					{/if}
				{/each}
			</div>
		{/if}
	</section>

	<!-- Folders favorite public -->
	<section
		class="mb-10 animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-20 max-h-[1000px] overflow-y-auto snap-y snap-mandatory"
	>
		<div class="text-xl font-heading font-bold mb-4 flex justify-between" tabindex="-1">
			<h2>Public live Folders</h2>
		</div>

		{#if allFoldersBmPublic.isError}
			<div class="flex justify-center">
				<ErrorTemplate error={allFoldersBmPublic.error} />
			</div>
		{:else if allFoldersBmPublic.isPending}
			<LoadingTemplate />
		{:else if allFoldersBmPublic.isSuccess}
			<div
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-4 justify-start"
			>
				{#if allFoldersBmPublic.data.length === 0}
					<p class="text-muted-foreground italic text-sm">No folders created yet...</p>
				{/if}
				{#each allFoldersBmPublic.data as folder}
					{#if folder.tags.length > 0}
						<article
							class="border rounded-xl p-3 bg-card shadow-sm w-full sm:min-w-[250px]! sm:max-w-full! cardNormalize snap-center"
						>
							<div class="border-b pb-1 mb-2 flex place-items-end justify-between font-heading">
								<h3
									class="flex items-center gap-1 cursor-text"
									title={String('Created:' + folder.user.name).split('(')[0]}
								>
									<span class="font-bold">{folder.name}</span>
									<span class="text-xs text-muted-foreground">[{folder.tags.length}] </span>
								</h3>
								<div class="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon-xs"
										title={folder.subscriptions.find((v) => v.folderId === folder.id)
											? 'Remove from Main Dashboard'
											: 'Add to Main Dashboard'}
										class="{folder.subscriptions.find((v) => v.folderId === folder.id)
											? 'text-green-500 hover:text-green-600'
											: 'text-muted-foreground'} mt-0.5"
										onclick={() => {
											if (userStore.user) {
												handleToggleSubscribeFolder(folder.id);
											}
										}}
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

							<div class="flex flex-col gap-1">
								{#if folder.tags.length === 0}
									<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
								{/if}
								{#each folder.tags as savedTag}
									{@const liveTag = stream.tagsList.find(([name]) => name === savedTag.keyName)}
									<div class="group" tabindex="-1">
										{#if liveTag}
											<div class="flex items-center">
												<TagsValueDisplay tagName={liveTag[0]} tagValue={liveTag[1]} />
												<!-- Add to bookmark -->
												{#if userStore.isAdmin}
													<div
														class="ml-1 size-4 items-center group-focus:flex hidden sm:group-hover:flex"
													>
														<FoldersModal tagName={liveTag[0]} isOtherFolder={true} />
													</div>
												{/if}
											</div>
										{:else}
											<p class="text-muted-foreground text-sm">{savedTag.keyName}: Offline</p>
										{/if}
									</div>
								{/each}
							</div>
						</article>
					{/if}
				{/each}
			</div>
		{/if}
	</section>
</main>

{#if tvFolder}
	<div class="fixed inset-0 z-50 bg-background flex flex-col p-8 overflow-y-auto">
		<header class="flex justify-between items-center mb-8 border-b pb-6">
			<div>
				<h1 class="text-5xl font-heading font-black text-primary">{tvFolder?.name}</h1>
				<p class="text-xl text-muted-foreground mt-2">
					Live Data [{tvFolder?.tags.length}]
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
			{#each tvFolder?.tags as savedTag}
				{@const liveTag = stream?.tagsList.find(([name]) => name === savedTag.keyName)}

				{#if liveTag}
					<TvTagsValueDisplay tagName={liveTag[0]} tagValue={liveTag[1]} />
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

{#if tvFolderPublic}
	<div class="fixed inset-0 z-50 bg-background flex flex-col p-8 overflow-y-auto">
		<header class="flex justify-between items-center mb-8 border-b pb-6">
			<div>
				<h1 class="text-5xl font-heading font-black text-primary">{tvFolderPublic?.name}</h1>
				<p class="text-xl text-muted-foreground mt-2">
					Live Data [{tvFolderPublic?.tags.length}]
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
			{#each tvFolderPublic?.tags as savedTag}
				{@const liveTag = stream?.tagsList.find(([name]) => name === savedTag.keyName)}

				{#if liveTag}
					<TvTagsValueDisplay tagName={liveTag[0]} tagValue={liveTag[1]} />
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
