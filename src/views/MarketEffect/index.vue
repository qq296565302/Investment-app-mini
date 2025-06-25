<template>
    <div class="market-effect-container">
        <!-- <div class="effect-bar">
            <div :style="renderStyle('rise')">
            </div>
            <div :style="renderStyle('flat')">
            </div>
            <div :style="renderStyle('fall')">
            </div>
        </div> -->
        <!-- 图例区域 -->
        <!-- <div class="legend-container">
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
        </div> -->
        <!-- 指数行情卡片 -->
        <div class="quotes-cards-container">
            <div 
                v-for="(quote, index) in filteredQuotesData" 
                :key="quote.代码 || index"
                class="quote-card"
                :class="getQuoteCardClass(quote.涨跌幅)"
            >
                <div class="quote-header">
                    <div class="quote-name">{{ quote.名称 }}</div>
                    <div class="quote-code">{{ quote.代码 }}</div>
                </div>
                <div class="quote-price-section">
                    <div class="quote-current-price LCD">{{ formatPrice(quote.最新价) }}</div>
                    <div class="quote-change" :class="getChangeClass(quote.涨跌幅)">
                        {{ formatChange(quote.涨跌幅) }}%
                    </div>
                </div>
                <div class="quote-details">
                    <div class="quote-detail-row">
                        <div class="quote-detail-item">
                            <span class="detail-label">今开</span>
                            <span class="detail-value">{{ formatPrice(quote.今开) }}</span>
                        </div>
                        <div class="quote-detail-item">
                            <span class="detail-label">昨收</span>
                            <span class="detail-value">{{ formatPrice(quote.昨收) }}</span>
                        </div>
                        <div class="quote-detail-item">
                            <span class="detail-label">最高</span>
                            <span class="detail-value">{{ formatPrice(quote.最高) }}</span>
                        </div>
                    </div>
                    <div class="quote-detail-row">
                        <div class="quote-detail-item">
                            <span class="detail-label">最低</span>
                            <span class="detail-value">{{ formatPrice(quote.最低) }}</span>
                        </div>
                        <div class="quote-detail-item">
                            <span class="detail-label">成交额</span>
                            <span class="detail-value">{{ formatVolume(quote.成交额) }}</span>
                        </div>
                        <div class="quote-detail-item">
                            <span class="detail-label">量比</span>
                            <span class="detail-value">{{ formatRatio(quote.量比) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom-button" @click="openSelectionDialog">
            添加自选
        </div>
        
        <!-- 自选股票弹窗 -->
        <el-dialog 
            v-model="dialogVisible" 
            title="选择自选股票" 
            width="80%"
            :before-close="handleClose"
        >
            <div class="selection-container">
                <div class="tags-container">
                    <el-tag
                        v-for="stock in allStocks"
                        :key="stock.代码"
                        :type="selectedStocks.includes(stock.代码) ? 'primary' : 'info'"
                        :effect="selectedStocks.includes(stock.代码) ? 'dark' : 'plain'"
                        class="stock-tag"
                        @click="toggleStock(stock.代码)"
                    >
                        {{ stock.名称 }} ({{ stock.代码 }})
                    </el-tag>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveSelection">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch, computed, getCurrentInstance } from 'vue';
import { useTradeStore } from '@/stores/trade';
import { ElDialog, ElTag, ElButton, ElMessage } from 'element-plus';
const tradeStore = useTradeStore();
const { Service, Request, CRUD, Storage, $message } =
    getCurrentInstance()?.proxy;

const PAGE_NAME = "MarketEffect";
Service.registerApi(PAGE_NAME, {
    fetch: {
        getMarketEffect: () => Request.get(`/finance/quotes/market-effect`), // 获取赚钱行情
        getCommonQuotes: () => Request.get(`/finance/quotes/common`), // 获取公共行情
    },
});

const RequestCollection = {
    getMarketEffect: async () => {
        const result = await CRUD.launch(() => {
            return Service.fetch(PAGE_NAME, undefined, "getMarketEffect");
        });
        return result.data;
    }, // 获取赚钱效应
    getCommonQuotes: async () => {
        const result = await CRUD.launch(() => {
            return Service.fetch(PAGE_NAME, undefined, "getCommonQuotes");
        });
        return result.data;
    }, // 获取公共行情
}

/**
 * * 赚钱效应
 */
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
    const marketEffect = await RequestCollection.getMarketEffect();
    MarketEffectData.value = marketEffect;
    MarketEffectData.value.total = marketEffect.rise + marketEffect.fall + marketEffect.flat + marketEffect.suspended;
}

const renderStyle = (type) => {
    let color = ''
    switch (type) {
        case 'rise':
            color = 'rgb(255, 0, 0)';
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

/**
 * * 指数行情
 */
const CommonQuotesData = ref([]);
const getCommonQuotes = async () => {
    const commonQuotes = await RequestCollection.getCommonQuotes();
    CommonQuotesData.value = commonQuotes || [];
    // 保存所有股票信息到localStorage
    saveAllStocksToStorage();
}

/**
 * * 自选股票功能
 */
// 弹窗显示状态
const dialogVisible = ref(false);
// 所有股票数据
const allStocks = ref([]);
// 当前选中的股票代码列表
const selectedStocks = ref([]);
// localStorage键名
const STORAGE_KEY = 'selectedStocks';
const ALL_STOCKS_KEY = 'allStocks';

/**
 * 保存所有股票信息到localStorage
 */
const saveAllStocksToStorage = () => {
    if (CommonQuotesData.value && CommonQuotesData.value.length > 0) {
        const stocksInfo = CommonQuotesData.value.map(quote => ({
            名称: quote.名称,
            代码: quote.代码
        }));
        localStorage.setItem(ALL_STOCKS_KEY, JSON.stringify(stocksInfo));
        allStocks.value = stocksInfo;
    }
}

/**
 * 从localStorage加载所有股票信息
 */
const loadAllStocksFromStorage = () => {
    const stored = localStorage.getItem(ALL_STOCKS_KEY);
    if (stored) {
        allStocks.value = JSON.parse(stored);
    }
}

/**
 * 从localStorage加载已选中的股票
 */
const loadSelectedStocks = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        selectedStocks.value = JSON.parse(stored);
    }
}

/**
 * 保存选中的股票到localStorage
 */
const saveSelectedStocks = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStocks.value));
}

