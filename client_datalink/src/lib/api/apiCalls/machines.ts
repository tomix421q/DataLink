import type { CreateNewMachine } from '@datalink/shared';
import { apiClient } from '../RPC_API_CLIENT';
import { ApiValidationError, handleApiError, handleApiResponse } from '$lib/utils/global';

export async function fetchMachines() {
	const response = await apiClient.machine.$get();

	if (!response.ok) {
		throw new Error('Server API failed...');
	}
	const data = await response.json();
	return data;
}

export async function fetchMachineById(id: string) {
	const response = await apiClient.machine[':id'].$get({
		param: { id }
	});

	if (!response.ok) {
		if (response.status === 404) throw new Error(`Machine not found. Error: ${404}`);
		throw new Error(`Error loading machine from db.`);
	}

	const data = await response.json();
	return data;
}

export async function createNewMachine(json: CreateNewMachine) {
	const response = await apiClient.machine.create.$post({ json });
	const data = await response.json();

	if ('error' in data) {
		if ('details' in data && data.details) {
			throw new ApiValidationError(data.error, data.details as Record<string, string[]>);
		}
		throw new Error(data.error || 'Unknown error');
	}
	return data.data;
}

export async function addNewTagFromMachine(json: {
	keyName: string;
	plcAddress: string;
	machineId: string;
}) {
	const response = await apiClient.machine.addtag.$post({ json });
	const data = await response.json();

	if (!response.ok) {
		if ('details' in data && data.details) {
			throw new ApiValidationError(data.error, data.details as Record<string, string[]>);
		}
		if ('error' in data) {
			throw new ApiValidationError(data.error);
		}
		throw new Error('Problem with API, please try again later');
	}
	return data;
}

export async function removeTagsFromTracking(machineId: string, tagsNames: string[]) {
	const response = await apiClient.machine.tagsremove[':machineId'].$delete({
		json: { tagsNames },
		param: { machineId }
	});
	return handleApiResponse(response);
}

export async function removeMachine(machineId: string) {
	const response = await apiClient.machine.machineremove[':machineId'].$delete({
		param: { machineId }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}
