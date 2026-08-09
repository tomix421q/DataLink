<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAddNewTag } from '$lib/api/queries/machines';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';
	import SuccessTemplate from '$lib/components/atoms/SuccessTemplate.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { ArrowDownWideNarrow, ArrowUpWideNarrow, Check, Ruler } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';

	interface TagAdd {
		machineId: string;
		keyName: string;
		plcAddress: string;
	}

	const machineId = $derived(page.params.id!);
	const addNewTagMutate = useAddNewTag(() => machineId);
	let isGuidanceOpen = $state(false);
	let addedTags = $state<TagAdd[]>([]);
	let form: TagAdd = $state({
		machineId: '',
		keyName: '',
		plcAddress: ''
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const dataToSend = form;
		addNewTagMutate.mutate(dataToSend, {
			onSuccess: () => {
				addedTags = [...addedTags, { ...dataToSend }];
				toast.success('Tag added successfully');
				form.keyName = '';
				form.plcAddress = '';
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
		if (machineId) form.machineId = machineId;
	});

	// $inspect(addedTags);
</script>

<main class="min-h-[60vh] flex flex-col items-center justify-center">
	<!-- Error/Success state -->
	{#if addNewTagMutate.error && addNewTagMutate.isError}
		<ErrorTemplate error={addNewTagMutate.error} onClose={() => addNewTagMutate.reset()} />
	{/if}
	{#if addNewTagMutate.isSuccess && addNewTagMutate.data.ok}
		<SuccessTemplate
			message={'✅ Tag added'}
			details={addNewTagMutate.data.data}
			onClose={() => addNewTagMutate.reset()}
		/>
	{/if}

	<article class="form-table max-sm:w-full md:min-w-2xl!">
		<section class="form-header">
			<div>
				<Ruler />
				<h2>Add tag from plc</h2>
			</div>
			<p>Connect tag from plc to live tracking</p>
		</section>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="form-group">
			<!-- Machine ID [default] -->
			<InputGroup id="machineId" label="Machine ID [Default]" value={machineId} disabled={true} />

			<!-- Key name -->
			<InputGroup
				id="keyname"
				label="Tag name"
				bind:value={form.keyName}
				placeholder="User friendly name, example - Manual mode"
			/>

			<!-- Tag address -->
			<InputGroup
				id="address"
				label="Address"
				bind:value={form.plcAddress}
				placeholder="Tag address from plc, example  - DB1,X0.0"
			/>

			<!-- Guidance info-->
			<div>
				<Button
					variant={isGuidanceOpen ? 'outline' : 'ghost'}
					onclick={() => (isGuidanceOpen = !isGuidanceOpen)}
					class="flex justify-between text-sm uppercase font-heading tracking-widest font-bold text-muted-foreground underline underline-offset-4 cursor-pointer!"
					>Guidance
					{#if isGuidanceOpen}
						<ArrowUpWideNarrow />
					{:else}
						<ArrowDownWideNarrow class="stroke-3" />
					{/if}
				</Button>
				{#if isGuidanceOpen}
					{@render guidance()}
				{/if}
			</div>

			<!-- Btns -->
			<section class="pt-6 flex gap-3 *:flex-1 *:rounded-lg">
				<Button type="button" variant="outline" onclick={() => history.back()} class="">
					Cancel
				</Button>
				<Button type="submit" disabled={addNewTagMutate.isPending}>
					{addNewTagMutate.isPending ? 'Adding...' : 'Add'}
				</Button>
			</section>
		</form>
	</article>

	<!-- Added tags -->
	{#if addedTags.length > 0}
		{@render addedTagsTable()}
	{/if}
</main>

{#snippet addedTagsTable()}
	<section class="mt-12 border p-4 rounded-lg min-w-sm">
		{#each addedTags as tag (tag.keyName)}
			<div class="flex gap-3">
				<Check class="text-green-500 stroke-3" />
				<div class="flex items-center">
					<p class="smallKey">Name</p>
					<p class="smallValue">{tag.keyName}</p>
				</div>
				<div class="flex items-center">
					<p class="smallKey">Tag address</p>
					<p class="smallValue">{tag.plcAddress}</p>
				</div>
			</div>
		{/each}
	</section>
{/snippet}

{#snippet guidance()}
	<div class="*:hover:bg-muted *:p-1" transition:slide>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Bool</span>
			<p class="smallValue">X[byte].[bit]</p>
			<p class="smallValue text-primary">DB1,X0.0</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Byte (8-bit)</span>
			<p class="smallValue">B[byte] or BYTE[byte]</p>
			<p class="smallValue text-primary">DB1,B10</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Word (16-bit)</span>
			<p class="smallValue">WORD[byte]</p>
			<p class="smallValue text-primary">DB1,WORD260</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Char (Character)</span>
			<p class="smallValue">C[byte] or CHAR[byte]</p>
			<p class="smallValue text-primary">DB1,C11</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Integer (16-bit, whole number)</span>
			<p class="smallValue">INT[byte] or I[byte]</p>
			<p class="smallValue text-primary">DB5,INT2</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">DInteger (32-bit, large number)</span>
			<p class="smallValue">DINT[byte] or DI[byte]</p>
			<p class="smallValue text-primary">DB5,DINT4</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">Real (32-bit, floating-point)</span>
			<p class="smallValue">REAL[byte] or R[byte]</p>
			<p class="smallValue text-primary">DB2,REAL8</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-sm">
			<span class="smallKey">String (Text)</span>
			<p class="smallValue">S[byte].[max_length]</p>
			<p class="smallValue text-primary">DB3,S20.30</p>
		</div>
	</div>
{/snippet}
