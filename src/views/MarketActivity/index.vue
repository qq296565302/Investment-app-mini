<template>
    <div>
        <RadioInputs v-model="selectedActivityType" :options="activityOptions" @change="onActivityTypeChange" :itemsPerRow="5"/>
        <div class="activity-content">
            <p>当前选中的异动类型: {{ getActivityTypeName(selectedActivityType) }}</p>
        </div>
    </div>
</template>
<script setup>
import Tab from '../../components/Tab.vue'
import RadioInputs from "../../components/RadioInputs.vue";
import { ref, onMounted, onUnmounted, watch, computed, getCurrentInstance } from 'vue';
import { useTradeStore } from '@/stores/trade';
import { ElDialog, ElTag, ElButton, ElMessage } from 'element-plus';
const tradeStore = useTradeStore();
const { Service, Request, CRUD, Storage, $message } =
    getCurrentInstance()?.proxy;

// Tab组件的模拟数据
const selectedActivityType = ref('火箭发射');
const activityOptions = [
    {
        value: '火箭发射',
        label: '火箭发射',
        icon: 'MA_Rocket'
    },
    {
        value: '快速反弹',
        label: '快速反弹',
        icon: 'MA_Rebound'
    },
    {
        value: '大笔买入',
        label: '大笔买入',
        icon: 'MA_LargePurchase'
    },
    {
        value: '60日新高',
        label: '60日新高',
        icon: 'MA_60UP'
    },
      {
        value: '封涨停板',
        label: '封涨停板',
        icon: 'MA_LimitUp'
    },
    {
        value: '高台跳水',
        label: '高台跳水',
        icon: 'MA_HighDiving'
    },
    {
        value: '加速下跌',
        label: '加速下跌',
        icon: 'MA_Down'
    },
    {
        value: '大笔卖出',
        label: '大笔卖出',
        icon: 'MA_LargeSell'
    },
    {
        value: '60日新低',
        label: '60日新低',
        icon: 'MA_60DOWN'
    },
    {
        value: '封跌停板',
        label: '封跌停板',
        icon: 'MA_LimitDown'
    },
];

/**
 * 获取异动类型名称
 * @param {string} value - 异动类型值
 * @returns {string} 异动类型名称
 */
const getActivityTypeName = (value) => {
    const option = activityOptions.find(opt => opt.value === value);
    return option ? option.label : '未知类型';
};

/**
 * 处理异动类型变更事件
 * @param {string} value - 选中的异动类型
 */
const onActivityTypeChange = (value) => {
    console.log('股市异动类型变更:', value, getActivityTypeName(value));
    // 这里可以添加根据不同异动类型加载相应数据的逻辑
    loadActivityData(value);
};

/**
 * 加载异动数据
 * @param {string} activityType - 异动类型
 */
const loadActivityData = (activityType) => {
    // 模拟数据加载逻辑
    console.log(`正在加载 ${getActivityTypeName(activityType)} 相关数据...`);
    // 实际项目中这里会调用相应的API接口
};

const timer = ref(null);
const setTimer = () => {
    clearTimer();
    timer.value = setInterval(() => {
        // getCommonQuotes();
    }, 1000 * 60 * 0.5);
}
const clearTimer = () => {
    if (timer.value) {
        clearInterval(timer.value);
    }
}

watch(() => tradeStore.tradeStatus, (newValue, oldValue) => {
    newValue === 1 ? setTimer() : clearTimer();
}, {
    immediate: true,
})

// 组件挂载时初始化数据
onMounted(() => {
    loadActivityData(selectedActivityType.label);
});

// 组件卸载时清理定时器
onUnmounted(() => {
    clearTimer();
});

</script>
<style scoped lang="scss">
.activity-content {
    margin-top: 20px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;

    p {
        margin: 0;
        font-size: 16px;
        color: #495057;
        font-weight: 500;
    }
}

h1 {
    margin-bottom: 20px;
    color: #212529;
    font-size: 24px;
    font-weight: 600;
}
</style>
