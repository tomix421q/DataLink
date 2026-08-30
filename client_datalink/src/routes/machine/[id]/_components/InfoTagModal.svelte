<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { dateTimmeUTCformatter } from '$lib/utils/global';

	interface TagItem {
		id: string;
		keyName: string;
		plcAddress: string;
		machineId: string;
		createdAt?: string | Date;
		updatedAt: string | Date;
		folders: { name: string }[];
	}

	let { tag }: { tag: TagItem } = $props();
	let open = $state(false);

	// $inspect(tag.keyName);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="w-full text-start">Info</Dialog.Trigger>

	<Dialog.Content class="flex flex-col cardNormalize">
		<Dialog.Header>
			<Dialog.Title class="font-heading font-bold text-lg flex gap-1"
				><span class="text-chart-3 font-semibold">{tag.keyName}</span> info</Dialog.Title
			>
			<Dialog.Description>Information about tag</Dialog.Description>
		</Dialog.Header>

		<div class="mb-12">
			<p>
				<span class="smallKey">Created</span><span class="smallValue"
					>{dateTimmeUTCformatter(tag.createdAt)}</span
				>
			</p>
			<p>
				<span class="smallKey">Last updated</span><span class="smallValue"
					>{dateTimmeUTCformatter(tag.updatedAt)}</span
				>
			</p>
			<p><span class="smallKey">Id</span><span class="smallValue">{tag.id}</span></p>
			<p><span class="smallKey">Name</span><span class="smallValue">{tag.keyName}</span></p>
			<p>
				<span class="smallKey">Plc address</span><span class="smallValue">{tag.plcAddress}</span>
			</p>
			<p>
				<span class="smallKey">In folders</span><span class="smallValue">
					{#if tag.folders.length > 0}
						{tag.folders.map((v) => v.name)}
					{:else}
						not used in any folder
					{/if}
				</span>
			</p>
		</div>
	</Dialog.Content>
</Dialog.Root>
