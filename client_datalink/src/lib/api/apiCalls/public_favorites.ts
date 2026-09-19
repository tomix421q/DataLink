import { handleApiError } from '$lib/utils/global';
import { apiClient } from '../RPC_API_CLIENT';

export async function createPublicDashboard(name: string, description?: string) {
	const response = await apiClient.public.publicdash.create.$post({
		json: {
			name,
			description
		}
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function deletePublicDashboard(dashboardId: string) {
	if (!dashboardId) {
		return new Error('Missing dashboardId');
	}
	const response = await apiClient.public.publicdash.delete[':dashboardId'].$delete({
		param: {
			dashboardId
		}
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function getAllPublicDashboards() {
	const response = await apiClient.public.publicdash.$get();
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function toggleFolderToPublicDash(json: {
	dashboardId: string;
	folderId: string;
	order?: number;
}) {
	const response = await apiClient.public.publicdash.addfolder.$post({
		json: {
			dashboardId: json.dashboardId,
			folderId: json.folderId,
			order: json.order
		}
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}

export async function getPublicDashboard(dashboardId: string) {
	const response = await apiClient.public.publicdash[':dashboardId'].live.$get({
		param: {
			dashboardId
		}
	});
	const data = await response.json();
	handleApiError(response, data);
	if (data.ok) return data;
	return null;
}
