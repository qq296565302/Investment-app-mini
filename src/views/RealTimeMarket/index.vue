<template>
  <div class="RealTimeMarket">
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

// 新闻类型
const newsType = ref("telegraph");
const newsOptions = [
  { value: "telegraph", label: "财联社电报" },
  { value: "sina", label: "新浪7x24" },
];

onBeforeMount(async () => {

});

// 组件卸载前关闭WebSocket连接
onBeforeUnmount(() => {
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
