<template>
  <div class="index-card">
    <div class="card-header">
      <div class="value-data">
        <span class="price"
          >{{ indexData.最新价 }}
          <span
            class="change"
            :class="{ up: indexData.涨跌幅 > 0, down: indexData.涨跌幅 < 0 }"
            >{{ indexData.涨跌幅 }}%</span
          >
        </span>

        <span class="name">{{ indexData.名称 }}</span>
      </div>
      <div class="market-data">
        <div class="data-row">
          <span class="data-item"
            ><span class="label">最高:</span>
            {{ indexData.最高 || "-" }}</span
          >
          <span class="data-item"
            ><span class="label">最低:</span>
            {{ indexData.最低 || "-" }}</span
          >
        </div>
        <div class="data-row">
          <span class="data-item"
            ><span class="label">成交量:</span>
            {{ formatNumber(indexData.成交量) || "-" }}</span
          >
          <span class="data-item"
            ><span class="label">成交额:</span>
            {{ formatNumber(indexData.成交额) || "-" }}</span
          >
        </div>
        <div class="data-row">
          <span class="data-item"
            ><span class="label">振幅:</span> {{ indexData.振幅 || "-" }}%</span
          >
          <span class="data-item"
            ><span class="label">量比:</span> {{ indexData.量比 || "-" }}</span
          >
        </div>
      </div>
    </div>
    <div class="chart-container">
      <IndexChart :indexData="indexData" :isUp="indexData.涨跌幅 > 0" />
    </div>
  </div>
</template>

<script setup>
import IndexChart from "../ECharts/IndexChart.vue";
const props = defineProps({
  indexData: {
    type: Object,
    default: () => {},
  },
});

// 格式化数字，将大数字转换为带单位的形式（万、亿）
const formatNumber = (num) => {
  if (!num) return "-";

  // 将字符串转换为数字
  const value =
    typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;

  if (isNaN(value)) return "-";

  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + "亿";
  } else if (value >= 10000) {
    return (value / 10000).toFixed(2) + "万";
  } else {
    return value.toLocaleString();
  }
};
</script>
<style scoped lang="scss">
.index-card {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .card-header {
    box-sizing: border-box;
    height: 70px;
    display: grid;
    grid-template-columns: 40% 60%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px;

    .value-data {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      gap: 5px;
      .price {
        display: flex;
        align-items: center;
        font-size: 24px;
        font-weight: bold;
        .change {
          font-size: 14px;
          border-radius: 4px;
          margin-left: 5px;
          padding: 2px 8px;
          &.down {
            background-color: rgba(0, 204, 82, 0.2);
            color: #00cc52;
          }

          &.up {
            background-color: rgba(233, 30, 99, 0.2);
            color: #e91e63;
          }
        }
      }

      .name {
        font-size: 14px;
        color: #999;
      }
    }
  }

  .chart-container {
    width: 100%;
    height: calc(100% - 70px);
  }

  .market-data {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 5px;
    margin: 0 2px;

    .data-row {
      display: flex;
      justify-content: space-between;
      gap: 5px;

      .data-item {
        font-size: 14px;
        color: #999;

        .label {
          color: #999;
          margin-right: 3px;
        }
      }
    }
  }
}
</style>
