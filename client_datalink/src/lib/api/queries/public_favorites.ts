import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import {
	createPublicDashboard,
	deletePublicDashboard,
	getAllPublicDashboards,
	getPublicDashboard,
	toggleFolderToPublicDash
} from '../apiCalls/public_favorites';
import { publicDashboardsKeys } from './_keys';
import { toast } from 'svelte-sonner';

export function useCreatePublicDashboard() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({ name, description }: { name: string; description?: string }) =>
			createPublicDashboard(name, description),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: publicDashboardsKeys.lists() });
			toast.success(data?.message || 'Public dashboard created successfully');
		}
		// onError: (error) => {
		// 	toast.error(`${error.message}`);
		// }
	}));
}

export function useDeletePublicDashboard() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: (dashboardId: string) => deletePublicDashboard(dashboardId),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: publicDashboardsKeys.lists() });
			toast.success(data?.message || 'Dashboard deleted successfully');
		},
		onError: (error) => {
			toast.error(`${error.message}`);
		}
	}));
}

export function useGetAllPublicDashboards() {
	return createQuery(() => {
		return {
			queryKey: publicDashboardsKeys.lists(),
			queryFn: () => getAllPublicDashboards(),
			staleTime: 1000 * 60 * 50
		};
	});
}

export function useGetPublicDashboardLive(dashboardIdFn: () => string) {
	return createQuery(() => {
		const dashboardId = dashboardIdFn();
		return {
			queryKey: publicDashboardsKeys.detail(dashboardId),
			queryFn: () => getPublicDashboard(dashboardId),
			refetchInterval: 5000,
			refetchIntervalInBackground: false
		};
	});
}

export function useToggleFolderToPublicDash() {
	const queryClient = useQueryClient();
	return createMutation(() => ({
		mutationFn: toggleFolderToPublicDash,
		onSuccess: (data) => {
			(queryClient.invalidateQueries({ queryKey: publicDashboardsKeys.lists() }),
				toast.success(`${data?.message}`));
		},

		onError: (error) => {
			toast.error(`${error.message}`);
		}
	}));
}
