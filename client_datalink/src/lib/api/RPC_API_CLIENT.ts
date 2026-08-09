import type { AppType } from '../../../../server/src/index';
import { hc } from 'hono/client';

export const apiClient = hc<AppType>('/api', {
	headers: {},
	fetch: (url: any, options: any) => {
		return fetch(url, { ...options, credentials: 'include' });
	}
});
