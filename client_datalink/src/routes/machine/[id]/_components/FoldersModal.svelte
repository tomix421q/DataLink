<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';
	import {
		BookmarkPlusIcon,
		FolderPen,
		FoldersIcon,
		PinIcon,
		PinOff,
		Trash,
		UserStar
	} from '@lucide/svelte';
	import {
		useCreateNewUserFolder,
		useDeleteFolder,
		useGetAllUserFolders,
		useToggleTagInFolder
	} from '$lib/api/queries/favorites';
	import { page } from '$app/state';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { slide } from 'svelte/transition';

	let {
		tagName,
		isOtherFolder = false,
		isText,
		textDesign = false
	}: {
		tagName?: string;
		isOtherFolder: boolean;
		isText?: boolean;
		textDesign?: boolean;
	} = $props();

	const machineId = $derived(page.params.id!);
	const createNameMutate = useCreateNewUserFolder();
	const deleteNameMutate = useDeleteFolder();
	const toggleTagMutate = useToggleTagInFolder();
	const allFoldersBm = useGetAllUserFolders(() => machineId);

	let open = $state(false);
	let tab = $derived<'existbm' | 'createnewbm' | 'otherfolders'>(
		!isOtherFolder ? 'existbm' : 'otherfolders'
	);
	let newFolderName = $state('');

	let sortedFolders = $derived(
		allFoldersBm.data
			? [...allFoldersBm.data].sort((a, b) => {
					const aPinned = a.tags.some((t) => t.keyName === tagName);
					const bPinned = b.tags.some((t) => t.keyName === tagName);
					if (aPinned && !bPinned) return -1;
					if (!aPinned && bPinned) return 1;
					return 0;
				})
			: []
	);

	function handleCreateMb(e: SubmitEvent) {
		e.preventDefault();
		createNameMutate.mutate(
			{ machineId, name: newFolderName },
			{
				onSuccess: () => {
					newFolderName = '';
					tab = 'existbm';
				}
			}
		);
	}

	function handleDeleteMb(folderId: string) {
		deleteNameMutate.mutate({ machineId, folderId });
	}

	function handleToggle(folderId: string) {
		if (tagName) {
			toggleTagMutate.mutate({ machineId, folderId, tagName });
		}
	}

	// $inspect(allFoldersBm.data);
</script>

