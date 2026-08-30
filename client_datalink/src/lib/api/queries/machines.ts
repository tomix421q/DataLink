import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import { machineKeys } from './_keys';
import {
	createNewMachine,
	fetchMachineById,
	fetchMachines,
	removeMachine
} from '../apiCalls/machines';
import { toast } from 'svelte-sonner';

export function useMachinesList() {
	return createQuery(() => {
		return {
			queryKey: machineKeys.list(),
			queryFn: fetchMachines,
			staleTime: 1000 * 60 * 5
		};
	});
}

export function useMachineDetail(idFn: () => string) {
	return createQuery(() => {
		const id = idFn();

		return {
			queryKey: machineKeys.detail(id),
			queryFn: () => fetchMachineById(id),
			staleTime: 1000 * 60 * 5,
			enabled: !!id
		};
	});
}

export function useAddNewMachine() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: createNewMachine,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: machineKeys.list() });
		}
	}));
}

export function useRemoveMachine() {
	const queryClient = useQueryClient();

	return createMutation(() => {
		return {
			mutationFn: ({ machineId }: { machineId: string }) => removeMachine(machineId),
			onSuccess: (_, variables) => {
				queryClient.invalidateQueries({ queryKey: machineKeys.list() });
				toast.success(`✅ Successfull deleted machine with id: ${variables.machineId}`);
			},
			onError: (error) => {
				toast.error(`${error.message}`);
			}
		};
	});
}
