import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['@simonwep/pickr']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
