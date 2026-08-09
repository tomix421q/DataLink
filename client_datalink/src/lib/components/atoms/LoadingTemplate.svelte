<script lang="ts">
	import { LoaderCircleIcon } from '@lucide/svelte';
	import ScrambleIn from '../ui/ScrambleIn.svelte';

	let { isAbsolute = false, transparant = false } = $props<{
		isAbsolute?: boolean;
		transparant?: boolean;
	}>();
	let tick = $state(0);
</script>

<p
	class="flex gap-2 w-fit bg-black px-20 py-3 rounded z-50 tracking-widest min-w-xs justify-center text-secondary dark:text-secondary-foreground
	{isAbsolute ? 'absolute left-1/2 -translate-x-1/2 mt-48' : 'relative mx-auto'}
	{transparant ? 'bg-transparent min-w-[90px]! px-0! py-0!' : ''}
	"
>
	<LoaderCircleIcon class="animate-spin" />
	{#key tick}
		<ScrambleIn
			text="Loading"
			scrambleSpeed={150}
			characters={'.'}
			onComplete={() => {
				setTimeout(() => {
					tick++;
				}, 1000);
			}}
		/>
	{/key}
</p>
