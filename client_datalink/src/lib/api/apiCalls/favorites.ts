import { handleApiError } from '$lib/utils/global';
import { apiClient } from '../RPC_API_CLIENT';

export async function createNewUserFolder(machineId: string, name: string) {
	const response = await apiClient.favorite[':machineId'].folders.$post({
		param: { machineId },
		json: { name }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data.data;
	return null;
}

export async function getAllTagUserFolders(machineId: string) {
	const response = await apiClient.favorite[':machineId'].folders.$get({ param: { machineId } });
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data.data;
	return [];
}

export async function getAllTagPublicFolders(machineId: string) {
	const response = await apiClient.favorite[':machineId'].folders.public.$get({
		param: { machineId }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data.data;
	return [];
}

export async function deleteFolder(machineId: string, folderId: string) {
	const response = await apiClient.favorite[':machineId'].folders[':folderId'].$delete({
		param: { machineId, folderId }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data.message;
	return null;
}

export async function toggleTagInFolder(folderId: string, tagName: string) {
	const response = await apiClient.favorite[':folderId'].tags[':tagName'].$put({
		param: { folderId, tagName }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function toggleFolderMainDashboard(
	machineId: string,
	folderId: string,
	show: boolean
) {
	const response = await apiClient.favorite[':machineId'].folders[':folderId'].dashboard.$patch({
		param: { folderId, machineId },
		json: { showOnDashboard: show }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}
export async function toggleFolderSubscribe(machineId: string, folderId: string) {
	const response = await apiClient.favorite[':machineId'].folders[':folderId'].subscribe.$post({
		param: { folderId, machineId }
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function getMainDashboardLivePooling() {
	const response = await apiClient.favorite.maindashboard.folder.live.$get();
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}
