<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { ServerIcon } from '@lucide/svelte/icons';
	import type { CreateNewMachine } from '@datalink/shared';
	import { useAddNewMachine } from '$lib/api/queries/machines';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import SuccessTemplate from '$lib/components/atoms/SuccessTemplate.svelte';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';

	const addNewMachineMutate = useAddNewMachine();

	let formData: CreateNewMachine = $state({
		id: '',
		name: '',
		ip: '',
		rack: 0,
		slot: 1,
		interval: 3000
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		addNewMachineMutate.mutate(formData, {
			onSuccess: () => {
				formData.name = '';
				formData.ip = '';
				formData.id = '';
			},
			onError: (err) => {
				toast.error(err.message || 'Bad data');
			}
		});
	}

	$effect(() => {
		if (!userStore.isAdmin) {
			goto('/');
			toast.warning('Need authorization');
		}
	});
</script>

<main class="flex flex-col items-center justify-center min-h-[80vh]">
	<!-- Error/Success state -->
	{#if addNewMachineMutate.error && addNewMachineMutate.isError}
		<ErrorTemplate error={addNewMachineMutate.error} onClose={() => addNewMachineMutate.reset()} />
	{/if}

	{#if addNewMachineMutate.isSuccess && addNewMachineMutate.data}
		<SuccessTemplate
			onClose={() => addNewMachineMutate.reset()}
			message={'Machine has successfully added'}
			details={addNewMachineMutate.data}
		/>
	{/if}

	<article class="form-table">
		<!-- Header -->
		<section class="form-header">
			<div>
				<ServerIcon />
				<h2>Add new machine</h2>
			</div>
			<p>Add machine configuration parameters</p>
		</section>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="form-group">
			<!-- ID machine -->
			<InputGroup
				id="id"
				label="ID machine [short uniq name]"
				bind:value={formData.id}
				placeholder="MF1"
				type="text"
			/>
			<!-- Name machine -->
			<InputGroup
				id="name"
				label="Machine name *"
				type="text"
				bind:value={formData.name}
				placeholder="Middlefield machine 1"
			/>
			<!-- IP adress -->
			<InputGroup
				id="ip"
				label="IP adress *"
				bind:value={formData.ip}
				type="text"
				placeholder="10.184.159.173"
			/>
			<!-- Rack && Slot -->
			<div class="grid grid-cols-2 gap-4">
				<InputGroup id="rack" label="Rack *" value={formData.rack} type="number" min="0" />
				<InputGroup
					id="slot"
					label="Slot *"
					bind:value={formData.slot}
					type="number"
					required={true}
					min="0"
				/>
			</div>
			<!-- Interval -->
			<InputGroup
				id="interval"
				label="Polling Interval [default 3000 ms] *"
				bind:value={formData.interval}
				required={true}
				min="3000"
				max="30000"
			/>

			<!-- Btns -->
			<section class="pt-6 flex gap-3 *:flex-1 *:rounded-lg">
				<Button type="button" variant="outline" onclick={() => history.back()} class="">
					Cancel
				</Button>
				<Button type="submit" disabled={addNewMachineMutate.isPending} class="">
					{addNewMachineMutate.isPending ? 'Sending configuration...' : 'Submit'}
				</Button>
			</section>
		</form>
	</article>
</main>
