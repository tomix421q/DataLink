import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),

		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: true
			}),
			alias: {
				'@datalink/shared': '../shared/index.ts',
				'@datalink/shared/*': '../shared/*'
			}
		})
	],
	server: {
		proxy: {
			'/api': {
				target: process.env.PUBLIC_API_URL || 'http://localhost:3000',
				changeOrigin: true,
				ws: true
			}
		}
	}
});
