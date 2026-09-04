import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import {
	addNewTagFromMachine,
	editTag,
	fetchAllTags,
	removeTagsFromTracking
} from '../apiCalls/machines';
import { toast } from 'svelte-sonner';
import { machineKeys } from './_keys';

export function useGetAllTags(machineIdFn: () => string) {
	return createQuery(() => {
		const id = machineIdFn();
		return {
			queryKey: machineKeys.tags(id),
			queryFn: () => fetchAllTags(id),
			staleTime: 1000 * 60 * 5,
			enabled: !!id
		};
	});
}

export function useEditTag(machineIdFn: () => string) {
	const queryClient = useQueryClient();

	return createMutation(() => {
		const id = machineIdFn();
		return {
			mutationFn: ({
				tagId,
				data
			}: {
				tagId: string;
				data: { keyName: string; plcAddress: string; machineId: string };
			}) => editTag(tagId, data),
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: machineKeys.tags(id) });
				if (data.ok) {
					toast.success(`Tag ${data.data.keyName} has edited successfuly`);
				}
			},
			onError: (error) => {
				toast.error(`Problem with editing tag: ${error.message}`);
			}
		};
	});
}

export function useAddNewTag(machineIdFn: () => string) {
	const queryClient = useQueryClient();

	return createMutation(() => {
		const id = machineIdFn();
		return {
			mutationFn: addNewTagFromMachine,
			onSuccess: (data) => {
				queryClient.invalidateQueries({ queryKey: machineKeys.tags(id) });
			}
		};
	});
}

export function useRemoveTagsFromTracking() {
	const queryClient = useQueryClient();

	return createMutation(() => {
		return {
			mutationFn: ({ machineId, tagsNames }: { machineId: string; tagsNames: string[] }) =>
				removeTagsFromTracking(machineId, tagsNames),
			onSuccess: (_, variables) => {
				queryClient.invalidateQueries({ queryKey: machineKeys.tags(variables.machineId) });
				toast.success(`✅ Successfull deleted tags with names: ${variables.tagsNames}`);
			},
			onError: (error) => {
				toast.error(`Problem with deleting active tags error: ${error.message}`);
			}
		};
	});
}
