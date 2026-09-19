<script lang="ts">
	import { MoveLeft } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';

	let { path, text = 'Back' }: { path: string; text?: string } = $props();
</script>

<Button variant="ghost" size="sm" class="w-fit text-muted-foreground" href={path}
	><MoveLeft class="size-6 mr-1 text-chart-1" />{text}</Button
>
