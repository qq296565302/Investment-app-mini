<template>
  <div class="radio-inputs-example">
    <h3>RadioInputs组件使用示例</h3>
    
    <!-- 默认不换行显示 -->
    <div class="example-section">
      <h4>默认不换行显示 (itemsPerRow = 0)</h4>
      <RadioInputs 
        v-model="selectedValue1" 
        :options="options" 
        name="radio-group-1"
        @change="onRadioChange"
      />
      <p>当前选中: {{ selectedValue1 }}</p>
    </div>

    <!-- 每行显示3个 -->
    <div class="example-section">
      <h4>每行显示3个按钮 (itemsPerRow = 3)</h4>
      <RadioInputs 
        v-model="selectedValue2" 
        :options="options" 
        :itemsPerRow="3"
        name="radio-group-2"
        @change="onRadioChange"
      />
      <p>当前选中: {{ selectedValue2 }}</p>
    </div>

    <!-- 每行显示5个 -->
    <div class="example-section">
      <h4>每行显示5个按钮 (itemsPerRow = 5)</h4>
      <RadioInputs 
        v-model="selectedValue3" 
        :options="options" 
        :itemsPerRow="5"
        name="radio-group-3"
        @change="onRadioChange"
      />
      <p>当前选中: {{ selectedValue3 }}</p>
    </div>

    <!-- 每行显示2个 -->
    <div class="example-section">
      <h4>每行显示2个按钮 (itemsPerRow = 2)</h4>
      <RadioInputs 
        v-model="selectedValue4" 
        :options="options" 
        :itemsPerRow="2"
        name="radio-group-4"
        @change="onRadioChange"
      />
      <p>当前选中: {{ selectedValue4 }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import RadioInputs from './RadioInputs.vue';

// 响应式数据
const selectedValue1 = ref('option1');
const selectedValue2 = ref('option2');
const selectedValue3 = ref('option3');
const selectedValue4 = ref('option4');

// 选项数据
const options = [
  { value: 'option1', label: '选项一' },
  { value: 'option2', label: '选项二' },
  { value: 'option3', label: '选项三' },
  { value: 'option4', label: '选项四' },
  { value: 'option5', label: '选项五' },
  { value: 'option6', label: '选项六' },
  { value: 'option7', label: '选项七' },
  { value: 'option8', label: '选项八' },
  { value: 'option9', label: '选项九' },
  { value: 'option10', label: '选项十' }
];

/**
 * 处理单选框变更事件
 * @param {string} value - 选中的值
 */
const onRadioChange = (value) => {
  console.log('RadioInputs变更:', value);
};
</script>

<style scoped>
.radio-inputs-example {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.example-section h4 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.example-section p {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-size: 14px;
}

h3 {
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
}
</style>