/**
 * 打开选择弹窗
 */
const openSelectionDialog = () => {
    loadAllStocksFromStorage();
    dialogVisible.value = true;
}

/**
 * 切换股票选中状态
 * @param {string} stockCode - 股票代码
 */
const toggleStock = (stockCode) => {
    const index = selectedStocks.value.indexOf(stockCode);
    if (index > -1) {
        selectedStocks.value.splice(index, 1);
    } else {
        selectedStocks.value.push(stockCode);
    }
}

/**
 * 保存选择并关闭弹窗
 */
const saveSelection = () => {
    saveSelectedStocks();
    dialogVisible.value = false;
    ElMessage.success('自选股票保存成功');
}

/**
 * 关闭弹窗前的处理
 */
const handleClose = (done) => {
    done();
}

/**
 * 过滤后的股票数据（只显示选中的股票）
 */
const filteredQuotesData = computed(() => {
    if (selectedStocks.value.length === 0) {
        return CommonQuotesData.value;
    }
    return CommonQuotesData.value.filter(quote => 
        selectedStocks.value.includes(quote.代码)
    );
})

/**
 * 格式化价格显示
 * @param {number} price - 价格数值
 * @returns {string} 格式化后的价格字符串
 */
const formatPrice = (price) => {
    if (price === null || price === undefined) return '--';
    return Number(price).toFixed(2);
}

/**
 * 格式化涨跌幅显示
 * @param {number} change - 涨跌幅数值
 * @returns {string} 格式化后的涨跌幅字符串
 */
const formatChange = (change) => {
    if (change === null || change === undefined) return '0.00';
    const formatted = Number(change).toFixed(2);
    return change > 0 ? `+${formatted}` : formatted;
}

/**
 * 格式化成交额显示
 * @param {number} volume - 成交额数值
 * @returns {string} 格式化后的成交额字符串
 */
const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return '--';
    const num = Number(volume);
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + '万亿';
    } else if (num >= 1e8) {
        return (num / 1e8).toFixed(2) + '亿';
    } else if (num >= 1e4) {
        return (num / 1e4).toFixed(2) + '万';
    }
    return num.toFixed(2);
}

/**
 * 格式化量比显示
 * @param {number} ratio - 量比数值
 * @returns {string} 格式化后的量比字符串
 */
