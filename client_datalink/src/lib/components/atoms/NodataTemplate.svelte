<script lang="ts">
	import { SearchAlert } from '@lucide/svelte';
	import type { Component } from 'svelte';

	let {
		text = 'No data',
		icon: Icon = SearchAlert,
		size = 'lg'
	}: { text?: string; icon?: Component<any>; size?: 'lg' | 'md' | 'sm' } = $props();

	const sizeStyles = {
		lg: { text: 'text-3xl', icon: 'size-10' },
		md: { text: 'text-lg', icon: 'size-8' },
		sm: { text: 'text-sm', icon: 'size-5' }
	};
	let derivedSize = $derived(sizeStyles[size] ?? sizeStyles.lg);
</script>

<p
	class="font-heading mt-20 flex gap-2 items-center justify-center uppercase font-light {derivedSize.text}"
>
	{text}

	<Icon class="text-orange-400 animate-gentlemove {derivedSize.icon}" />
</p>
