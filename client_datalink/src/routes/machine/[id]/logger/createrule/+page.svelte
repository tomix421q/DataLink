<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useCreateLoggerRule } from '$lib/api/queries/logger';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { ROLES, type CreateRuleInput } from '@datalink/shared';
	import * as RadioGroup from '$lib/components/ui/radio-group/index';
	import * as Select from '$lib/components/ui/select/index';
	import { toast } from 'svelte-sonner';
	import type { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { getContext } from 'svelte';
	import ErrorTemplate from '$lib/components/atoms/ErrorTemplate.svelte';
	import SuccessTemplate from '$lib/components/atoms/SuccessTemplate.svelte';
	import { Ruler } from '@lucide/svelte';
	import InputGroup from '$lib/components/atoms/InputGroup.svelte';

	const createRuleMutate = useCreateLoggerRule();
	const stream = getContext<SseMachineStream>('machine-stream');
	const machineId = $derived(page.params.id);

	const triggerLabels: Record<CreateRuleInput['triggerType'], string> = {
		CHANGE: 'When value change',
		TIME: 'Time interval',
		EDGE: 'Edge condition (IF)'
	};

	let form: CreateRuleInput = $state({
		name: '',
		machineId: '',
		triggerType: 'CHANGE',
		interval: 5,
		tags: [] as string[],
		triggerTag: '',
		triggerOperator: '==',
		triggerValue: 'true'
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const dataToSend = {
			...form,
			interval: form.interval ? form.interval * 1000 : undefined
		};
		createRuleMutate.mutate(dataToSend, {
			onSuccess: () => {
				toast.success('Success');
				form.name = '';
			},
			onError: (err) => {
				toast.error(err.message || 'Bad data');
			}
		});
	}

	$effect(() => {
		if (userStore.user?.role != ROLES.ENGINEER && userStore.user?.role != ROLES.ADMIN) {
			goto('/');
			toast('Need authorization');
		}
		if (machineId) form.machineId = machineId;
	});

	// $inspect(stream.tagsList);
</script>

<main
	class="min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-left-12 duration-800"
>
	<!-- Error/Success state -->
	{#if createRuleMutate.error && createRuleMutate.isError}
		<ErrorTemplate error={createRuleMutate.error} onClose={() => createRuleMutate.reset()} />
	{/if}

	{#if createRuleMutate.isSuccess && createRuleMutate.data.ok}
		<SuccessTemplate
			onClose={() => createRuleMutate.reset()}
			message={'Rule has successfully added'}
			details={createRuleMutate.data?.rule}
		/>
	{/if}

	<article class="form-table">
		<!-- Header -->
		<section class="form-header">
			<div>
				<Ruler />
				<h2>Create log rule</h2>
			</div>
			<p>Create rule for logging in time</p>
		</section>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="form-group">
			<!-- Machine ID [default] -->
			<InputGroup id="id" label="Machine ID [Autocomplete]" value={machineId} disabled={true} />

			<!-- Rule name -->
			<InputGroup
				id="name"
				label="Rule name *"
				bind:value={form.name}
				placeholder="High temperature record"
			/>

			<!-- Trigger TYPE -->
			<div>
				<Label class="text-xs font-medium text-muted-foreground mb-0.5">Trigger type</Label>
				{@render selectTriggerType()}
			</div>
			<!-- If type == CHANGE -->
			{#if form.triggerType === 'CHANGE'}
				<section class="flex gap-6">
					<div>
						<Label class="text-xs font-medium text-muted-foreground">Trigger tag *</Label>
						{#if stream.tagsList}
							{@render selectTriggerTag()}
						{/if}
					</div>
				</section>
			{/if}
			<!-- If type == TIME -->
			{#if form.triggerType === 'TIME'}
				<InputGroup
					id="timeinterval"
					label="Interval [In seconds] *"
					bind:value={form.interval}
					placeholder="3"
					type="number"
					required={true}
				/>
			{/if}
			<!-- If type == EDGE -->
			{#if form.triggerType === 'EDGE'}
				<section class="flex gap-6">
					<div>
						<Label class="text-xs font-medium text-muted-foreground">Trigger tag *</Label>
						{#if stream.tagsList}
							{@render selectTriggerTag()}
						{/if}
					</div>
					<div>
						<Label class="text-xs font-medium text-muted-foreground">Trigger operator</Label>
						{@render selectTriggerOperator()}
					</div>

					<InputGroup
						id="triggervalue"
						label="Trigger value [true or number/string]"
						bind:value={form.triggerValue}
						placeholder="true"
						max="64"
					/>
				</section>
			{/if}

			<!--  -->
			<!-- Which tags will write in DB -->
			<div class="w-full">
				<Label class="text-xs font-medium text-muted-foreground"
					>Write tags [Which tags you want write when is condition/time succed]</Label
				>
				{@render selectWhichTagsWrite()}
				<span class="text-xs text-orange-500 font-semibold">{form.tags}</span>
			</div>

			<!-- Btns -->
			<section class="pt-6 flex gap-3 *:flex-1 *:rounded-lg">
				<Button type="button" variant="outline" onclick={() => history.back()} class="">
					Cancel
				</Button>
				<Button type="submit" disabled={createRuleMutate.isPending}>
					{createRuleMutate.isPending ? 'Sending rule...' : 'Submit'}
				</Button>
			</section>
		</form>
	</article>
</main>

{#snippet selectTriggerType()}
	<RadioGroup.Root
		bind:value={form.triggerType}
		class="flex"
		onValueChange={(v) => {
			if (v === 'CHANGE') form.interval = 5;
			if (v === 'TIME') form.triggerValue = 'true';
			if (v === 'EDGE') form.interval = 5;
		}}
	>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="CHANGE" id="change" />
			<Label for="change">{triggerLabels.CHANGE}</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="TIME" id="time" />
			<Label for="time">{triggerLabels.TIME}</Label>
		</div>
		<div class="flex items-center space-x-2">
			<RadioGroup.Item value="EDGE" id="edge" />
			<Label for="edge">{triggerLabels.EDGE}</Label>
		</div>
	</RadioGroup.Root>
{/snippet}

{#snippet selectTriggerOperator()}
	<Select.Root type="single" bind:value={form.triggerOperator}>
		<Select.Trigger class="w-[100px] inputNormalize">{form.triggerOperator}</Select.Trigger>
		<Select.Content>
			<Select.Item value="==">{'=='}</Select.Item>
			<Select.Item value=">">{'>'}</Select.Item>
			<Select.Item value="<">{'<'}</Select.Item>
			<Select.Item value=">=">{'>='}</Select.Item>
			<Select.Item value="<=">{'<='}</Select.Item>
			<Select.Item value="!=">{'!='}</Select.Item>
		</Select.Content>
	</Select.Root>
{/snippet}

{#snippet selectTriggerTag()}
	<Select.Root type="single" required bind:value={form.triggerTag}>
		<Select.Trigger class="lg:w-2xs inputNormalize">{form.triggerTag}</Select.Trigger>

		<Select.Content class="max-h-[700px] overflow-auto lg:w-2xs" align="start">
			<Select.Group>
				<Select.GroupHeading>
					<div class="flex justify-between">
						<span>Tag name</span>
						<span>Live value now</span>
					</div>
				</Select.GroupHeading>
				{#each stream.tagsList as liveTag}
					<Select.Item value={liveTag[0]}
						><p class="flex gap-2 justify-between! w-full scroll-auto">
							<span>{liveTag[0]}</span><span class="text-emerald-500">{liveTag[1]}</span>
						</p></Select.Item
					>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}

{#snippet selectWhichTagsWrite()}
	<Select.Root type="multiple" required bind:value={form.tags} disabled={!stream.data}>
		<Select.Trigger class="w-full inputNormalize" placeholder={'Select'}
			>Selected [{form.tags.length}]</Select.Trigger
		>

		<Select.Content class="max-h-[700px] overflow-auto" align="start">
			<Select.Group class="">
				<Select.GroupHeading>
					<div class="flex justify-between">
						<span>Tag name</span>
						<span>Live value now</span>
					</div>
				</Select.GroupHeading>
				{#each stream.tagsList as liveTag}
					<Select.Item value={liveTag[0]}
						><p class="flex gap-2 justify-between! w-full scroll-auto">
							<span>{liveTag[0]}</span><span class="text-emerald-500">{liveTag[1]}</span>
						</p></Select.Item
					>
				{/each}
			</Select.Group>
		</Select.Content>
	</Select.Root>
{/snippet}
