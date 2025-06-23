<template>
    <div class="dynamic-container">
        <!-- 动态卡片列表 -->
        <div class="card-list" v-if="CompanyDynamicsStatus">
            <div v-for="item in CompanyDynamicsData" :key="item.序号" class="dynamic-card">
                <!-- 卡片头部 -->
                <div class="card-header">
                    <div class="stock-info">
                        <span class="stock-name">{{ item.简称 }}</span>
                        <span class="stock-code">({{ item.代码 }})</span>
                        <el-tag :type="getTagType(item.事件类型)" size="small" class="event-tag">
                            {{ item.事件类型 }}
                        </el-tag>
                    </div>
                </div>

                <!-- 卡片内容 -->
                <div class="card-content">
                    <p class="event-detail">{{ item.具体事项 }}</p>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
            <p>今日休市</p>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useTradeStore } from '@/stores/trade';
const tradeStore = useTradeStore();
const { Service, Request, CRUD, Storage, $message } =
    getCurrentInstance()?.proxy;

const PAGE_NAME = "CompanyDynamics";
Service.registerApi(PAGE_NAME, {
    fetch: {
        getCompanyDynamics: (date) => Request.get(`/finance/quotes/company-dynamics?date=${date}`), // 获取赚钱行情
        getServiceTime: () => Request.get(`/finance/time`), // 获取服务时间
        isTradeDayToday: () => Request.get(`/finance/is-trading-day`), // 获取是否交易日
    },
});

const RequestCollection = {
    getCompanyDynamics: (date) => Service.fetch(PAGE_NAME, date, "getCompanyDynamics"), // 获取赚钱行情
    getServiceTime: () => Service.fetch(PAGE_NAME, undefined, "getServiceTime"), // 获取服务时间
    isTradeDayToday: () => Service.fetch(PAGE_NAME, undefined, "isTradeDayToday"), // 获取是否交易日
}
const CompanyDynamicsData = ref([]);
const CompanyDynamicsStatus = ref(false);
/**
 * 获取企业动态数据
 * @param {string} date - 查询日期
 */
const getCompanyDynamics = async () => {
    try {
        if (!CompanyDynamicsStatus.value) {
            return;
        }
        const { data: serviceTime } = await RequestCollection.getServiceTime();
        const res = await RequestCollection.getCompanyDynamics(serviceTime.slice(0, 10).replace(/-/g, ''));
        CompanyDynamicsData.value = res.data || [];
    } catch (error) {
        console.error('获取企业动态数据失败:', error);
        CompanyDynamicsData.value = [];
    }
}

/**
 * 根据事件类型返回对应的标签类型
 * @param {string} eventType - 事件类型
 * @returns {string} 标签类型
 */
const getTagType = (eventType) => {
    const typeMap = {
        '资产重组': 'warning',
        '股份质押': 'warning',
        '增发': 'success',
        '资产收购': 'success',
        '停牌': 'danger',
        '复牌': 'success',
        '业绩预告': 'info',
        '对外担保': 'warning'
    };
    return typeMap[eventType] || 'info';
}


onMounted(async () => {
    const isTradeDayToday = await RequestCollection.isTradeDayToday();
    if (isTradeDayToday.data !== 0) {
        CompanyDynamicsStatus.value = true;
        getCompanyDynamics();
    } else {
        CompanyDynamicsStatus.value = false;
    }
})

</script>
<style scoped lang="scss">
.dynamic-container {
    box-sizing: border-box;
    padding: 20px;
    background-color: #f5f5f5;
    overflow: auto;

    &::-webkit-scrollbar {
        display: none;
    }
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.card-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto;
}

.dynamic-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    border: 1px solid #e8e8e8;

    &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.stock-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.stock-name {
    font-size: 20px;
    font-weight: 600;
    color: #333;
}

.stock-code {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.event-tag {
    margin-left: 4px;
}

.add-favorite-btn {
    flex-shrink: 0;
    border-radius: 8px;
    font-weight: 500;
}

.card-content {
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
}

.event-detail {
    font-size: 16px;
    line-height: 2;
    color: #555;
    margin: 0;
    text-align: justify;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
    font-size: 16px;
}
</style>