const formatRatio = (ratio) => {
    if (ratio === null || ratio === undefined) return '--';
    return Number(ratio).toFixed(2);
}

/**
 * 获取涨跌幅对应的样式类名
 * @param {number} change - 涨跌幅数值
 * @returns {string} 样式类名
 */
const getChangeClass = (change) => {
    if (change > 0) return 'change-rise';
    if (change < 0) return 'change-fall';
    return 'change-flat';
}

/**
 * 获取卡片对应的样式类名
 * @param {number} change - 涨跌幅数值
 * @returns {string} 卡片样式类名
 */
const getQuoteCardClass = (change) => {
    if (change > 0) return 'card-rise';
    if (change < 0) return 'card-fall';
    return 'card-flat';
}

onMounted(async () => {
    await getMarketEffect();
    await getCommonQuotes();
    // 加载已选中的股票
    loadSelectedStocks();
})

onUnmounted(() => {
})
</script>
<style scoped lang="scss">
.market-effect-container {
    box-sizing: border-box;
    padding: 20px;
    position: relative;
    display: flex;
    flex-direction: column;
}

.effect-bar {
    align-items: center;
    background-color: rgb(214, 214, 214);
    border-radius: 10px;
    box-sizing: border-box;
    display: flex;
    height: 10px;
    justify-content: space-between;
    overflow: hidden;
    width: 100%;
}

/* 图例样式 */
.legend {
    &-container {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin: 15px 20px;
        flex-wrap: wrap;
    }

    &-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #333;
    }

    &-color {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
    }

    &-text {
        white-space: nowrap;
        font-weight: 500;
    }
}

// 图例颜色类
.rise-color {
    background-color: rgb(255, 0, 0);
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

/* 毛玻璃按钮样式 */
.bottom-button {
    position: absolute;
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

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

/* 指数行情卡片样式 */
.quotes-cards-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0 10px;
    height: 100%;
    overflow: auto;
    flex: 1;

    &::-webkit-scrollbar {
        display: none;
    }
}

.quote {
    &-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        height: 160px;
        overflow: hidden;

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            // background: linear-gradient(90deg, #e0e0e0, #e0e0e0);
            transition: background 0.3s ease;
        }

        // &.card-rise::before {
        //     background: linear-gradient(90deg, #ff4757, #ff6b7a);
        // }

        // &.card-fall::before {
        //     background: linear-gradient(90deg, #2ed573, #7bed9f);
        // }

        // &.card-flat::before {
        //     background: linear-gradient(90deg, #5352ed, #7f8ff4);
        // }

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
    }

    &-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
    }

    &-name {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
        letter-spacing: 0.5px;
    }

    &-code {
        font-size: 12px;
        color: #7f8c8d;
        background: #ecf0f1;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
    }

    &-price-section {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 5px;
        padding-bottom: 5px;
        border-bottom: 1px solid #ecf0f1;
    }

    &-current-price {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        letter-spacing: 2px;
    }

    &-change {
        font-size: 14px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 8px;
        letter-spacing: 0.3px;
    }

    &-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &-detail {
        &-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
        }

        &-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            padding: 4px 0;
            text-align: center;
        }
    }
}

// 涨跌幅样式
.change {
    &-rise {
        color: #ffffff;
        background: linear-gradient(135deg, #ff4757, #ff6b7a);
    }

    &-fall {
        color: #ffffff;
        background: linear-gradient(135deg, #2ed573, #7bed9f);
    }

    &-flat {
        color: #ffffff;
        background: linear-gradient(135deg, #5352ed, #7f8ff4);
    }
}

// 详情标签和值
.detail {
    &-label {
        font-size: 12px;
        color: #7f8c8d;
        font-weight: 500;
    }

    &-value {
        font-size: 13px;
        color: #2c3e50;
        font-weight: 600;
        font-family: 'Courier New', monospace;
    }
}

/* 自选股票弹窗样式 */
.selection-container {
    max-height: 400px;
    overflow-y: auto;
    
    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 10px 0;
        
        .stock-tag {
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            padding: 8px 16px;
            border-radius: 20px;
            
            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 自定义滚动条样式 */
.selection-container::-webkit-scrollbar {
    width: 6px;
}

.selection-container::-webkit-scrollbar-track {
    background: transparent;
}

.selection-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
        background: rgba(0, 0, 0, 0.3);
    }
}
</style>
