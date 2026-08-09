import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import { authKeys } from './_keys';
import { fetchActiveUser, loginUser, logoutUser } from '../apiCalls/auth';
import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { userStore } from '$lib/stores/UserStore.svelte';

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return createMutation(() => {
		return {
			mutationFn: loginUser,
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: authKeys.all });
				toast.success('Successful login');
				setTimeout(() => {
					goto('/');
				}, 1000);
			}
		};
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return createMutation(() => {
		return {
			mutationFn: logoutUser,
			onSuccess: () => {
				queryClient.clear();
				userStore.clearUser();
				toast.success('Logout successful. Redirecting...');
				setTimeout(() => {
					window.location.href = '/auth/login';
				}, 1000);
			}
		};
	});
}

export function useActiveUser() {
	return createQuery(() => {
		return {
			queryKey: authKeys.activeUser(),
			queryFn: fetchActiveUser,
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 30,
			retry: 1
		};
	});
}
