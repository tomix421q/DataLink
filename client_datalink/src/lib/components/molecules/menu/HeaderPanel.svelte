<script lang="ts">
	import { Cable, Lightbulb, LoaderCircle, Tv } from '@lucide/svelte';
	import Button from '../../ui/button/button.svelte';
	import { theme } from '$lib/utils/theme.svelte';

	let isTvMode = $state(false);

	function tvModeChange() {
		isTvMode = !isTvMode;
		if (isTvMode) {
			document.documentElement.requestFullscreen().catch(() => {});
		} else {
			document.exitFullscreen().catch(() => {});
		}
	}

	// $inspect(isTvMode);
</script>

<header>
	<!-- Logo -->
	<section class="flex px-1">
		<Button
			href="/"
			variant="ghost"
			class="text-lg md:text-2xl font-heading font-extrabold px-0 bg-gradient-to-r from-primary to-secondary-foreground/80 flex text-transparent bg-clip-text"
			>DataLink
		</Button>
	</section>

	<!--  -->
	<!-- Features ... ligt/dark/reload -->
	<section class="flex mt-2 mb-4 gap-1 mx-1.5 flex-col">
		<article class="flex flex-wrap gap-1">
			<Button
				title="Switch dark/light"
				size="icon-lg"
				variant="secondary"
				class="animate-in fade-in slide-in-from-top-8 duration-700"
				onclick={() => theme.toggle()}
			>
				{#if theme.current === 'light'}
					<div>
						<Lightbulb class="fill-yellow-500 stroke-yellow-700" />
					</div>
				{:else}
					<div>
						<Lightbulb class="fill-black stroke-blue-400" />
					</div>
				{/if}
			</Button>
			<Button
				title="Reload browser"
				size="icon-lg"
				variant="secondary"
				class="animate-in fade-in slide-in-from-bottom-8 duration-500"
				onclick={() => window.location.reload()}><LoaderCircle class="hover:rotate-90" /></Button
			>
			<Button
				title="Tv Mode"
				size="icon-lg"
				variant="secondary"
				class="animate-in fade-in slide-in-from-right-8 duration-700"
				onclick={() => tvModeChange()}
				>{#if !isTvMode}
					<Tv />
				{:else}
					<Tv class="stroke-green-500" />
				{/if}
			</Button>
		</article>
	</section>
	<!-- <Separator class="my-5" /> -->
</header>
