<template>
  <div class="tab-example">
    <h3>Tab组件使用示例</h3>
    
    <!-- 基础用法 -->
    <div class="example-section">
      <h4>基础用法</h4>
      <Tab 
        v-model="selectedTab" 
        :options="tabOptions" 
        @change="onTabChange"
      />
      <p>当前选中: {{ selectedTab }}</p>
    </div>

    <!-- 带图标的用法 -->
    <div class="example-section">
      <h4>带图标的用法</h4>
      <Tab 
        v-model="selectedIconTab" 
        :options="iconTabOptions" 
        @change="onIconTabChange"
      />
      <p>当前选中: {{ selectedIconTab }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Tab from './Tab.vue';

// 基础选项卡
const selectedTab = ref('home');
const tabOptions = [
  { value: 'home', label: '首页' },
  { value: 'about', label: '关于' },
  { value: 'contact', label: '联系' },
  { value: 'services', label: '服务' }
];

// 带图标的选项卡
const selectedIconTab = ref('dashboard');
const iconTabOptions = [
  { 
    value: 'dashboard', 
    label: '仪表板',
    icon: '<path d="M213.3815,109.61945,133.376,36.88436a8,8,0,0,0-10.76339.00036l-79.9945,72.73477A8,8,0,0,0,40,115.53855V208a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V115.53887A8,8,0,0,0,213.3815,109.61945Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path>'
  },
  { 
    value: 'analytics', 
    label: '分析',
    icon: '<circle cx="116" cy="116" r="84" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle><line x1="175.39356" y1="175.40039" x2="223.99414" y2="224.00098" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>'
  },
  { 
    value: 'messages', 
    label: '消息',
    icon: '<path d="M45.42853,176.99811A95.95978,95.95978,0,1,1,79.00228,210.5717l.00023-.001L45.84594,220.044a8,8,0,0,1-9.89-9.89l9.47331-33.15657Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path><line x1="96" y1="112" x2="160" y2="112" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="96" y1="144" x2="160" y2="144" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>'
  },
  { 
    value: 'profile', 
    label: '个人资料',
    icon: '<circle cx="128" cy="96" r="64" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="16"></circle><path d="M30.989,215.99064a112.03731,112.03731,0,0,1,194.02311.002" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path>'
  }
];

// 事件处理
const onTabChange = (value) => {
  console.log('基础Tab变更:', value);
};

const onIconTabChange = (value) => {
  console.log('图标Tab变更:', value);
};
</script>

<style scoped>
.tab-example {
  padding: 20px;
  max-width: 800px;
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
}

.example-section p {
  margin-top: 15px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  color: #6b7280;
}
</style>