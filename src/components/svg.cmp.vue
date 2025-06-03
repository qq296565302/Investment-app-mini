<template>
	<img :src="use" class="_svg_cmp_icon" />
</template>

<script setup>
const props = defineProps({
	use: {
		type: String,
		default: '',
	},
})
</script>
<style scoped>
._svg_cmp_icon {
	cursor: pointer;
	height: 24px;
	width: 24px;
}
</style>
