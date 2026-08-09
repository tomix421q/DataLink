<script lang="ts">
	import { cn } from '$lib/utils';
	import Input from '../ui/input/input.svelte';
	import Label from '../ui/label/label.svelte';

	interface Props {
		id: string;
		label: string;
		value?: unknown;
		type?:
			| 'text'
			| 'number'
			| 'date'
			| 'checkbox'
			| 'color'
			| 'file'
			| 'image'
			| 'password'
			| 'radio'
			| 'range'
			| 'time'
			| 'email'
			| 'datetime-local'
			| 'button'
			| 'week'
			| 'reset'
			| 'tel'
			| 'submit'
			| 'search';
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		min?: string;
		max?: string;
		classLabel?: string;
		classInput?: string;
		classDiv?: string;
	}

	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		disabled = false,
		placeholder,
		min,
		max,
		classLabel = '',
		classInput = '',
		classDiv = ''
	}: Props = $props();
</script>

<div class={cn(classDiv)}>
	<Label for={id} class={cn(classLabel)}>
		{label}
	</Label>
	<Input
		class={cn(classInput)}
		{id}
		{type}
		{required}
		{disabled}
		{min}
		{max}
		autocomplete="off"
		autocorrect="off"
		{placeholder}
		bind:value
	/>
</div>
