declare global {
	namespace App {
		// interface Error {}

		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				role: string;
			} | null; // Môže byť null, ak užívateľ nie je prihlásený
		}

		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
