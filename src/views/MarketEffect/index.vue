<template>
    <div>
        <div class="effect-bar">
            <div :style="renderStyle('rise')">
            </div>
            <div :style="renderStyle('flat')">
            </div>
            <div :style="renderStyle('fall')">
            </div>
        </div>
        <!-- 图例区域 -->
        <div class="legend-container">
            <div class="legend-item">
                <div class="legend-color rise-color"></div>
                <span class="legend-text">上涨: {{ MarketEffectData.rise }}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color fall-color"></div>
                <span class="legend-text">下跌: {{ MarketEffectData.fall }}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color flat-color"></div>
                <span class="legend-text">平盘: {{ MarketEffectData.flat }}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color suspended-color"></div>
                <span class="legend-text">停牌: {{ MarketEffectData.suspended }}</span>
            </div>
        </div>
        <div class="bottom-button">
            添加自选
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useTradeStore } from '@/stores/trade';
const tradeStore = useTradeStore();
const { Service, Request, CRUD, Storage, $message } =
    getCurrentInstance()?.proxy;

const PAGE_NAME = "MarketEffect";
Service.registerApi(PAGE_NAME, {
    fetch: {
        getMarketEffect: () => Request.get(`/finance/quotes/market-effect`), // 获取赚钱行情
    },
});

const RequestCollection = {
    getMarketEffect: () => Service.fetch(PAGE_NAME, undefined, "getMarketEffect"), // 获取赚钱行情
}
const MarketEffectData = ref({
    "rise": 0,
    "limitUp": 0,
    "realLimitUp": 0,
    "stLimitUp": 0,
    "fall": 0,
    "limitDown": 0,
    "realLimitDown": 0,
    "stLimitDown": 0,
    "flat": 0,
    "suspended": 0,
    "activity": "0%",
    "statisticsDate": "2025-06-20 00:00:00",
})
const getMarketEffect = async () => {
    const res = await RequestCollection.getMarketEffect();
    MarketEffectData.value = res.data;
    MarketEffectData.value.total = res.data.rise + res.data.fall + res.data.flat + res.data.suspended;
}

const renderStyle = (type) => {
    let color = ''
    switch (type) {
        case 'rise':
            color = 'rgb(230, 91, 91)';
            break;
        case 'fall':
            color = 'rgb(134, 211, 83)';
            break;
        case 'flat':
            color = '#0000ff';
            break;

    }
    const width = Math.floor((MarketEffectData.value[type] / MarketEffectData.value.total) * 100);
    return {
        width: `${width}%`,
        height: '100%',
        background: color,
    }
}

const timer = ref(null);
const setTimer = () => {
    clearTimer();
    timer.value = setInterval(() => {
        getMarketEffect();
    }, 1000 * 60 * 3);
}
const clearTimer = () => {
    if (timer.value) {
        clearInterval(timer.value);
    }
}

watch(() => tradeStore.tradeStatus, (newValue, oldValue) => {
    if (newValue === 1) {
        setTimer();
    } else {
        clearTimer();
    }
})

onMounted(() => {
    getMarketEffect();
})

onUnmounted(() => {
})
</script>
<style scoped lang="scss">
.effect-bar {
    align-items: center;
    background-color: rgb(214, 214, 214);
    border-radius: 10px;
    box-sizing: border-box;
    display: flex;
    height: 10px;
    justify-content: space-between;
    margin: 10px 20px;
    overflow: hidden;
    width: calc(100% - 40px);
}

/* 图例样式 */
.legend-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 15px 20px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #333;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 100%;
    flex-shrink: 0;
}

.rise-color {
    background-color: rgb(230, 91, 91);
}

.fall-color {
    background-color: rgb(134, 211, 83);
}

.flat-color {
    background-color: #0000ff;
}

.suspended-color {
    background-color: rgb(214, 214, 214);
}

.legend-text {
    white-space: nowrap;
    font-weight: 500;
}

/* 毛玻璃按钮样式 */
.bottom-button {
    position: fixed;
    bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    left: calc(50% - 100px);
    padding: 12px 24px;
    width: 200px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    /* 毛玻璃效果 */
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    
    /* 过渡动画 */
    transition: all 0.3s ease;
}

.bottom-button:hover {
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.bottom-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
