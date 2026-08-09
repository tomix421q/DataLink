import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import {
	createNewUserFolder,
	deleteFolder,
	getAllTagUserFolders,
	getMainDashboardLivePooling,
	toggleFolderMainDashboard,
	toggleTagInFolder
} from '../apiCalls/favorites';
import { favoriteKeys } from './_keys';
import { toast } from 'svelte-sonner';

export function useCreateNewUserFolder() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({ machineId, name }: { machineId: string; name: string }) =>
			createNewUserFolder(machineId, name),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: [...favoriteKeys.all, variables.machineId] });
			toast.success(`✅ Folder created successfully`);
		},
		onError: (error) => {
			toast.error(`❌ ${error.message}`);
		}
	}));
}

export function useGetAllUserFolders(machineIdFn: () => string) {
	return createQuery(() => {
		const machineId = machineIdFn();
		return {
			queryKey: favoriteKeys.machineFolders(machineId),
			queryFn: () => getAllTagUserFolders(machineId),
			staleTime: 1000 * 60 * 50,
			enabled: !!machineId
		};
	});
}

export function useDeleteFolder() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({ machineId, folderId }: { machineId: string; folderId: string }) =>
			deleteFolder(machineId, folderId),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.machineFolders(variables.machineId) });
			toast.success(`✅ ${data}`);
		},
		onError: (error) => {
			toast.error(`❌ ${error.message}`);
		}
	}));
}

export function useToggleTagInFolder() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({
			machineId,
			folderId,
			tagName
		}: {
			machineId: string;
			folderId: string;
			tagName: string;
		}) => toggleTagInFolder(folderId, tagName),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: favoriteKeys.machineFolders(variables.machineId)
			});
			toast.success(`✅ ${data?.message}`);
		},
		onError: (error) => {
			toast.error(`❌ ${error.message}`);
		}
	}));
}

export function useToggleFolderDashboard() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({
			machineId,
			folderId,
			show
		}: {
			machineId: string;
			folderId: string;
			show: boolean;
		}) => toggleFolderMainDashboard(machineId, folderId, show),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.machineFolders(variables.machineId) });
			toast.success(`✅ ${data?.message}`);
		},
		onError: (error) => {
			toast.error(`❌ ${error.message}`);
		}
	}));
}

export function useMainDashboardLive() {
	return createQuery(() => ({
		queryKey: ['main-dashboard-live'],
		queryFn: getMainDashboardLivePooling,
		refetchInterval: 3000,
		refetchIntervalInBackground: false
	}));
}
