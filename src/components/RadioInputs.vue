<template>
  <div class="radio-inputs">
    <label v-for="(option, index) in options" :key="index" class="radio">
      <input type="radio" :name="name" :checked="modelValue === option.value" :value="option.value" @change="onChange(option.value)"/>
      <span class="name">{{ option.label }}</span>
    </label>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  // 选项数组，包含 value 和 label
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  // v-model 绑定值
  modelValue: {
    type: [String, Number],
    required: true
  },
  // radio 组的名称
  name: {
    type: String,
    default: 'radio-group'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// 处理选项变更
const onChange = (value) => {
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style>
/* From Uiverse.io by 00Kubi */
.radio-inputs {
  position: relative;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  border-radius: 0.5rem;
  background-color: #eee;
  box-sizing: border-box;
  box-shadow: 0 0 0px 1px rgba(0, 0, 0, 0.06);
  padding: 10px;
  width: 100%;
  font-size: 14px;
}

.radio-inputs .radio {
  flex: 1 1 auto;
  text-align: center;
}

.radio-inputs .radio input {
  display: none;
}

.radio-inputs .radio .name {
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: none;
  padding: 0.5rem 0;
  color: rgba(51, 65, 85, 1);
  transition: all 0.15s ease-in-out;
}

.radio-inputs .radio input:checked + .name {
  background-color: #fff;
  font-weight: 600;
}

/* Hover effect */
.radio-inputs .radio:hover .name {
  background-color: rgba(255, 255, 255, 0.5);
}

/* Animation */
.radio-inputs .radio input:checked + .name {
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: select 0.3s ease;
}

@keyframes select {
  0% {
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Particles */
.radio-inputs .radio input:checked + .name::before,
.radio-inputs .radio input:checked + .name::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3b82f6;
  opacity: 0;
  animation: particles 0.5s ease forwards;
}

.radio-inputs .radio input:checked + .name::before {
  top: -8px;
  left: 40%;
  animation-delay: 0.1s;
}

.radio-inputs .radio input:checked + .name::after {
  top: -8px;
  right: 40%;
  animation-delay: 0.2s;
}

@keyframes particles {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
