<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { cn } from '$lib/utils';
	import type { SseMachineStream } from '$lib/utils/SseMachineStream.svelte';
	import { HouseIcon, PencilRulerIcon, ScrollTextIcon, TagPlusIcon } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';

	let { machineId, stream } = $props<{ machineId: string; stream: SseMachineStream }>();

	// $inspect(stream.data?.connection.online);
</script>

<div class="flex flex-wrap gap-1 lg:gap-3 tracking-tight">
	<!-- Main page -->
	<Button
		size="sm"
		href="/machine/{machineId}"
		class={cn('group hover:bg-chart-3', {
			'bg-chart-4! *:block': page.url.pathname.endsWith(`/${machineId}`)
		})}
		><HouseIcon class="size-5" /><span class="">Monitor page</span>
	</Button>

	<!-- Active rules -->
	<Button
		size="sm"
		href="/machine/{machineId}/logger/activelogers"
		class={cn('group hover:bg-chart-3 active:bg-black!', {
			'bg-chart-4! *:block': page.url.pathname.endsWith('/activelogers')
		})}
		><ScrollTextIcon class="size-5" /><span class="">Active rules</span>
	</Button>

	<!-- Create rule for log -->
	<Button
		size="sm"
		href="/machine/{machineId}/logger/createrule"
		onclick={(e) => {
			if (!userStore.isEngineer && !userStore.isAdmin) {
				e.preventDefault();
				console.log(userStore.isEngineer, userStore.isAdmin);
				toast.error('⚠️ Authorization required');
				return;
			}
			if (!stream.data?.connection.online) {
				e.preventDefault();
				toast.error('🔌 This machine is offline. Try later. ');
				return;
			}
		}}
		disabled={(!userStore.isEngineer && !userStore.isAdmin) || !stream.data?.connection.online}
		class={cn('group hover:bg-chart-3', {
			'bg-chart-4! *:block': page.url.pathname.endsWith('/createrule'),
			hidden:
				(!userStore.isEngineer && !userStore.isAdmin) ||
				stream.data?.connection.online === undefined
		})}
		><PencilRulerIcon class="size-5" /><span class="">Create rule</span>
	</Button>
</div>
