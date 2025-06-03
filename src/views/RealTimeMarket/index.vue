<template>
  <div class="RealTimeMarket">
    <section class="market">
      <!-- 交易状态 -->
      <el-alert
        class="alert"
        v-if="alertMessage"
        :title="alertMessage"
        :type="alertType"
      />
      <!-- 赚钱效应分析 -->
      <!-- <div class="earnings">
        <el-button>赚钱效应分析</el-button>
      </div> -->
      <!-- 指数行情 -->
      <div class="index-container">
        <IndexCard
          v-for="item in publicList"
          :key="item.代码"
          :indexData="item"
        />
      </div>
      <!-- <el-collapse v-model="marketType">
        <el-collapse-item
          :name="item.代码"
          v-for="(item, index) in publicList"
          :key="index"
          :class="{
            'flash-red': item.flashRed,
            'flash-green': item.flashGreen,
          }"
        >
          <template #title>
            <div v-html="generateTitle(item)"></div>
          </template>
          <div class="chart">
            <TickChart
              :dcOrder="publicDcOrderList[index] || []"
              :down="item.涨跌 < 0"
            />
          </div>
        </el-collapse-item>
      </el-collapse> -->
    </section>
    <section class="news">
      <RadioInputs v-model="newsType" name="news-type" :options="newsOptions" />
      <News v-if="newsType === 'telegraph'" ref="newsComponent" />
      <Sina7x24 v-if="newsType === 'sina'" ref="sinaComponent" />
    </section>
  </div>
</template>

<script setup>
import News from "./News.vue"; // 财联社
import Sina7x24 from "./Sina7x24.vue"; // 新浪7x24
import RadioInputs from "../../components/RadioInputs.vue";
import { useTradeStore } from "stores/trade"; // 状态管理 store
import WebSocketService from "@zhaoshijun/ws-service";
import TickChart from "../ECharts/TickChart.vue";
import IndexCard from "./indexCard.vue";
const { Service, Request, CRUD, Storage, $message } =
  getCurrentInstance()?.proxy;
const PAGE_NAME = "RealTimeMarket";
Service.registerApi(PAGE_NAME, {
  fetch: {
    quotesIntraday: () => Request.get(`/finance/quotes/intraday`), // 指数分时行情
    publicQuotes: () => Request.get(`/finance/quotes/public`),
    dcOrderData: () => Request.get(`/finance/quotes/dc-order`),
  },
});

const tempIndexData = [
  {
    代码: "000001",
    名称: "上证指数",
    最新价: 3362.05,
    涨跌幅: -0.16,
    涨跌额: -5.41,
    成交量: 219251939,
    成交额: 234256519213.0,
    振幅: 0.39,
    最高: 3369.92,
    最低: 3356.65,
    今开: 3365.88,
    昨收: 3367.46,
    量比: 1.58,
  },
];


const RequestCollection = {
  getQuotesIntraday: async () => {
    const result = await CRUD.launch(() => {
      return Service.fetch(PAGE_NAME, undefined, "quotesIntraday");
    });
    return result.data;
  },

  getPublicQuotes: async () => {
    const result = await CRUD.launch(() => {
      return Service.fetch(PAGE_NAME, undefined, "publicQuotes");
    });
    return result.data;
  },
  getDcOrderData: async () => {
    const result = await CRUD.launch(() => {
      return Service.fetch(PAGE_NAME, undefined, "dcOrderData");
    });
    return result.data;
  },
};

/**
 * WebSocket
 */
const ws = WebSocketService.getInstance();
const tradeStore = useTradeStore(); // 获取交易状态 store
const alertMessage = ref("");
const alertType = ref("error");
watch(
  () => tradeStore.tradeStatus,
  () => {
    const statusName = tradeStore.tradeStatusName;
    let alertText = "";
    if (tradeStore.tradeStatus === "3") {
      alertType.value = "info";
      alertText = `A股 ${statusName}`;
    }
    if (tradeStore.tradeStatus === "2") {
      alertType.value = "error";
      alertText = `A股 ${statusName}，最后交易时间：${tradeStore.lastTradeTime}`;
    }
    if (tradeStore.tradeStatus === "1") {
      alertType.value = "success";
      alertText = `A股 ${statusName}`;
    }
    if (tradeStore.tradeStatus === "0") {
      alertType.value = "error";
      alertText = `A股 ${statusName}`;
    }
    alertMessage.value = alertText;

    // 获取 WebSocket 服务并发送状态变化消息
    try {
      if (ws.getState() === 1) {
        // 1 表示 WebSocket.OPEN
        const statusMessage = JSON.stringify({
          type: "tradeStatusChange",
          data: {
            status: tradeStore.tradeStatus,
            statusName: statusName,
            timestamp: Date.now(),
            lastTradeTime: tradeStore.lastTradeTime || null,
          },
        });

        // 发送消息到服务端
        ws.send(statusMessage);
        console.log("已发送交易状态变化消息到服务端");
      } else {
        console.warn("WebSocket 连接未打开，无法发送交易状态变化消息");
      }
    } catch (error) {
      console.error("发送交易状态变化消息失败:", error);
    }
  }
);

/**
 * 市场类型
 */
const marketType = ref("");

