import { browser } from '$app/environment';
import type { User } from '$lib/api/apiCalls/auth';
import { ROLES } from '@datalink/shared';

class UserStore {
	user = $state<User>();

	constructor() {
		if (browser) {
			this.getUserFromLC();
		}
	}

	setUser(newUser: User) {
		this.user = newUser;
		if (browser) {
			if (newUser) {
				localStorage.setItem('app-user', JSON.stringify(newUser));
			} else {
				localStorage.removeItem('app-user');
			}
		}
	}

	clearUser() {
		this.user = undefined;
		if (browser) {
			localStorage.removeItem('app-user');
		}
	}

	get isEngineer() {
		return this.user?.role === ROLES.ENGINEER;
	}
	get isAdmin() {
		return this.user?.role === ROLES.ADMIN;
	}
	get isAdminOrEngineer() {
		return this.user?.role === ROLES.ADMIN || this.user?.role === ROLES.ENGINEER;
	}

private getUserFromLC() {
  const getLC = localStorage.getItem('app-user');

  if (getLC != null && getLC !== 'undefined' && getLC !== 'null') {
    try {
      let parsedUser = JSON.parse(getLC);
      this.user = parsedUser;
    } catch (error) {
      console.error('Load from LC failed');
      localStorage.removeItem('app-user');
    }
  }
	}
}

export const userStore = new UserStore();
