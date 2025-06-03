<template>
  <!-- 分时图 -->
  <div class="chart-container">
    <div :id="chartId" style="width: 945px; height: 200px"></div>
  </div>
</template>
<script setup>
const xData = ref([]); // 交易时间数组
const priceData = ref([]); // 价格数据
const VolumeData = ref([]); // 买盘数据

const props = defineProps(["dcOrder", "up", "down"]);

// 监听数据变化
watch(
  () => props.dcOrder,
  () => {
    // 更新数据
    updateDcOrder();
  }
);

// 监听down属性变化
watch(
  () => props.down,
  () => {
    // 当down属性变化时重新绘制图表
    if (chartInstance) {
      initChart();
    }
  }
);

const { echarts } = getCurrentInstance()?.proxy;

// 为每个图表生成唯一ID
const chartId = ref(`chart-${Math.random().toString(36).substring(2, 9)}`);

let chartInstance = null;

// 初始化图表配置
const initChartOption = () => {
  return {
    legend: {
      show: true,
      data: ["指数", "成交量"],
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      top: 0,
      right: "center",
      textStyle: {
        color: "#333",
      },
    },

    title: {
      show: false,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        lineStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(255,255,255,0.1)",
              },
              {
                offset: 0.5,
                color: "rgba(255,255,255,0.8)",
              },
              {
                offset: 1,
                color: "rgba(255,255,255,0.1)",
              },
            ],
            global: false,
          },
        },
      },
    },
    grid: {
      top: "25%",
      left: "2%",
      right: "2%",
      bottom: "5%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: "rgb(0,0,0,0.1)",
          },
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: "rgb(0,0,0,0.1)",
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: "#666",
          fontSize: 10,
        },
        data: xData.value,
      },
    ],
    yAxis: [
      {
        type: "value",
        name: "", // 移除左侧Y轴标题
        position: "left",
        min: function (value) {
          // 设置最小值为数据最小值的95%左右，确保有一些底部空间
          return Math.floor(value.min);
        },
        max: function (value) {
          // 设置最大值为数据最大值的105%左右，确保有一些顶部空间
          return Math.ceil(value.max);
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: "rgba(0,0,0,0.1)",
          },
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: "rgba(0,0,0,0.5)",
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
          color: "#666",
          fontSize: 10,
          formatter: function (value) {
            // 如果数值较大，可以考虑使用千分位分隔符
            return value.toFixed(2);
          },
        },
        splitArea: {
          show: false,
        },
      },
      {
        type: "value",
        name: "", // 移除右侧Y轴标题

        position: "right",
        splitLine: {
          show: false,
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: "rgba(0,0,0,0.5)",
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
          color: "#666",
          fontSize: 10,
        },
      },
    ],
    series: [
      {
        name: "指数",
        type: "line",
        smooth: false,
        symbol: "circle",
        symbolSize: 5,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: !props.down ? "#e91e63" : "#00cc52",
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1,
            [
              {
                offset: 0,
                color: !props.down
                  ? "rgba(233, 30, 99, 0.5)"
                  : "rgba(0, 204, 82, 0.5)",
              },
              {
                offset: 1,
                color: !props.down
                  ? "rgba(233, 30, 99, 0.1)"
                  : "rgba(0, 204, 82, 0.1)",
              },
            ],
            false
          ),
        },
        itemStyle: {
          color: !props.down ? "#e91e63" : "#00cc52",
          borderColor: !props.down
            ? "rgba(233, 30, 99, 0.3)"
            : "rgba(0, 204, 82, 0.3)",
          borderWidth: 8,
        },
        data: priceData.value,
      },
      {
        name: "成交量",
        type: "line",
        smooth: true,
        showSymbol: false,
        yAxisIndex: 1, // 使用右侧Y轴
        itemStyle: {
          color: "#ffc107", // 黄色表示成交量
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1,
            [
              {
                offset: 0,
                color: "rgba(179, 233, 30, 0.5)",
              },
              {
                offset: 1,
                color: "rgba(233, 179, 30, 0.1)",
              },
            ],
            false
          ),
        },
        data: VolumeData.value,
      },
    ],
  };
};

// 初始化图表
const initChart = () => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }

  const chartDom = document.getElementById(chartId.value);
  if (!chartDom) return;

  // 初始化 ECharts 实例
  chartInstance = echarts.init(chartDom);
  chartInstance.setOption(initChartOption());
};

// 生成交易时间数组（9:30-11:30，13:00-15:00，每分钟一个数据点）
const generateTradingTimeArray = () => {
  const result = [];

  // 上午时段：9:30 - 11:30
  const morningStart = new Date();
  morningStart.setHours(9, 30, 0, 0);

  const morningEnd = new Date();
  morningEnd.setHours(11, 30, 0, 0);

  // 下午时段：13:01 - 15:00
  const afternoonStart = new Date();
  afternoonStart.setHours(13, 1, 0, 0);

  const afternoonEnd = new Date();
  afternoonEnd.setHours(15, 0, 0, 0);

  // 添加上午时段
  let currentTime = new Date(morningStart);
  while (currentTime <= morningEnd) {
    result.push(formatTime(currentTime));
    currentTime = new Date(currentTime.getTime() + 60000); // 增加1分钟
  }

  // 添加下午时段
  currentTime = new Date(afternoonStart);
  while (currentTime <= afternoonEnd) {
    result.push(formatTime(currentTime));
    currentTime = new Date(currentTime.getTime() + 60000); // 增加1分钟
  }

  return result;
};

// 格式化时间为 HH:MM 格式
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 更新买卖盘数据
const updateDcOrder = () => {
  VolumeData.value = props.dcOrder.map((item) => item.成交量);
  priceData.value = props.dcOrder.map((item) => item.收盘);
  initChart();
};

onMounted(() => {
  // 生成交易时间数组
  xData.value = generateTradingTimeArray();
  // 使用setTimeout确保DOM完全渲染，但减少延迟时间
  setTimeout(initChart, 100);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>
<style scoped lang="scss"></style>
