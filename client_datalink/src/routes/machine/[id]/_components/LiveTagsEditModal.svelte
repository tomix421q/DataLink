<script lang="ts">
	import { page } from '$app/state';
	import { useEditTag } from '$lib/api/queries/tags';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { ArrowDownWideNarrow, ArrowUpWideNarrow } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { slide } from 'svelte/transition';

	interface TagAdd {
		tagId: string;
		data: {
			keyName: string;
			plcAddress: string;
			machineId: string;
		};
	}

	let { tagId, tagName, address }: { tagId: string; tagName: string; address: string } = $props();

	let machineId = $derived(page.params.id!);

	//apis
	const editTagMutate = useEditTag(() => machineId);

	// vars
	let open = $state(false);
	let isGuidanceOpen = $state(false);
	// svelte-ignore state_referenced_locally
	let form: TagAdd = $state({
		tagId: tagId,
		data: {
			machineId: machineId,
			keyName: tagName,
			plcAddress: address
		}
	});

	// func
	function handleSubmit(e: Event) {
		e.preventDefault();
		const dataToSend = form;
		editTagMutate.mutate(dataToSend, {
			onSuccess: () => {
				form.data.keyName = '';
				form.data.plcAddress = '';
				open = false;
				// ...
			},
			onError: (err) => {
				toast.error(err.message || 'Bad data');
			}
		});
	}

	$effect(() => {
		form.tagId = tagId;
		if (open) {
			if (!tagId) {
				open = false;
				toast.error('Problem with tag id (not exist)');
				return;
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="w-full">
		<div class="flex justify-start">Edit</div>
	</Dialog.Trigger>

	<!-- content -->
	<Dialog.Content class="flex flex-col cardNormalize lg:min-w-2xl scroll-auto">
		<Dialog.Header>
			<Dialog.Title class="font-heading flex font-bold flex-col text-xl gap-1 items-center">
				<h3>Edit tag <span class="text-chart-2 underline underline-offset-3">{tagName}</span></h3>
			</Dialog.Title>
			<Dialog.Description class="mx-auto"
				>Edit tag name: {tagName} or plc address: {address}
				- {tagId}
			</Dialog.Description>
		</Dialog.Header>

		<section>
			<form onsubmit={handleSubmit} class="form-group shadow-none">
				<!-- Machine ID [default] -->
				<InputGroup id="machineId" label="Machine ID [Default]" value={machineId} disabled={true} />
				<!-- Tag ID [default] -->
				<InputGroup id="tagid" label="Tag ID [Default]" value={tagId} disabled={true} />

				<!-- Key name -->
				<InputGroup
					id="keyname"
					label="Tag name"
					bind:value={form.data.keyName}
					placeholder="User friendly name, example - Manual mode"
				/>

				<!-- Tag address -->
				<InputGroup
					id="address"
					label="Address"
					bind:value={form.data.plcAddress}
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
					<Button type="submit" disabled={editTagMutate.isPending}>
						{editTagMutate.isPending ? 'Editing...' : 'Edit'}
					</Button>
				</section>
			</form>
		</section>
	</Dialog.Content>
</Dialog.Root>

{#snippet guidance()}
	<div class="*:hover:bg-muted *:p-1 max-sm:max-h-[150px] overflow-y-auto" transition:slide>
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
