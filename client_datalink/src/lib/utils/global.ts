export class ApiValidationError extends Error {
	details?: Record<string, string[]>;

	constructor(message: string, details?: Record<string, string[]>) {
		super(message);
		this.name = 'ApiValidationError';
		this.details = details;
	}
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
	let data;
	try {
		data = await response.json();
	} catch (err) {
		throw new Error('Server not responding.');
	}

	if (!response.ok) {
		if ('details' in data && data.details) {
			throw new ApiValidationError(data.error, data.details as Record<string, string[]>);
		}
		if ('error' in data) {
			throw new ApiValidationError(data.error);
		}
		throw new Error('Problem with API, please try again later.');
	}
	return data as T;
}
export function handleApiError(response: Response, data: any) {
	if (!response.ok || (data && !data.ok)) {
		if (data && typeof data === 'object') {
			if ('details' in data && data.details) {
				const detailsMap = data.details as Record<string, string[]>;
				const allErrors = Object.values(detailsMap).flat();
				const errorMessage =
					allErrors.length > 1
						? 'Please correct the highlighted errors in the form.'
						: allErrors[0] || data.error || 'Validation failed';

				throw new ApiValidationError(errorMessage, detailsMap);
			}
			if ('error' in data) {
				throw new ApiValidationError(data.error);
			}
		}
		throw new Error('Problem with API, please try again later.');
	}
}

export function dateTimmeUTCformatter(dateTime: Date | string | number | null | undefined) {
	if (!dateTime) return '';

	const dateObject = dateTime instanceof Date ? dateTime : new Date(dateTime);
	if (isNaN(dateObject.getTime())) {
		return 'Invalid Date';
	}
	const result = new Intl.DateTimeFormat('sk-Sk', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
		// timeZone: 'UTC'
	}).format(dateObject);

	return result;
}

export function dateTimmeUTCformatter2(dateTime: Date | string | number | null | undefined) {
	if (!dateTime) return '';

	const dateObject = dateTime instanceof Date ? dateTime : new Date(dateTime);
	if (isNaN(dateObject.getTime())) {
		return 'Invalid Date';
	}
	const result = new Intl.DateTimeFormat('sk-Sk', {
		day: '2-digit',
		month: '2-digit'

		// timeZone: 'UTC'
	}).format(dateObject);

	return result;
}
