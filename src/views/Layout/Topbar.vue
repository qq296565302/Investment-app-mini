<template>
  <div class="Layout-Topbar _drag">
    <div class="service-time LCD">{{ serviceTime }}</div>
    <div class="window-controls">
      <div class="control-button minimize _no-drag" @click="minimizeWindow" title="最小化">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
    <div class="control-button close _no-drag" @click="closeWindow" title="关闭">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
    <div class="pin-button _no-drag" :class="{ 'active': isPinned }" @click="togglePinWindow" title="窗口置顶">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L12 22"></path>
        <path d="M18 8L12 2 6 8"></path>
      </svg>
    </div>
    </div>
  </div>
</template>

<script setup>
// ====== 导入依赖 ======
import { ref, onMounted } from "vue";
import { useTradeStore } from "stores/trade"; // 状态管理 store
import useTimeService from "@/composables/useTimeService"; // 导入时间服务模块

// ====== 基础变量和API注册 ======
const tradeStore = useTradeStore(); // 获取交易状态 store
const RequestName = "Topbar"; // API 名称标识
const { Service, Request, CRUD } = getCurrentInstance()?.proxy; // 获取全局API等
// 注册接口，分别获取服务器时间和交易日历
Service.registerApi(RequestName, {
  fetch: {
    serviceTime: () => Request.get(`/finance/time`), // 获取服务器时间
    tradeCalendar: () => Request.get(`/finance/trade-calendar`), // 获取交易日历
  },
});

// ====== 使用时间服务 ======
const {
  serviceTime,
  tradeCalendar,
  tradeStatus
} = useTimeService({
  service: Service,
  crud: CRUD,
  tradeStore,
  requestName: RequestName
});

// ====== 窗口控制功能 ======
const isPinned = ref(false); // 窗口是否置顶

/**
 * 切换窗口置顶状态
 * 通过Electron API与主进程通信，控制窗口的置顶状态
 */
const togglePinWindow = async () => {
  try {
    // 检查electronAPI是否可用
    if (window.electronAPI) {
      // 切换置顶状态
      const newStatus = await window.electronAPI.toggleAlwaysOnTop(!isPinned.value);
      isPinned.value = newStatus;
    } else {
      console.warn('electronAPI不可用，无法控制窗口置顶状态');
    }
  } catch (error) {
    console.error('切换窗口置顶状态出错:', error);
  }
};

/**
 * 最小化窗口
 * 通过Electron API与主进程通信，最小化应用窗口
 */
const minimizeWindow = async () => {
  try {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    } else {
      console.warn('electronAPI不可用，无法最小化窗口');
    }
  } catch (error) {
    console.error('最小化窗口出错:', error);
  }
};

/**
 * 关闭窗口
 * 通过Electron API与主进程通信，关闭应用窗口
 */
const closeWindow = async () => {
  try {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    } else {
      console.warn('electronAPI不可用，无法关闭窗口');
    }
  } catch (error) {
    console.error('关闭窗口出错:', error);
  }
};

onMounted(async () => {
  // 初始化窗口置顶状态
  if (window.electronAPI) {
    try {
      // 获取当前窗口的置顶状态
      isPinned.value = await window.electronAPI.getAlwaysOnTopStatus();
    } catch (error) {
      console.error('获取窗口置顶状态出错:', error);
    }
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
  justify-content: space-between; // 使服务时间和控制按钮分别靠左和靠右
  box-sizing: border-box;
  padding: 0 10px;

  height: var(--client-topbar-height);
  background-color: var(--main-c-dark);

  .service-time {
    color: #fff;
    letter-spacing: 2px;
  }

  // 窗口控制按钮组
  .window-controls {
    display: flex;
    align-items: center;
    gap: 8px; // 按钮之间的间距
  }

  // 通用控制按钮样式
  .control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: #aaa;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    svg {
      width: 16px;
      height: 16px;
    }

    // 最小化按钮特殊样式
    &.minimize:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    // 关闭按钮特殊样式
    &.close:hover {
      background-color: rgba(232, 17, 35, 0.7);
      color: #fff;
    }
  }

  // 置顶按钮样式
  .pin-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    color: #aaa;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    &.active {
      color: #4caf50; // 置顶状态激活时的颜色

      &:hover {
        background-color: rgba(76, 175, 80, 0.1);
      }
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
