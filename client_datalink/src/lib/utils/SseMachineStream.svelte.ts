import type { SseMachineClient } from '@datalink/shared';

export class SseMachineStream {
	data = $state<SseMachineClient>();
	loading = $state(true);
	error = $state('');

	private es: EventSource | null = null;

	constructor(machineId?: string) {
		if (machineId) this.connect(machineId);
	}

	connect(machineId: string) {
		this.close();

		this.loading = true;
		this.error = '';
		this.data = undefined;

		this.es = new EventSource(`/api/sse/${machineId}`);
		this.es.onmessage = (event) => {
			try {
				const res = JSON.parse(event.data);
				if (res.connection) {
					this.data = res;
					this.error = '';
				}
				this.loading = false;
			} catch (err) {
				this.error = `Problem with parsing sse stream for machine ${machineId}, error: ${err}`;
				this.loading = false;
			}
		};

		this.es.onerror = (err) => {
			this.error = `Sse stream for ${machineId} has dropped, no connection with server.`;
			this.loading = false;
			this.data = undefined;
		};
	}

	get tagsList() {
		return this.data?.plcData ? Object.entries(this.data.plcData) : [];
	}
	get totalTrackingTags() {
		return this.data?.plcData ? Object.entries(this.data.plcData).length : 0;
	}

	close() {
		if (this.es) {
			this.es.close();
			this.es = null;
		}
	}
}
