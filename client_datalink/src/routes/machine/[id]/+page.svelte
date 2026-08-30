<script lang="ts">
	import { page } from '$app/state';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { getContext } from 'svelte';
	import ButtonsLiveTags from './_components/ButtonsLiveTags.svelte';
	import { EllipsisVertical, X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import FoldersModal from './_components/FoldersModal.svelte';
	import Folders from './_components/Folders.svelte';
	import TagsValueDisplay from '$lib/components/molecules/TagsValueDisplay.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import InfoTagModal from './_components/InfoTagModal.svelte';
	import ConfirmDelete from '$lib/components/atoms/ConfirmDelete.svelte';
	import { useEditTag, useGetAllTags, useRemoveTagsFromTracking } from '$lib/api/queries/tags';

	const stream = getContext<SseMachineStream>('machine-stream');
	let machineId = $derived(page.params.id!);
	let isOnline = $derived(stream?.data?.connection?.online ?? false);
	let isConfirmDelete = $state(true);

	let toggleRemove = $state(false);
	let selectedTags = $state<string[]>([]);
	let searchQuery = $state('');
	const allTagsList = $derived.by(() => {
		if (!stream?.data) return [];
		const validTags = stream.data.plcData ? Object.entries(stream.data.plcData) : [];
		const errorTags = stream.data.connection?.tagErrors
			? Object.entries(stream.data.connection.tagErrors)
			: [];
		const validKeys = new Set(validTags.map(([k]) => k));
		const uniqueErrorTags = errorTags.filter(([k]) => !validKeys.has(k));
		return [...validTags, ...uniqueErrorTags];
	});
	let filteredTags = $derived(
		allTagsList.filter(([tagName]) => tagName.toLowerCase().includes(searchQuery.toLowerCase())) ??
			[]
	);
	let hasTags = $derived(allTagsList.length > 0);

	const allTagsDb = useGetAllTags(() => machineId);
	const deleteTagsMutation = useRemoveTagsFromTracking();
	const editTag = useEditTag(() => machineId);

	function handleDeleteSelected() {
		if (selectedTags.length === 0) return;
		deleteTagsMutation.mutate(
			{ machineId, tagsNames: selectedTags },
			{
				onSuccess: () => {
					selectedTags = [];
					toggleRemove = false;
					isConfirmDelete = false;
				}
			}
		);
		if (isConfirmDelete) {
			selectedTags = [];
			isConfirmDelete = false;
		}
	}

	let tagEditInput = $state<{
		tagId: string | null;
		keyName: string;
		plcAddress: string;
	}>({
		tagId: null,
		keyName: '',
		plcAddress: ''
	});
	function handleEditTag(e: Event) {
		e.preventDefault();
		if (!tagEditInput.tagId) return;
		editTag.mutate({
			tagId: tagEditInput.tagId,
			data: { keyName: tagEditInput.keyName, plcAddress: tagEditInput.plcAddress, machineId }
		});
	}
	function toggleTagSelection(tagName: string, isChecked: boolean) {
		if (isChecked) {
			selectedTags.push(tagName);
		} else {
			selectedTags = selectedTags.filter((t) => t !== tagName);
		}
	}

	// $inspect(allTagsDb.data);
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

			<!-- FOLDERS -->
			<Folders {stream} />
			<!-- All tags  -->
			<section class="mb-10 border-t animate-in fade-in slide-in-from-bottom-8 duration-1000">
				<article class="sm:flex items-center justify-between my-5">
					<div class="flex items-end gap-4">
						<p class="text-xl font-heading font-bold">All Live tags</p>
					</div>

					<div class="flex sm:items-center gap-2 max-sm:flex-col">
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
									class="absolute right-0 top-1  rounded-full"
									onclick={() => (searchQuery = '')}
									title="Remove search"><X /></Button
								>
							{/if}
						</div>
						<ButtonsLiveTags
							bind:selectedTags
							bind:toggleRemove
							{handleDeleteSelected}
							{deleteTagsMutation}
							isMachineOnline={isOnline}
							hasTrackingTags={hasTags}
						/>
					</div>
				</article>

				<article class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-2">
					{#if allTagsList.length === 0 && !stream.data.connection.error}
						<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
					{/if}
					{#if stream.data.connection.error}
						<p class="text-muted-foreground italic text-sm col-span-full mb-6">
							Problem with connect to machine check network or machine...
						</p>
					{/if}
					{#each filteredTags as [tagName, tagValue] (tagName)}
						{@const tagError = stream.data?.connection?.tagErrors?.[tagName]}
						{@const isBadTag = tagError !== undefined}
						<div
							class="flex items-center p-2 rounded-lg border transition-all group max-w-full cardNormalize2"
							tabindex="-1"
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
							{#if isBadTag}
								<div
									class="text-sm gap-1 text-destructive flex items-center"
									title="Bad address or network connection"
								>
									<span class="text-muted-foreground">{tagName}:</span>
									{tagError}
								</div>
							{:else}
								<!-- Dipslay tagname-tagvalue -->
								<TagsValueDisplay {tagName} {tagValue} />
							{/if}

							<!-- Add to bookmark -->
							<div class="ml-auto items-center justify-center">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="cursor-pointer flex items-center text-muted-foreground hover:text-secondary-foreground"
										><EllipsisVertical /></DropdownMenu.Trigger
									>
									<DropdownMenu.Content>
										<DropdownMenu.Group class="**:cursor-pointer">
											<!-- <DropdownMenu.Label>Menu</DropdownMenu.Label> -->
											<!-- <DropdownMenu.Separator /> -->
											{#if userStore.user}
												<DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
													<FoldersModal
														{tagName}
														isOtherFolder={false}
														isText={true}
														textDesign={true}
													/></DropdownMenu.Item
												>
											{/if}

											{#if allTagsDb.isSuccess && allTagsDb.data?.ok}
												{@const tag = allTagsDb.data.allTags.find((v) => v.keyName === tagName)}

												{#if tag}
													<DropdownMenu.Item onSelect={(e) => e.preventDefault()}>
														<InfoTagModal {tag} />
													</DropdownMenu.Item>
												{/if}
											{/if}

											{#if userStore.isAdmin}
												<!-- <DropdownMenu.Item>Modify</DropdownMenu.Item> -->
												<DropdownMenu.Item
													class="text-destructive hover:text-destructive!"
													onclick={() => {
														selectedTags.push(tagName);
														isConfirmDelete = true;
													}}
												>
													Delete
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
					{/each}
				</article>
			</section>
		{/if}
	</div>

	<ConfirmDelete
		bind:isConfirmDelete
		selectedItems={selectedTags}
		isPending={deleteTagsMutation.isPending}
		handleDelete={handleDeleteSelected}
		text="Confirm delete selected tags"
		showDeleteItems={true}
	/>
</main>
