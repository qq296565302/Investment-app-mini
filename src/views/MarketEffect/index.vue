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
            <div v-for="(quote, index) in sortedQuotesData" :key="quote.代码 || index" class="quote-card"
                :class="getQuoteCardClass(quote.涨跌幅)" draggable="true" @dragstart="handleDragStart($event, index)"
                @dragover="handleDragOver($event)" @drop="handleDrop($event, index)" @dragend="handleDragEnd">
                <div class="quote-header">
                    <div class="quote-name">{{ quote.名称 }}</div>
                    <div class="quote-code">{{ quote.代码 }}</div>
                </div>
                <div class="quote-price-section">
                    <div class="quote-current-price LCD" :class="getPriceChangeClass(quote.涨跌幅)">{{
                        formatPrice(quote.最新价) }}</div>
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
        <el-dialog v-model="dialogVisible" title="选择自选股票" width="80%" :before-close="handleClose">
            <div class="selection-container">
                <div class="tags-container">
                    <el-tag v-for="stock in allStocks" :key="stock.代码"
                        :type="selectedStocks.includes(stock.代码) ? 'primary' : 'info'"
                        :effect="selectedStocks.includes(stock.代码) ? 'dark' : 'plain'" class="stock-tag"
                        @click="toggleStock(stock.代码)">
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

const timer = ref(null);
const setTimer = () => {
    clearTimer();
    timer.value = setInterval(() => {
        getCommonQuotes();
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
const CARD_ORDER_KEY = 'cardOrder';

/**
 * 拖拽相关状态
 */
const draggedIndex = ref(null);
const cardOrder = ref([]);

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
    // 更新卡片顺序，移除不再选中的股票
    cardOrder.value = cardOrder.value.filter(code => selectedStocks.value.includes(code));
    saveCardOrder();
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
 * 拖拽开始事件处理
 * @param {DragEvent} event - 拖拽事件
 * @param {number} index - 被拖拽项的索引
 */
const handleDragStart = (event, index) => {
    draggedIndex.value = index;
    event.dataTransfer.effectAllowed = 'move';
    event.target.style.opacity = '0.5';
}

/**
 * 拖拽悬停事件处理
 * @param {DragEvent} event - 拖拽事件
 */
const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

/**
 * 拖拽放置事件处理
 * @param {DragEvent} event - 拖拽事件
 * @param {number} targetIndex - 目标位置索引
 */
const handleDrop = (event, targetIndex) => {
    event.preventDefault();

    if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
        return;
    }

    // 重新排列数据
    const newOrder = [...sortedQuotesData.value];
    const draggedItem = newOrder.splice(draggedIndex.value, 1)[0];
    newOrder.splice(targetIndex, 0, draggedItem);

    // 更新卡片顺序
    cardOrder.value = newOrder.map(quote => quote.代码);

    // 保存到localStorage
    saveCardOrder();
}

/**
 * 拖拽结束事件处理
 * @param {DragEvent} event - 拖拽事件
 */
const handleDragEnd = (event) => {
    event.target.style.opacity = '1';
    draggedIndex.value = null;
}

/**
 * 保存卡片顺序到localStorage
 */
const saveCardOrder = () => {
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(cardOrder.value));
}

/**
 * 从localStorage加载卡片顺序
 */
const loadCardOrder = () => {
    const stored = localStorage.getItem(CARD_ORDER_KEY);
    if (stored) {
        cardOrder.value = JSON.parse(stored);
    }
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
 * 根据保存的顺序排序的股票数据
 */
const sortedQuotesData = computed(() => {
    const filtered = filteredQuotesData.value;
    if (cardOrder.value.length === 0 || filtered.length === 0) {
        return filtered;
    }

    // 根据保存的顺序重新排列
    const ordered = [];
    const remaining = [...filtered];

    // 先按照保存的顺序添加
    cardOrder.value.forEach(code => {
        const index = remaining.findIndex(quote => quote.代码 === code);
        if (index !== -1) {
            ordered.push(remaining.splice(index, 1)[0]);
        }
    });

    // 添加新的未排序的项目
    ordered.push(...remaining);

    return ordered;
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
const getPriceChangeClass = (change) => {
    if (change > 0) return 'price-rise';
    if (change < 0) return 'price-fall';
    return 'price-flat';
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
    // 加载卡片顺序
    loadCardOrder();
})

onUnmounted(() => {
})
</script>
<style scoped lang="scss">
@use './style/index.scss';
</style>
