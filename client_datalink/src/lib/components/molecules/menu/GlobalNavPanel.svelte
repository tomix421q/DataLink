<script lang="ts">
	import { CirclePlusIcon, FileText, HouseIcon } from '@lucide/svelte';
	import * as Sidebar from '../../ui/sidebar/index';
	import { ROLES } from '@datalink/shared';
	import { userStore } from '$lib/stores/UserStore.svelte';
	import { page } from '$app/state';

	const allItems = $derived([
		{ title: 'Home', url: '/', icon: HouseIcon },
		{ title: 'Ods app', url: '/ods/', icon: FileText, external: true },
		{ title: 'Add new machine', url: '/addmachine', icon: CirclePlusIcon, role: ROLES.ENGINEER }
	]);

	const items = $derived(
		allItems.filter((item) => {
			if (!item.role) return true;
			return item.role === userStore.user?.role || userStore.isAdmin;
		})
	);
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Menu</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={page.url.pathname === item.url}>
						{#snippet child({ props })}
							<a
								href={item.url}
								target={item.external ? '_blank' : undefined}
								rel={item.external ? 'external noopener noreferrer' : undefined}
								data-sveltekit-reload={item.external ? '' : undefined}
								{...props}><span><item.icon /> </span><span>{item.title}</span></a
							>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
