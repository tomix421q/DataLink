export const machineKeys = {
	all: ['machines'] as const,
	list: () => ['machine', 'list'] as const,
	detail: (id: string) => ['machines', 'detail', id] as const,
	tags: (id: string) => [...machineKeys.detail(id), 'tags'] as const
};

export const loggerKeys = {
	all: ['logger'] as const,
	rules: () => [...loggerKeys.all, 'rules'] as const,
	machineRules: (machineId: string) => [...loggerKeys.rules(), 'machine', machineId],
	logEntriesBase: (machineId: string, logId: string) => ['log-entries', machineId, logId] as const,
	logEntries: (machineId: string, logId: string, page: number, limit: number) =>
		[...loggerKeys.logEntriesBase(machineId, logId), page, limit] as const,
	downtimes: () => [...loggerKeys.all, 'downtimes'] as const,
	downtime: (machineId: string) => [...loggerKeys.downtimes(), machineId] as const
};

export const authKeys = {
	all: ['auth'] as const,
	activeUser: () => [...authKeys.all, 'activeUser'] as const
};

export const favoriteKeys = {
	all: ['user-bm'] as const,
	userFolders: (machineId: string) => [...favoriteKeys.all, 'user', machineId] as const,
	publicFolders: (machineId: string) => [...favoriteKeys.all, 'public', machineId] as const
};
