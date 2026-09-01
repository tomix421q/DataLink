<script lang="ts">
	import { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { getContext } from 'svelte';
	import Folders from './_components/Folders.svelte';
	import LiveTags from './_components/LiveTags.svelte';
	import { page } from '$app/state';

	let machineId = $derived(page.params.id!);
	const stream = getContext<SseMachineStream>('machine-stream');

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
			<LiveTags {stream} />
		{/if}
	</div>
</main>
