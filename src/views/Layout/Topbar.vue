<template>
  <div class="Layout-Topbar _drag">
    <div class="service-time LCD">{{ serviceTime }}</div>
  </div>
</template>

<script setup>
// ====== 导入依赖 ======
import { useTradeStore } from "stores/trade"; // 状态管理 store
import dayjs from "dayjs"; // 日期处理库

// ====== 基础变量和API注册 ======
const tradeStore = useTradeStore(); // 获取交易状态 store
const RequestName = "Topbar"; // API 名称标识
const { Service, Storage, Request, Utils, CRUD } = getCurrentInstance()?.proxy; // 获取全局API等
// 注册接口，分别获取服务器时间和交易日历
Service.registerApi(RequestName, {
  fetch: {
    serviceTime: () => Request.get(`/finance/time`), // 获取服务器时间
    tradeCalendar: () => Request.get(`/finance/trade-calendar`), // 获取交易日历
  },
});

const serviceTime = ref(""); // 当前服务时间字符串
let timer = null; // 定时器句柄
let currentTimestamp = null; // 当前服务时间戳（毫秒）

// ====== 交易时间相关工具函数 ======
/**
 * 获取距离当前日期最近且不晚于当前日期的交易日
 * @param {number} currentTimestamp - 当前时间戳（毫秒）
 * @param {Ref<string[]>} tradeCalendar - 交易日历数组的引用
 * @returns {string|null} 最近交易日的日期字符串，格式为'YYYY-MM-DD'，如果没有找到则返回null
 */
function getNearestTradeDate(currentTimestamp, tradeCalendar) {
  const currentDateStr = dayjs(currentTimestamp).format("YYYY-MM-DD");
  // 筛选出不晚于当前日期的所有交易日
  const pastTradeDates = tradeCalendar.value.filter((date) =>
    dayjs(date).isSameOrBefore(currentDateStr)
  );

  if (pastTradeDates.length > 0) {
    // 按日期降序排序并取第一个（最接近当前日期的交易日）
    return pastTradeDates.sort((a, b) => dayjs(b).diff(dayjs(a)))[0];
  }
  return null;
}

/**
 * 判断当前时间是否在交易时段内
 * A股交易时段：上午9:30-11:30，下午13:00-15:00
 * @param {number} currentTimestamp - 当前时间戳（毫秒）
 * @returns {boolean} 是否在交易时段内
 */
function isInTradeTime(currentTimestamp) {
  const currentTime = dayjs(currentTimestamp);

  // 定义当日的交易时间段 - 使用clone()避免修改原始对象
  const morningStart = dayjs(currentTimestamp).hour(9).minute(30).second(0);
  const morningEnd = dayjs(currentTimestamp).hour(11).minute(30).second(0);
  const afternoonStart = dayjs(currentTimestamp).hour(13).minute(0).second(0);
  const afternoonEnd = dayjs(currentTimestamp).hour(15).minute(0).second(0);

  // 判断是否在上午或下午的交易时段内
  return (
    (currentTime.isAfter(morningStart) && currentTime.isBefore(morningEnd)) ||
    (currentTime.isAfter(afternoonStart) && currentTime.isBefore(afternoonEnd))
  );
}

/**
 * 获取最近一次交易时段的结束时间
 * @param {number} currentTimestamp - 当前时间戳（毫秒）
 * @returns {string|null} 最近一次交易结束时间，格式为'YYYY-MM-DD HH:mm:ss'，如果当前时间早于上午收盘时间则返回null
 */
function getLastTradeTime(currentTimestamp) {
  const currentDateStr = dayjs(currentTimestamp).format("YYYY-MM-DD");
  const morningEnd = dayjs(`${currentDateStr} 11:30:00`); // 上午收盘时间
  const afternoonEnd = dayjs(`${currentDateStr} 15:00:00`); // 下午收盘时间

  // 判断当前时间与收盘时间的关系
  if (dayjs(currentTimestamp).isAfter(afternoonEnd)) {
    // 如果当前时间晚于下午收盘时间，返回下午收盘时间
    return afternoonEnd.format("YYYY-MM-DD HH:mm:ss");
  } else if (dayjs(currentTimestamp).isAfter(morningEnd)) {
    // 如果当前时间晚于上午收盘时间但早于下午收盘时间，返回上午收盘时间
    return morningEnd.format("YYYY-MM-DD HH:mm:ss");
  }
  return null; // 当前时间早于任何收盘时间
}

