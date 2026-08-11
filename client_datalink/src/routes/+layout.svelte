<script lang="ts">
	import '$lib/styles/style.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import SidebarMenu from '$lib/components/organism/SidebarMenu.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import AuthSync from '$lib/components/molecules/AuthSync.svelte';

	let { children } = $props();

	const queryClient = new QueryClient({});


	// $inspect(userQuery.data);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<AuthSync/>
	<Sidebar.Provider open={true}>
		<SidebarMenu />

		<main class="relative flex flex-col flex-1 h-dvh min-w-0 bg-background overflow-hidden">
			<Sidebar.Trigger
				class="absolute top-1/2 -translate-y-1/2 -ml-[14px] z-50 h-12 w-5 rounded-md border bg-muted shadow-sm transition-all ease-linear hover:bg-secondary-foreground! hover:h-24 flex items-center justify-center p-0 cursor-pointer [&>svg]:size-0! max-sm:w-4 max-sm:-ml-[5px]"
			/>

			<div class="flex-1 overflow-x-hidden px-3 pb-22">
				<Toaster />
				{@render children()}
			</div>
		</main>
	</Sidebar.Provider>
</QueryClientProvider>
