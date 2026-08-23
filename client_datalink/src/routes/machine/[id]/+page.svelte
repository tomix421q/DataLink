<script lang="ts">
	import { page } from '$app/state';
	import { useRemoveTagsFromTracking } from '$lib/api/queries/machines';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { getContext } from 'svelte';
	import ButtonsLiveTags from './_components/ButtonsLiveTags.svelte';
	import { X } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import FoldersModal from './_components/FoldersModal.svelte';
	import Folders from './_components/Folders.svelte';
	import TagsValueDisplay from '$lib/components/molecules/TagsValueDisplay.svelte';

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

	const deleteTagsMutation = useRemoveTagsFromTracking();

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

	// $inspect(toggleDashboardSubscribeMutate.data?.message);
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
									class="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
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

				<article
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2"
				>
					{#if stream.totalTrackingTags === 0 && !stream.data.connection.error}
						<p class="text-muted-foreground italic text-sm">No tags added yet...</p>
					{/if}
					{#if stream.data.connection.error}
						<p class="text-muted-foreground italic text-sm">
							Problem with connect to machine check network or machine
						</p>
					{/if}
					{#each filteredTags as [tagName, tagValue]}
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
							<!-- Dipslay tagname-tagvalue -->
							<TagsValueDisplay {tagName} {tagValue} />

							<!-- Add to bookmark -->
							<div
								class="ml-auto size-5 items-center justify-center group-focus:flex hidden sm:group-hover:flex"
							>
								{#if userStore.user}
									<FoldersModal {tagName} />
								{/if}
							</div>
						</div>
					{/each}
				</article>
			</section>
		{/if}
	</div>
</main>