// ====== 主业务逻辑：更新时间和交易状态 ======
/**
 * 更新服务时间和交易状态的主函数
 * 每秒执行一次，更新系统时间并根据当前时间判断交易状态
 *
 * 交易状态逻辑：
 * 1. 判断当前日期是否为交易日
 *    - 不是交易日：状态设为'0'（今日休市），并更新最近交易日信息
 *    - 是交易日：继续判断当前时间
 *
 * 2. 对于交易日，根据时间判断具体状态：
 *    - 早于9:30：状态设为'3'（未到开盘时间）
 *    - 在交易时段内(9:30-11:30或13:00-15:00)：状态设为'1'（正在交易中）
 *    - 其他时间：状态设为'2'（当日已收盘），并记录最近一次交易结束时间
 */
const updateServiceTime = () => {
  try {
    // 确保时间戳已初始化
    if (currentTimestamp === null) return;

    // 更新时间戳和显示时间（每秒+1000毫秒）
    currentTimestamp += 1000;
    serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");

    // 获取当前日期字符串，用于判断是否为交易日
    const currentDateStr = dayjs(currentTimestamp).format("YYYY-MM-DD");
    const currentTime = dayjs(currentTimestamp);

    // 步骤1：判断是否为交易日
    if (!tradeCalendar.value.includes(currentDateStr)) {
      // 非交易日处理逻辑
      const nearestTradeDate = getNearestTradeDate(
        currentTimestamp,
        tradeCalendar
      );
      if (nearestTradeDate) {
        tradeStore.updateNearestTradeDate(nearestTradeDate);
      }
      tradeStore.updateTradeStatus("0"); // 设置为休市状态
      return;
    }

    // 步骤2：交易日内的时间状态判断
    // 定义当日的交易时间段 - 使用clone()避免修改原始对象
    const morningStart = dayjs(currentTimestamp).hour(9).minute(30).second(0);
    const morningEnd = dayjs(currentTimestamp).hour(11).minute(30).second(0);
    const afternoonStart = dayjs(currentTimestamp).hour(13).minute(0).second(0);
    const afternoonEnd = dayjs(currentTimestamp).hour(15).minute(0).second(0);
       
    // 调整条件判断顺序 - 先判断中午休市时段
    if (currentTime.isBefore(morningStart)) {
      // 情况1：交易日但未到开盘时间
      tradeStore.updateTradeStatus("3");
    } else if (
      currentTime.isAfter(morningEnd) &&
      currentTime.isBefore(afternoonStart)
    ) {
      // 情况3：中午休市时段(11:30-13:00) - 将此条件提前
      tradeStore.updateTradeStatus("2");
      // 获取并更新最近一次交易结束时间
      tradeStore.updateLastTradeTime(morningEnd.format("YYYY-MM-DD HH:mm:ss"));
    } else if (
      isInTradeTime(currentTimestamp) ||
      currentTime.isSame(afternoonStart)
    ) {
      // 情况2：在交易时段内（包括13:00整点）
      tradeStore.updateTradeStatus("1");
    } else {
      // 情况4：交易日但不在交易时段（已收盘）
      tradeStore.updateTradeStatus("2");

      // 获取并更新最近一次交易结束时间
      const lastTradeTime = getLastTradeTime(currentTimestamp);
      if (lastTradeTime) {
        tradeStore.updateLastTradeTime(lastTradeTime);
      }
    }
  } catch (error) {
    console.error("更新服务时间出错:", error);
    // 确保即使出错也不会中断定时器
  }
};

// ====== 交易状态响应式变量及监听 ======
const tradeStatus = ref(""); // 当前交易状态名称
let lastTradeOpenTime = null; // 最近一次交易状态为1的时间（可扩展用）

// 监听交易状态变化，实时更新 tradeStatus
watch(
  () => tradeStore.tradeStatus,
  () => {
    tradeStatus.value = tradeStore.tradeStatusName;
  }
);

// ====== 交易日历获取 ======
const tradeCalendar = ref([]); // 交易日历数组
const getTradeCalendar = async () => {
  const result = await CRUD.launch(() => {
    return Service.fetch(RequestName, undefined, "tradeCalendar");
  });
  // 格式化为 'YYYY-MM-DD' 字符串数组
  tradeCalendar.value = result.data.map((item) => {
    return dayjs(item.trade_date).format("YYYY-MM-DD");
  });
};

// ====== 服务器时间同步函数 ======
/**
 * 从服务器同步最新时间
 * 如果服务器请求失败，则使用本地时间进行校准
 */
