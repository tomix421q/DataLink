<script lang="ts">
	import { page } from '$app/state';
	import { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { fade } from 'svelte/transition';
	import type { LayoutProps } from './$types';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { setContext } from 'svelte';
	import { LoaderCircle } from '@lucide/svelte';
	import { useMachineDowntimes } from '$lib/api/queries/logger';
	import SubInfoMachineHeader from './_components/SubInfoMachineHeader.svelte';
	import ButtonsMachineHeader from './_components/ButtonsMachineHeader.svelte';

	let { children }: LayoutProps = $props();

	const machineId = $derived(page.params.id!);
	const stream = new SseMachineStream();
	const machineDowntimes = useMachineDowntimes(() => machineId);

	setContext('machine-stream', stream);

	$effect(() => {
		if (!machineId) return;
		stream.connect(machineId);
		return () => stream.close();
	});

	// $inspect(isEngineer);
</script>

<main class="mt-2.5 mb-3 gap-2 flex flex-col justify-between w-full tracking-wide font-heading!">
	<!-- Left side -->
	<article class="text-sm lg:text-xl font-heading space-y-2 flex flex-col w-full">
		<!-- First line info -->
		<section
			class="flex flex-col lg:flex-row lg:justify-between gap-1 gap-x-8 lg;gap-8 flex-wrap w-full"
		>
			<div class="flex items-center gap-x-8 flex-wrap">
				<div class="flex gap-x-2 items-center">
					<p class="text-muted-foreground text-sm">Id:</p>
					<p class="text-primary font-bold">{machineId}</p>
				</div>
				{#if stream?.data?.info.plc}
					<div transition:fade={{ delay: 200 }} class="flex gap-2 items-center">
						<p class="text-muted-foreground text-sm">Name:</p>
						<p class="text-primary font-bold">
							{stream?.data?.info.plc ? stream.data.info.plc.name : '...'}
						</p>
					</div>
					<div transition:fade={{ delay: 500 }} class="flex gap-2 items-center">
						<p class="text-muted-foreground text-sm">Ip:</p>
						<p class="text-primary font-bold">
							{stream?.data?.info.plc ? stream.data.info.plc.ip : '...'}
						</p>
					</div>
				{/if}
			</div>

			<div class="uppercase tracking-widest font-bold">
				{stream?.data?.connection.online ? 'Online 🟢 ' : 'Offline 🔴'}
			</div>
		</section>

		<!-- Second line info -->
		<section>
			<div class="flex">
				{#if stream?.loading}
					<p class="animate-pulse flex">
						<span class="text-green-500 font-bold">Connecting to machine. </span>
						<LoaderCircle class="animate-spin mx-1" />
					</p>
				{/if}
				{#if stream?.error}
					<p class="text-destructive font-bold">{stream.error}</p>
				{/if}
			</div>

			{#if machineDowntimes.data && stream.data}
				<SubInfoMachineHeader {stream} machineDowntime={machineDowntimes.data} />
			{/if}
		</section>

		<!-- Thirt line info -->
		<article class="flex flex-col justify-between">
			<ButtonsMachineHeader {machineId} {stream} />
		</article>
	</article>
</main>
<Separator class="mb-4" />
{@render children()}