const publicList = ref([]);
const publicDcOrderList = ref([]);
// 生成标题
const generateTitle = (item) => {
  const isUp = item.涨跌 > 0;
  return `<p class="title">
                 <span class="name">${item.名称}</span>
                 <span class="code">${item.代码}</span>
    </p>
    <span class="price LCD ${isUp ? "up" : "down"}">${item.现价}</span>
    <span class="change LCD ${isUp ? "up" : "down"}">${item.涨跌}</span>
    <span class="rate LCD ${isUp ? "up" : "down"}">${item.涨幅}%</span>
    `;
};

// 定义一个变量保存上次的数据
let previousData = null;

// 处理WebSocket消息更新，并添加闪烁效果
const unsubscribe = ws.subscribe("public_quotes_update", (payload, message) => {
  const newData = transformArrayToObject(message.data);
  if (!newData || newData.length === 0) return;
  // 如果已有上次数据，则比较新旧数据的涨跌，添加闪烁效果
  if (
    previousData &&
    previousData.length > 0 &&
    newData &&
    newData.length > 0
  ) {
    newData.forEach((newItem, index) => {
      // 查找对应的上次数据项
      const prevItem = previousData.find((item) => item.代码 === newItem.代码);

      if (prevItem) {
        // 将涨跌值转换为数字进行比较
        const newChangeValue = parseFloat(newItem.涨跌);
        const prevChangeValue = parseFloat(prevItem.涨跌);

        if (!isNaN(newChangeValue) && !isNaN(prevChangeValue)) {
          // 新数据的涨跌大于旧数据，闪红色（上涨）
          newItem.flashRed = newChangeValue > prevChangeValue;
          // 新数据的涨跌小于旧数据，闪绿色（下跌）
          newItem.flashGreen = newChangeValue < prevChangeValue;

          // 3秒后移除闪烁效果
          setTimeout(() => {
            if (publicList.value && publicList.value[index]) {
              publicList.value[index].flashRed = false;
              publicList.value[index].flashGreen = false;
            }
          }, 3000);
        }
      }
    });
  }

  // 更新当前数据并保存上次数据
  previousData = JSON.parse(JSON.stringify(newData)); // 深拷贝保存上次数据
  publicList.value = newData;
});

const historyUnsubscribe = ws.subscribe(
  "public_quotes_history",
  (payload, message) => {
    publicDcOrderList.value = message.data;
  }
);

// 新闻类型
const newsType = ref("telegraph");
const newsOptions = [
  { value: "telegraph", label: "财联社电报" },
  { value: "sina", label: "新浪7x24" },
];

onBeforeMount(async () => {
  publicList.value = await RequestCollection.getPublicQuotes();
  publicDcOrderList.value = await RequestCollection.getQuotesIntraday();
});

// 组件卸载前关闭WebSocket连接
onBeforeUnmount(() => {
  unsubscribe();
  historyUnsubscribe();
});
onMounted(() => {});
defineExpose({});
</script>
<style lang="scss" scoped>
@use "./scss/radioInputs.scss";

.RealTimeMarket {
  display: flex;
  flex-direction: row;
  height: 100%;

  :deep(.el-collapse) {
    --el-collapse-border-color: transparent;
    --el-collapse-header-bg-color: transparent;
    --el-collapse-content-bg-color: transparent;

    .el-collapse-item {
      margin: 10px 0;

      :deep(.el-collapse-item__content) {
        padding: 0;
      }

      .chart {
        // height: 400px;
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;

        .chart-container {
          width: 100% !important;
          height: 100% !important;
        }
      }
    }

    .el-collapse-item__header {
      font-size: 16px;
      height: 70px;

      > div {
        align-items: center;
        display: flex;
        height: 100%;

        .title {
          justify-items: center;
          display: flex;
          flex-direction: column;
          width: 120px;

          > span {
            display: block;
            line-height: 25px;
            height: 25px;
            text-align: center;

            &.code {
              font-size: 12px;
            }
          }
        }

        .LCD {
          display: inline-block;
          text-align: left;
          min-width: 90px;
          font-size: 24px;

          &.down {
            color: #009900;
          }

          &.up {
            color: #ff0000;
          }
        }
      }
    }

    .flash-red .el-collapse-item__header {
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(255, 0, 0, 0) 0%,
          rgba(255, 0, 0, 0.3) 50%,
          rgba(255, 0, 0, 0) 100%
        );
        animation: flashRed 1s linear forwards;
      }
    }

    .flash-green .el-collapse-item__header {
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          rgba(0, 255, 0, 0) 0%,
          rgba(0, 255, 0, 0.3) 50%,
          rgba(0, 255, 0, 0) 100%
        );
        animation: flashGreen 1s linear forwards;
      }
    }

    @keyframes flashRed {
      0% {
        transform: translateX(-100%);
      }

      100% {
        transform: translateX(100%);
      }
    }

    @keyframes flashGreen {
      0% {
        transform: translateX(-100%);
      }

      100% {
        transform: translateX(100%);
      }
    }
  }

  .market {
    position: relative;
    flex: 6;
    padding: 10px;
    height: 100%;
    overflow: auto;

    &::-webkit-scrollbar {
      display: none;
    }

    .index-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      grid-auto-rows: 200px;
      height: 100%;
      overflow: auto;
      width: 100%;
    }

    .alert {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 10;
    }
  }

  .news {
    flex: 3;
  }
}
</style>
