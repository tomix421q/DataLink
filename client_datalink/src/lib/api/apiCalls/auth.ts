import type { InferRequestType, InferResponseType } from 'hono';
import { apiClient } from '../RPC_API_CLIENT';

type LoginPayload = InferRequestType<(typeof apiClient)['auth']['domain-login']['$post']>;
type ActiveUserResponse = InferResponseType<typeof apiClient.auth.activeuser.$get>;
export type User = Extract<ActiveUserResponse, { ok: true }>['user'];

export async function loginUser(json: LoginPayload) {
	const response = await apiClient.auth['domain-login'].$post({ json });
	if (!response.ok) {
		const errorData = await response.json();
		if (!errorData.ok) {
			throw new Error(errorData.error || 'Login failed');
		}
	}
	return response.json();
}

export async function logoutUser() {
	const res = await apiClient.auth.logout.$post();
	if (!res.ok) throw new Error('Logout failed');

	return res.json();
}

export async function fetchActiveUser() {
	const response = await apiClient.auth.activeuser.$get();
	if (!response.ok) throw new Error('Error loading user');
	const data = await response.json();
	return data.user;
}