<Dialog.Root bind:open>
	<!-- Trigger btn -->
	<Dialog.Trigger class={textDesign ? 'w-full' : ''}>
		{#if textDesign}
			<div class="flex justify-start">Folders</div>
		{:else}
			<Button
				size={isText ? 'xs' : 'icon-xs'}
				variant={isText ? 'outline' : 'ghost'}
				title="Add/Remove from folder"
				class={isText ? '' : 'hover:text-red-500'}
			>
				<FolderPen class="size-4 {isText ? 'hidden' : 'block'}" />
				<span class={isText ? 'block' : 'hidden'}>My folders</span>
			</Button>
		{/if}
	</Dialog.Trigger>

	<Dialog.Content class="flex flex-col h-[425px] cardNormalize">
		<Dialog.Header>
			<Dialog.Title class="font-heading font-bold text-lg flex gap-1"
				><h3>Add / Remove</h3>
				{#if tagName}
					<span class="text-chart-2 underline underline-offset-3">{tagName}</span>
				{:else}
					folder
				{/if}
			</Dialog.Title>
			<Dialog.Description
				>Add / Remove tag to existing folder or create new folder</Dialog.Description
			>
		</Dialog.Header>

		<div class="mb-12">
			<section
				class="grid {userStore.isAdmin
					? 'grid-cols-3'
					: 'grid-cols-2'} gap-3 bg-secondary rounded-lg my-4"
			>
				<Button
					variant={tab === 'existbm' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => (tab = 'existbm')}
					class="rounded-xl"
				>
					<FoldersIcon /><span>Your folders</span>
				</Button>
				{#if userStore.isAdmin}
					<Button
						variant={tab === 'otherfolders' ? 'default' : 'ghost'}
						size="sm"
						onclick={() => (tab = 'otherfolders')}
						class="rounded-xl!"
					>
						<UserStar /><span>Other folders</span>
					</Button>
				{/if}
				<Button
					variant={tab === 'createnewbm' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => (tab = 'createnewbm')}
					class="rounded-xl!"
				>
					<BookmarkPlusIcon /><span>Create new</span>
				</Button>
			</section>

			<section class="p-1 h-full">
				{#if tab === 'existbm'}
					<!--  -->
					<!-- Existing folders -->
					<div>
						{#if allFoldersBm.isLoading}
							<LoadingTemplate />
						{:else if allFoldersBm.isError}
							<p>{allFoldersBm.error}</p>
						{:else if allFoldersBm.isSuccess}
							{#if allFoldersBm.data.filter((f) => f.userId === userStore.user?.id).length === 0}
								<NodataTemplate text="No folders..." size="sm" />
							{/if}

							{#each sortedFolders as folder}
								{#if folder.userId === userStore.user?.id}
									<div class="flex justify-between odd:bg-muted-foreground/5 p-1">
										<div class="flex items-center gap-0.5 text-sm">
											<Button
												size="icon-xs"
												variant="ghost"
												class="text-destructive"
												title="Remove"
												disabled={deleteNameMutate.isPending}
												onclick={(e) => {
													e.stopPropagation();
													handleDeleteMb(folder.id);
												}}><Trash /></Button
											>
											<p class="font-bold">{folder.name}</p>
											<p class="text-muted-foreground mb-0.5">({folder.tags.length})</p>
										</div>
										{#if tagName}
											<Button size="xs" variant="ghost" onclick={() => handleToggle(folder.id)}>
												{#if folder.tags.some((t) => t.keyName === tagName)}
													<span class="font-light">Remove</span>
													<PinOff class="text-chart-2 size-5" />
												{:else}
													<span class="font-light">Add-On</span>
													<PinIcon class="text-green-400 size-5" />
												{/if}
											</Button>
										{/if}
									</div>
								{/if}
							{/each}
						{/if}
					</div>
				{:else if tab === 'createnewbm'}
					<!--  -->
					<!-- Create new mb -->
					<form class="flex flex-col gap-2 justify-between" onsubmit={handleCreateMb}>
						<InputGroup
							id="mbname"
							label="Create new folder"
							bind:value={newFolderName}
							min="3"
							max="16"
							placeholder="Robot data"
							required
							classInput=" rounded-sm text-lg! p-4!"
							classLabel="text-muted-foreground pl-1 mb-1"
						/>
						<Button
							class="w-full mx-auto flex"
							size="lg"
							variant="secondary"
							type="submit"
							disabled={createNameMutate.isPending}>Create</Button
						>
					</form>
				{:else if tab === 'otherfolders'}
					{#if allFoldersBm.isSuccess}
						{#if allFoldersBm.data.filter((f) => f.userId !== userStore.user?.id).length === 0}
							<NodataTemplate text="No folders..." size="sm" />
						{/if}
						{#each sortedFolders as folder}
							{#if folder.userId !== userStore.user?.id}
								<div class="flex justify-between odd:bg-muted-foreground/5 p-1">
									<div class="flex items-center gap-0.5 text-sm">
										<Button
											size="icon-xs"
											variant="ghost"
											class="text-destructive"
											title="Remove"
											disabled={deleteNameMutate.isPending}
											onclick={(e) => {
												e.stopPropagation();
												handleDeleteMb(folder.id);
											}}><Trash /></Button
										>
										<p class="font-bold">{folder.name}</p>
										<p class="text-muted-foreground mb-0.5">({folder.tags.length})</p>
										<p class="text-muted-foreground mb-0.5">
											[{String(folder.user.name).split(' (')[0]}]
										</p>
									</div>
									{#if tagName}
										<Button size="xs" variant="ghost" onclick={() => handleToggle(folder.id)}>
											{#if folder.tags.some((t) => t.keyName === tagName)}
												<span class="font-light">Remove</span>
												<PinOff class="text-chart-2 size-5" />
											{:else}
												<span class="font-light">Add-On</span>
												<PinIcon class="text-green-400 size-5" />
											{/if}
										</Button>
									{/if}
								</div>
							{/if}
						{/each}
					{/if}
				{/if}
			</section>
		</div>

		<Dialog.Footer>
			<!-- Btns -->
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
