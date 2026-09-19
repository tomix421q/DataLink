<script lang="ts">
	import { ChevronRight, Rss, Trash } from '@lucide/svelte';
	import {
		useDeletePublicDashboard,
		useGetAllPublicDashboards
	} from '$lib/api/queries/public_favorites';
	import LoadingTemplate from '$lib/components/atoms/LoadingTemplate.svelte';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import NodataTemplate from '$lib/components/atoms/NodataTemplate.svelte';
	import { dateTimmeUTCformatter } from '$lib/utils/global';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';

	import ConfirmDelete from '$lib/components/atoms/ConfirmDelete.svelte';

	const getAllPublicDashboards = useGetAllPublicDashboards();
	type TypeDashboarItem = NonNullable<typeof getAllPublicDashboards.data>['data'][number];

	// apis
	const deleteDashboardsMutate = useDeletePublicDashboard();
	//vars
	let isConfirmDelete = $state(false);
	let selectedDashboards = $state<{ ids: string[]; names: string[] }>({ ids: [], names: [] });

	// funcs
	function handleDeleteSelected() {
		if (selectedDashboards.ids.length === 0) return;
		deleteDashboardsMutate.mutate(selectedDashboards.ids[0]);
		if (isConfirmDelete) {
			selectedDashboards = { ids: [], names: [] };

			isConfirmDelete = false;
		}
	}

	// $inspect(selectedDashboards);
</script>

<main class="p-4 md:p-8 max-w-screen-2xl mx-auto">
	<header class="mb-6 pb-2 border-b flex flex-col gap-3">
		<div class="flex items-center gap-3">
			<Rss class="size-8 text-primary" />
			<h1 class="text-xl md:text-3xl font-heading font-black">Public dashboards</h1>
		</div>
	</header>

	<!--  -->
	{#if getAllPublicDashboards.isLoading}
		<LoadingTemplate />
	{:else if getAllPublicDashboards.isError}
		<ErrorTemplate error={getAllPublicDashboards.error?.message} />
	{:else if getAllPublicDashboards.isSuccess}
		{#if getAllPublicDashboards.data?.data.length === 0}
			<NodataTemplate text="0 Public dashboards" />
		{/if}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
			{#each getAllPublicDashboards.data?.data as dashboard (dashboard.id)}
				{@render dashboardCard(dashboard)}
			{/each}
		</div>
	{/if}
</main>

{#snippet dashboardCard(dashboard: TypeDashboarItem)}
	<article class="cardNormalize w-full sm:max-w-sm relative overflow-hidden pb-4">
		<header class="">
			<h3 class="text-primary text-xl font-semibold">
				{dashboard.name}
			</h3>
			{#if dashboard.description}
				<p class="text-xs truncate w-[220px] cursor-help" title={dashboard.description}>
					<span class="text-muted-foreground mr-2">Description</span>
					<span class="">{dashboard.description}</span>
				</p>
			{:else}
				<p class="text-xs opacity-0">Empty</p>
			{/if}

			<p class="text-xs"><span class="text-muted-foreground mr-2">ID</span>{dashboard.id}</p>
			<p class="text-xs">
				<span class="text-muted-foreground mr-2">Created</span>{dateTimmeUTCformatter(
					dashboard.createdAt
				)}
			</p>

			<p class="text-xs">
				<span class="text-muted-foreground mr-2 text-xs">Last update</span>{dateTimmeUTCformatter(
					dashboard.updatedAt
				)}
			</p>
			<p class="text-xs">
				<span class="text-muted-foreground mr-2 text-xs">Total folders</span>
				{dashboard.folders.length}
			</p>
		</header>

		<Button
			href="/publicdashboards/{dashboard.id}"
			size="icon"
			variant="ghost"
			class="flex justify-center absolute -right-6 inset-y-0 my-auto size-20  rounded-full backdrop-blur-lg"
			><ChevronRight class="text-primary/30 size-20" /></Button
		>

		{#if userStore.isAdminOrEngineer}
			<Separator class="my-2" />
			<div class="flex justify-end">
				<Button
					onclick={() => {
						selectedDashboards.ids.push(dashboard.id);
						selectedDashboards.names.push(dashboard.name);
						isConfirmDelete = true;
					}}
					size="icon"
					variant="destructive"
					class="flex rounded-full"><Trash /></Button
				>
			</div>
		{/if}
	</article>
{/snippet}

<ConfirmDelete
	bind:isConfirmDelete
	bind:selectedItems={selectedDashboards.ids}
	bind:selectedNames={selectedDashboards.names}
	isPending={deleteDashboardsMutate.isPending}
	handleDelete={handleDeleteSelected}
	text="Confirm delete selected dashboard/s"
	showDeleteItems={true}
/>
