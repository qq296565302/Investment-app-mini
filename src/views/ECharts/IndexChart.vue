<template>
  <!-- 指数图表 -->
  <div class="chart-box">
    <div :id="chartId" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, getCurrentInstance } from 'vue';

const props = defineProps({
  // 指数数据
  indexData: {
    type: Object,
    default: () => ({})
  },
  // 是否为上涨状态
  isUp: {
    type: Boolean,
    default: true
  },
  // 历史数据
  historyData: {
    type: Array,
    default: () => []
  }
});

// 为每个图表生成唯一ID
const chartId = ref(`index-chart-${Math.random().toString(36).substring(2, 9)}`);
let chartInstance = null;
const { echarts } = getCurrentInstance()?.proxy;

// 定义基准价格，在多个函数中使用
const basePrice = 3360;

// 模拟数据 - 实际应用中应该从props.historyData获取
const generateMockData = () => {
  const baseVolume = 200000;
  const data = [];
  
  // 生成交易时间数组（9:30-11:30，13:00-15:00）
  const times = generateTradingTimeArray();
  
  // 生成价格和成交量数据
  let price = basePrice;
  let prevPrice = basePrice; // 用于计算涨跌幅
  const initialPrice = basePrice; // 初始价格，用于计算涨跌幅
  
  for (let i = 0; i < times.length; i++) {
    // 生成一个随机波动
    const priceChange = (Math.random() - 0.5) * 5;
    price = price + priceChange;
    
    // 计算涨跌幅（相对于初始价格的百分比）
    const changePercent = ((price - initialPrice) / initialPrice) * 100;
    
    // 生成随机成交量，并决定是买入还是卖出
    const volume = Math.floor(baseVolume + Math.random() * baseVolume * 0.5);
    // 随机决定买入或卖出（正值为买入，负值为卖出）
    const direction = Math.random() > 0.5 ? 1 : -1;
    const signedVolume = volume * direction;
    
    data.push({
      time: times[i],
      price: price,
      volume: signedVolume, // 带符号的成交量，正负表示买卖方向
      changePercent: parseFloat(changePercent.toFixed(2))
    });
    
    prevPrice = price;
  }
  
  return data;
};

