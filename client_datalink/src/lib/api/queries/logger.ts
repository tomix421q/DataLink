import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import { loggerKeys } from './_keys';
import {
	createLoggerRule,
	deleteLoggerLogsData,
	deleteLoggerRule,
	fetchAllLoggerRules,
	fetchLoggerRulesByMachineId,
	fetchMachineDowntimes,
	getLoggerDataEntries,
	updateLoggerRule,
	type DeleteLogsParams
} from '../apiCalls/logger';
import { toast } from 'svelte-sonner';

export function useLoggerRules() {
	return createQuery(() => ({
		queryKey: loggerKeys.rules(),
		queryFn: fetchAllLoggerRules,
		staleTime: 1000 * 60 * 5
	}));
}
export function useMachineLoggerRules(machineIdFn: () => string) {
	return createQuery(() => {
		const machineId = machineIdFn();

		return {
			queryKey: loggerKeys.machineRules(machineId),
			queryFn: () => fetchLoggerRulesByMachineId(machineId),
			staleTime: 1000 * 60 * 5,
			enabled: !!machineId
		};
	});
}

export function useCreateLoggerRule() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: createLoggerRule,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: loggerKeys.rules() });
		}
	}));
}

export function useUpdateLoggerRule() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: ({ id, data }: { id: string; data: any }) => updateLoggerRule(id, data),
		onSuccess: (data) => {
			let message = data.ok && data.rule;
			queryClient.invalidateQueries({ queryKey: loggerKeys.rules() });
		}
	}));
}

export function useDeleteLoggerRule() {
	const queryClient = useQueryClient();

	return createMutation(() => ({
		mutationFn: deleteLoggerRule,
		onSuccess: (response, parameter) => {
			queryClient.invalidateQueries({ queryKey: loggerKeys.rules() });
			toast.success(`Rule with id: ${parameter} was deleted...`);
		},
		onError: (error) => {
			toast.error(error.message || 'Problem with delete.');
		}
	}));
}

export function useLoggerLogsEntries(
	machineIdFn: () => string,
	logIdFn: () => string,
	params: { page: number; limit: number }
) {
	return createQuery(() => {
		const machineId = machineIdFn();
		const logId = logIdFn();
		return {
			queryKey: loggerKeys.logEntries(machineId, logId, params.page, params.limit),
			queryFn: () => getLoggerDataEntries(machineId, logId, params.page, params.limit),
			staleTime: 1000 * 60 * 5,
			refetchInterval: 1000 * 60,
			enabled: !!logId && !!machineId
		};
	});
}

export function useDeleteLoggerEntriesLogs(machineIdFn: () => string, logIdFn: () => string) {
	const queryClient = useQueryClient();

	return createMutation(() => {
		const machineId = machineIdFn();
		const logId = logIdFn();
		return {
			mutationFn: (params: DeleteLogsParams) => deleteLoggerLogsData(logId, params),
			onSuccess: (data) => {
				toast.success(data.message || 'Logs entries was successfuly deleted.');
				queryClient.invalidateQueries({
					queryKey: loggerKeys.logEntriesBase(machineId, logId)
				});
			},
			onError: (error: any) => {
				toast.error(error.message || 'Delete logs entries was failed.');
			}
		};
	});
}

export function useMachineDowntimes(machineIdFn: () => string) {
	return createQuery(() => {
		const machineId = machineIdFn();

		return {
			queryKey: loggerKeys.downtime(machineId),
			queryFn: () => fetchMachineDowntimes(machineId),
			staleTime: 1000 * 30,
			enabled: !!machineId
		};
	});
}
