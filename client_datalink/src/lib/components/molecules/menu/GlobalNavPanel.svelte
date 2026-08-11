<script lang="ts">
	import { CirclePlusIcon, HouseIcon } from '@lucide/svelte';
	import * as Sidebar from '../../ui/sidebar/index';

	const items = $derived([
		{ title: 'Home', url: '/', icon: HouseIcon },
		{ title: 'Add new machine', url: '/addmachine', icon: CirclePlusIcon }
	]);
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Menu</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							<a href={item.url} {...props}><span><item.icon /> </span><span>{item.title}</span></a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
