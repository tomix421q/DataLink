import type { createRuleSchema } from '@datalink/shared';
import type z from 'zod';
import { apiClient } from '../RPC_API_CLIENT';
import type { InferResponseType } from 'hono';
import { ApiValidationError } from '$lib/utils/global';

type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type MachineDowntimesResponse = InferResponseType<
	(typeof apiClient.logger.downtime)[':machineId']['$get']
>;
export type MachineDowntimes = Extract<MachineDowntimesResponse, { ok: true }>['data'];
export interface DeleteLogsParams {
	from?: Date;
	to?: Date;
	entryId?: string;
}

export async function fetchAllLoggerRules() {
	const response = await apiClient.logger.$get();
	if (!response.ok) throw new Error('Error loading logger rules.');
	const data = await response.json();
	return data.rules;
}

export async function fetchLoggerRulesByMachineId(machineId: string) {
	const response = await apiClient.logger.machine[':machineId'].$get({
		param: { machineId }
	});
	if (!response) throw new Error(`Rules for machine with id ${machineId} has failed to load.`);

	const data = await response.json();
	return data.rules;
}

export async function createLoggerRule(json: CreateRuleInput) {
	const response = await apiClient.logger.$post({ json });
	if (!response.ok) {
		try {
			const errorData = await response.json();
			if (errorData.error) {
				throw new ApiValidationError(errorData.error, errorData.details);
			}
			throw new Error(JSON.stringify(errorData));
		} catch (e) {
			if (e instanceof Error) throw e;
			throw new Error('Server fault.');
		}
	}
	return await response.json();
}

export async function updateLoggerRule(id: string, json: CreateRuleInput) {
	const response = await apiClient.logger[':id'].$put({
		param: { id },
		json
	});
	if (!response.ok) throw new Error(`Failed to edit rule with id: ${id}`);
	return await response.json();
}

export async function deleteLoggerRule(id: string) {
	const response = await apiClient.logger[':id'].$delete({
		param: { id }
	});
	if (!response.ok) throw new Error(`Failed to delete rule with id: ${id}`);
}

export async function getLoggerDataEntries(
	machineId: string,
	logId: string,
	page = 1,
	limit = 100
) {
	const response = await apiClient.logger.machine.log[':machineId'][':logId'].$get({
		param: { machineId, logId },
		query: {
			page: page.toString(),
			limit: limit.toString()
		}
	});
	if (!response.ok) throw new Error('Rule logs failed to load data from server.');
	const data = await response.json();

	return data;
}

export async function deleteLoggerLogsData(logId: string, params: DeleteLogsParams) {
	const response = await apiClient.logger.logsdelete[':logId'].$delete({
		param: { logId },
		json: params
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Delete logs was failed.');
	}
	const data = await response.json();
	if ('error' in data) {
		if ('details' in data && data.details) {
			throw new ApiValidationError(data.error, data.details as Record<string, string[]>);
		}
		throw new Error(data.error || 'Unknown error');
	}
	return data;
}

export async function fetchMachineDowntimes(machineId: string) {
	const response = await apiClient.logger.downtime[':machineId'].$get({
		param: { machineId }
	});
	if (!response.ok) throw new Error(`Downtimes for machine id: ${machineId}, failed to load.`);

	const data = await response.json();
	if (!data.ok) {
		throw new Error(data.error || 'Unspecific error for machine downtimes.');
	}
	return data.data;
}