const syncTimeFromServer = async () => {
  try {
    const result = await CRUD.launch(() => {
      return Service.fetch(RequestName, undefined, "serviceTime");
    });
    // 更新时间戳
    currentTimestamp = dayjs(result.data).valueOf();
    serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
    // 立即更新一次交易状态
    updateServiceTime();
    return true;
  } catch (error) {
    console.error("同步服务器时间出错:", error);
    // 如果服务器同步失败，至少更新为本地系统时间
    currentTimestamp = Date.now();
    serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
    return false;
  }
};

// ====== 生命周期：初始化和清理 ======
// 使用RAF和定时器结合的方式，确保更稳定的时间更新
let lastTime = 0;
let rafId = null;
let isRunning = false;

// 使用requestAnimationFrame实现的更可靠的定时器
const animationLoop = (timestamp) => {
  if (!isRunning) return;
  
  if (!lastTime) lastTime = timestamp;
  
  const elapsed = timestamp - lastTime;
  
  if (elapsed >= 1000) { // 每秒执行一次
    lastTime = timestamp - (elapsed % 1000); // 确保时间准确性
    updateServiceTime();
  }
  
  rafId = requestAnimationFrame(animationLoop);
};

// 启动动画循环
const startAnimationLoop = () => {
  if (isRunning) return;
  
  isRunning = true;
  rafId = requestAnimationFrame(animationLoop);
};

// 停止动画循环
const stopAnimationLoop = () => {
  isRunning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTime = 0;
};

onMounted(async () => {
  try {
    // 获取服务器当前时间
    const result = await CRUD.launch(() => {
      return Service.fetch(RequestName, undefined, "serviceTime");
    });
    currentTimestamp = dayjs(result.data).valueOf();
    serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
    
    // 获取交易日历
    await getTradeCalendar();
    
    // 使用传统定时器作为备份方案
    timer = setInterval(() => {
      // 当RAF暂停时（如窗口最小化状态），这个定时器会负责更新时间
      if (!isRunning) {
        // 如果处于最小化状态超过30秒，尝试使用系统时间进行校准
        const now = Date.now();
        const timeDiff = now - (currentTimestamp + 1000); // 期望的下一时间点与实际时间的差值
        
        if (Math.abs(timeDiff) > 30000) { // 如果差异超过30秒，则校准
          console.log(`检测到时间差异较大(${timeDiff}ms)，进行校准`);
          currentTimestamp = now - 1000; // 设为当前时间少1秒，确保下次更新时为整点
        }
        
        updateServiceTime();
      }
    }, 1000);
    
    // 启动基于requestAnimationFrame的动画循环
    startAnimationLoop();
    
    // 立即执行一次更新
    updateServiceTime();
    
    // 添加窗口焦点变化事件监听
    const focusHandler = async () => {
      // 窗口重新获得焦点时，立即从服务器同步最新时间
      await syncTimeFromServer();
      // 启动动画循环
      startAnimationLoop();
    };
    
    window.focusHandler = focusHandler; // 存储引用以便于清理
    window.addEventListener('focus', focusHandler);
    window.addEventListener('blur', () => {
      // 窗口失去焦点时停止动画循环，但确保备份定时器继续工作
      stopAnimationLoop();
    });
    
    // 添加页面可见性变化事件监听
    const visibilityHandler = async () => {
      if (document.hidden) {
        // 页面不可见时，停止动画循环，但确保备份定时器继续工作
        stopAnimationLoop();
      } else {
        // 页面重新可见时，立即从服务器同步最新时间
        await syncTimeFromServer();
        // 启动动画循环
        startAnimationLoop();
      }
    };
    
    document.visibilityHandler = visibilityHandler; // 存储引用以便于清理
    document.addEventListener('visibilitychange', visibilityHandler);
    
  } catch (error) {
    console.error("组件初始化出错:", error);
  }
});

// 组件卸载时清理所有资源
onBeforeUnmount(() => {
  // 清理传统定时器
  if (timer) clearInterval(timer);
  
  // 停止动画循环
  stopAnimationLoop();
  // 移除事件监听器
  if (window.focusHandler) {
    window.removeEventListener('focus', window.focusHandler);
    window.focusHandler = null;
  }
  window.removeEventListener('blur', stopAnimationLoop);
  if (document.visibilityHandler) {
    document.removeEventListener('visibilitychange', document.visibilityHandler);
    document.visibilityHandler = null;
  }
});

defineExpose({
  // 可根据需要暴露方法
});
</script>

<style scoped lang="scss">
.Layout-Topbar {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0 10px;

  height: var(--client-topbar-height);
  background-color: var(--main-c-dark);

  .service-time {
    color: #fff;
    letter-spacing: 2px;
  }
}
</style>