// 生成交易时间数组（9:30-11:30，13:00-15:00，每分钟一个数据点）
const generateTradingTimeArray = () => {
  const times = [];
  
  // 上午场：9:30 - 11:30
  for (let hour = 9; hour <= 11; hour++) {
    const startMinute = hour === 9 ? 30 : 0;
    const endMinute = hour === 11 ? 30 : 59;
    
    for (let minute = startMinute; minute <= endMinute; minute++) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  // 下午场：13:00 - 15:00
  for (let hour = 13; hour <= 15; hour++) {
    const endMinute = hour === 15 ? 0 : 59; // 15:00只取整点
    
    for (let minute = 0; minute <= endMinute; minute++) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  return times;
};

// 初始化图表配置
const initChartOption = (data) => {
  // 提取数据
  const times = data.map(item => item.time);
  const prices = data.map(item => item.price);
  const volumes = data.map(item => item.volume);
  const changePercents = data.map(item => item.changePercent);
  
  // 计算涨跌幅的最大绝对值，用于对称设置Y轴
  const absMaxPercent = Math.max(
    Math.abs(Math.max(...changePercents)),
    Math.abs(Math.min(...changePercents))
  );
  
  // 对称设置涨跌幅范围，确保0%在中间
  const maxPercent = absMaxPercent * 1.1;
  const minPercent = -maxPercent;
  
  // 根据涨跌幅范围计算对应的价格范围
  const initialPrice = props.indexData && props.indexData.昨收 ? props.indexData.昨收 : basePrice;
  
  // 计算实际最大最小价格，确保所有数据点都在范围内
  const actualMaxPrice = Math.max(...prices);
  const actualMinPrice = Math.min(...prices);
  
  // 计算价格范围，确保数据点不会超出范围
  const priceRange = Math.max(
    actualMaxPrice - initialPrice,
    initialPrice - actualMinPrice,
    initialPrice * (absMaxPercent / 100)
  ) * 1.2; // 增加额外的空间
  
  const maxPrice = initialPrice + priceRange;
  const minPrice = initialPrice - priceRange;
  
  // 确定主线颜色（根据涨跌状态）
  const mainColor = props.isUp ? '#00cc52' : '#e91e63';
  const areaColor = props.isUp ? 
    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(0, 204, 82, 0.3)' },
      { offset: 1, color: 'rgba(0, 204, 82, 0.05)' }
    ]) :
    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: 'rgba(233, 30, 99, 0.3)' },
      { offset: 1, color: 'rgba(233, 30, 99, 0.05)' }
    ]);
  
  return {
    animation: false,
    legend: {
      show: false
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#999',
          width: 1,
          type: 'dashed'
        }
      },
      formatter: function(params) {
        const time = params[0].axisValue;
        const price = params[0].value.toFixed(2);
        const volume = params[1] ? params[1].value : 0;
        
        return `<div style="font-size:12px;">
          <div>${time}</div>
          <div>价格: ${price}</div>
          <div>成交量: ${volume.toLocaleString()}</div>
        </div>`;
      }
    },
    grid: [
      {
        left: '3%',
        right: '3%',
        top: '15%',
        bottom: '10%',
        containLabel: true
      }
    ],
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: {
          color: '#666',
          fontSize: 10,
          interval: function(index, value) {
            // 只显示开盘和收盘时间，以及中午休市时间点（只显示一个）
            if (value === '11:30') {
              return true; // 只显示11:30
            } else if (value === '13:00') {
              return false; // 不显示13:00
            } else {
              return value === '09:30' || value === '15:00';
            }
          },
          formatter: function(value) {
            if (value === '11:30') {
              return '11:30/13:00';
            }
            return value;
          }
        },
        splitLine: { show: false },
        data: times
      }
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        position: 'left',
        min: minPrice,
        max: maxPrice,
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(0,0,0,0.05)',
            type: 'dashed'
          }
        },
        axisLine: { show: true, lineStyle: { color: '#ccc' } },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          inside: false,
          showMinLabel: true,
          showMaxLabel: true,
          color: function(value) {
            // 基准线以上显示红色，以下显示绿色
            return value > initialPrice ? '#e91e63' : '#00cc52';
          },
          fontSize: 10,
          margin: 8,
          formatter: function(value) {
            return value.toFixed(2);
          }
        }
      },
      {
        type: 'value',
        position: 'right',
        min: minPercent,
        max: maxPercent,
        splitLine: { show: false },
        axisLine: { show: true, lineStyle: { color: '#ccc' } },
        axisTick: { show: false },
        axisLabel: {
          inside: false,
          showMinLabel: true,
          showMaxLabel: true,
          margin: 8,
          color: function(value) {
            // 基准线以上显示红色，以下显示绿色
            return value > 0 ? '#e91e63' : '#00cc52';
          },
          fontSize: 10,
          formatter: function(value) {
            return value.toFixed(2) + '%';
          }
        }
      }
    ],
    series: [
      {
        name: '价格',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: mainColor
        },
        lineStyle: {
          width: 2,
          color: mainColor
        },
        areaStyle: {
          color: areaColor
        },
        data: prices
      },
      {
        name: '涨跌幅',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#ffab00'
        },
        lineStyle: {
          width: 1.5,
          color: '#ffab00',
          type: 'dashed'
        },
        data: changePercents
      },

      {
        name: '基准线',
        type: 'line',
        showSymbol: false,
        data: [],
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: {
            color: '#999',
            type: 'dashed',
            width: 1
          },
          data: [
            {
              yAxis: initialPrice,
              label: {
                show: true,
                position: 'insideEndTop',
                formatter: '基准价',
                fontSize: 10,
                color: '#999'
              }
            },
            [
              {
                yAxis: 0,
                xAxis: times[0],
                yAxisIndex: 1
              },
              {
                yAxis: 0,
                xAxis: times[times.length - 1],
                yAxisIndex: 1,
                label: {
                  show: true,
                  position: 'inside',
                  formatter: '0%',
                  fontSize: 10,
                  color: '#999'
                }
              }
            ]
          ]
        }
      }
    ]
  };
};

// 初始化图表
const initChart = () => {
  // 获取DOM元素
  const chartDom = document.getElementById(chartId.value);
  if (!chartDom) return;
  
  // 销毁旧实例
  if (chartInstance) {
    chartInstance.dispose();
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartDom);
  
  // 生成模拟数据（实际应用中使用props.historyData）
  const mockData = generateMockData();
  
  // 设置图表选项
  const option = initChartOption(mockData);
  chartInstance.setOption(option);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    chartInstance && chartInstance.resize();
  });
};

// 监听数据变化
watch(
  () => props.historyData,
  (newVal) => {
    if (newVal && newVal.length > 0 && chartInstance) {
      // 实际应用中，这里应该处理真实数据
      // const option = initChartOption(newVal);
      // chartInstance.setOption(option);
    }
  }
);

// 监听涨跌状态变化
watch(
  () => props.isUp,
  () => {
    if (chartInstance) {
      initChart();
    }
  }
);

onMounted(() => {
  // 使用setTimeout确保DOM完全渲染
  setTimeout(() => {
    initChart();
  }, 300);
});
</script>

<style scoped>
.chart-box {
  width: 100%;
  height: 100%;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>