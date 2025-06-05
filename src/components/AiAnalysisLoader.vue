<template>
  <div class="ai-loader">
    <div
      class="loader"
      @click="handleClick"
    >
      <span></span>
    </div>
    <span v-if="isAnalysising">AI正在进行分析...</span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  publishTime: {
    type: String,
    required: true,
  },
  isAnalysising: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['analyse']);

const handleClick = () => {
  emit('analyse', props.content, props.publishTime);
};
</script>

<style scoped>
.ai-loader {
  align-items: center;
  display: flex;
  .loader {
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
    margin: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border-radius: 50%;
    box-shadow: -5px -5px 9px rgba(255, 255, 255, 0.45),
      5px 5px 9px rgba(94, 104, 121, 0.137);
  }

  .loader:before {
    height: 0.7rem;
    width: 0.7rem;
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    background: #ececec;
    border-radius: 50%;
    border: 2px solid #e2e1e1;
    box-shadow: inset -5px -5px 9px rgba(255, 255, 255, 0.45),
      5px 5px 9px rgba(94, 104, 121, 0.3);
  }

  .loader span {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(to bottom, rgb(89, 92, 252), rgb(226, 57, 241));
    animation: rotate 1s infinite linear;
  }
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
</style>
