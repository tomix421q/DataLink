export type Theme = 'light' | 'dark';

class ThemeState {
	current = $state<Theme>('light');

	constructor() {
		const savedTheme = localStorage.getItem('theme') as Theme;

		if (savedTheme === 'light' || savedTheme === 'dark') {
			this.current = savedTheme;
		} else {
			this.current = 'light';
		}
		this.applyTheme();
	}

	toggle() {
		this.current = this.current === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', this.current);
		this.applyTheme();
	}

	private applyTheme() {
		const isDark = this.current === 'dark';
		document.documentElement.classList.toggle('dark', isDark);
	}
}

export const theme = new ThemeState();
