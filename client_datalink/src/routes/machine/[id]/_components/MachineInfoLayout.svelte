<script lang="ts">
	import type { MachineDowntimes } from '$lib/api/apiCalls/logger';
	import type { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';

	type DowntimePeriod = keyof Omit<MachineDowntimes, 'machineId' | 'machineName'>;

	let { stream, machineDowntime }: { stream: SseMachineStream; machineDowntime: MachineDowntimes } =
		$props();

	const periods = $derived(
		Object.keys(machineDowntime).filter((key) => key.startsWith('_'))
	) as DowntimePeriod[];

	// $inspect(machineDowntime);
</script>

<main class="flex flex-row gap-4 overflow-x-scroll! scroll-auto! text-sm">
	<p class="flex">
		<span class="text-muted-foreground w-max">Live tags:</span>
		<span class="text-primary font-bold">{stream.totalTrackingTags}</span>
	</p>
	<div class="flex gap-2">
		<p class="text-muted-foreground w-max">Total downtimes:</p>
		<div class="flex gap-4">
			{#each periods as period}
				<div class="flex">
					{@render formatLabel(period)}
					<span class="text-primary font-bold"
						>{(machineDowntime[period].total / 60).toFixed(1)}h</span
					>
				</div>
			{/each}
		</div>
	</div>
</main>

{#snippet formatLabel(key: string)}
	<span>{key.replace('_', '')}:</span>
{/snippet}
