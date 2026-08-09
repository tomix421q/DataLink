<script lang="ts">
	import { LayoutDashboard, LogIn, LogOut } from '@lucide/svelte';
	import * as Sidebar from '../../ui/sidebar/index';
	import { useActiveUser, useLogoutMutation } from '$lib/api/queries/auth';
	import { userStore } from '$lib/stores/UserStore.svelte';

	const userActive = useActiveUser();
	const logoutMutation = useLogoutMutation();

	const items = $derived([
		...(userActive.data
			? [{ title: 'Logout', url: '#', icon: LogOut, isLogout: true }]
			: [{ title: 'Login', url: '/auth/login', icon: LogIn, isLogout: false }]),
		{ title: 'Main dashboard', url: '/maindashboard', icon: LayoutDashboard }
	]);

	$effect(() => {
		if (userActive.data) {
			userStore.setUser(userActive.data);
		}
	});
	// $inspect(userActive.data);
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>User</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							{#if item.isLogout}
								<button onclick={() => logoutMutation.mutate()} {...props}
									><span>
										<item.icon />
									</span><span>{item.title}</span></button
								>
							{:else}
								<a href={item.url} {...props}
									><span><item.icon /> </span><span>{item.title}</span></a
								>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
