<script lang="ts">
	import { useMachinesList, useRemoveMachine } from '$lib/api/queries/machines';
	import Header from '../molecules/menu/HeaderPanel.svelte';
	import * as Sidebar from '../ui/sidebar/index';
	import { page } from '$app/state';
	import UserPanel from '../molecules/menu/UserPanel.svelte';
	import GlobalNavPanel from '../molecules/menu/GlobalNavPanel.svelte';
	import Input from '../ui/input/input.svelte';
	import Button from '../ui/button/button.svelte';
	import { Search, Trash, Trash2, X } from '@lucide/svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';

	const machines = useMachinesList();
	let isSearch = $state(false);
	let searchMachineQuery = $state('');
	let isMachDelete = $state(false);

	const deleteMachineMutation = useRemoveMachine();

	const filteredMachines = $derived(
		machines.data?.machines?.filter(
			(machine) => machine.name.toLowerCase().includes(searchMachineQuery) ?? []
		)
	);

	function handleDeleteMachine(machineId: string) {
		if (machineId) {
			deleteMachineMutation.mutate({ machineId });
			isMachDelete = false;
		}
	}

	// $inspect();
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Header />
	</Sidebar.Header>

	<Sidebar.Content>
		<!-- User  -->
		<UserPanel />
		<!-- Global nav -->
		<GlobalNavPanel />
		<!--  -->
		<!-- Machines -->
		<Sidebar.Group>
			<Sidebar.GroupLabel class="flex justify-between"
				><p>Machines</p>
				<div>
					{#if userStore.isAdmin && machines.data}
						<Button
							variant="ghost"
							size="icon-xs"
							class="{isMachDelete ? 'text-destructive' : 'text-muted-foreground'} size-5"
							title="Active machine delete btns"
							onclick={() => (isMachDelete = !isMachDelete)}><Trash2 class="size-3.5" /></Button
						>
					{/if}
					<Button
						size="icon-xs"
						variant="ghost"
						class="{isSearch ? 'text-green-500' : 'text-muted-foreground'} size-5"
						onclick={() => (isSearch = !isSearch)}><Search class="size-3.5" /></Button
					>
				</div>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#if machines.isPending}
						<span class="text-sm text-muted-foreground animate-pulse"
							>Loading active machines...</span
						>
					{:else if machines.isError}
						<span class="text-xs text-destructive">{machines.error?.message}</span>
					{:else if machines.data}
						{#if isSearch}
							<div class="relative">
								<Input
									type="text"
									bind:value={searchMachineQuery}
									placeholder="Search"
									class="inputNormalize pr-8 mb-2 px-2"
								/>
								{#if searchMachineQuery}
									<Button
										size="icon-xs"
										variant="ghost"
										class="absolute right-0 top-1/2 -translate-y-1/2  rounded-full"
										onclick={() => (searchMachineQuery = '')}
										title="Remove search"><X /></Button
									>
								{/if}
							</div>
						{/if}

						{#each filteredMachines as machine (machine.id)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton isActive={page.params.id === machine.id}>
									{#snippet child({ props })}
										<div class="flex items-center justify-between">
											<a href={`/machine/${machine.id}`} {...props}>
												<span class="font-semibold tracking-wide">{machine.name}</span>
											</a>
											{#if isMachDelete}
												<Button
													href="/"
													variant="ghost"
													class="text-destructive"
													size="icon-xs"
													onclick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														handleDeleteMachine(machine.id);
													}}
													><Trash />
												</Button>
											{/if}
										</div>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					{/if}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<!-- Footer -->
	<Sidebar.Footer>
		<div class="text-muted-foreground text-xs flex justify-between uppercase">
			<span>v·0.7 beta</span>
			<span class="tracking-widest">{userStore.user ? userStore.user.role : 'guest'}</span>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
