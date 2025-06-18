/**
 * 时间服务模块 - 提供时间同步和时间显示功能
 * 从Topbar.vue组件中抽取的时间相关功能
 */
import { ref, onMounted, onBeforeUnmount } from 'vue';
import dayjs from 'dayjs';

/**
 * 时间服务钩子函数
 * @param {Object} options - 配置选项
 * @param {Object} options.service - API服务对象
 * @param {Object} options.crud - CRUD操作对象
 * @param {string} options.requestName - API请求名称标识
 * @returns {Object} 时间服务相关的状态和方法
 */
export default function useTimeService({ service, crud, requestName }) {
  // ====== 基础变量 ======
  const serviceTime = ref(""); // 当前服务时间字符串
  
  let timer = null; // 定时器句柄
  let currentTimestamp = null; // 当前服务时间戳（毫秒）
  
  // 使用RAF和定时器结合的方式，确保更稳定的时间更新
  let lastTime = 0;
  let rafId = null;
  let isRunning = false;

  // ====== 主业务逻辑：更新时间显示 ======
  /**
   * 更新服务时间显示的主函数
   * 每秒执行一次，更新系统时间显示
   */
  const updateServiceTime = () => {
    try {
      // 确保时间戳已初始化
      if (currentTimestamp === null) return;

      // 更新时间戳和显示时间（每秒+1000毫秒）
      currentTimestamp += 1000;
      serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
    } catch (error) {
      console.error("更新服务时间出错:", error);
      // 确保即使出错也不会中断定时器
    }
  };

  // ====== 服务器时间同步函数 ======
  /**
   * 从服务器同步最新时间
   * 如果服务器请求失败，则使用本地时间进行校准
   */
  const syncTimeFromServer = async () => {
    try {
      const result = await crud.launch(() => {
        return service.fetch(requestName, undefined, "serviceTime");
      });
      // 更新时间戳
      currentTimestamp = dayjs(result.data).valueOf();
      serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
      return true;
    } catch (error) {
      console.error("同步服务器时间出错:", error);
      // 如果服务器同步失败，至少更新为本地系统时间
      currentTimestamp = Date.now();
      serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");
      return false;
    }
  };

  // ====== 动画循环相关函数 ======
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

  // ====== 生命周期钩子 ======
  onMounted(async () => {
    try {
      // 获取服务器当前时间
      const result = await crud.launch(() => {
        return service.fetch(requestName, undefined, "serviceTime");
      });
      currentTimestamp = dayjs(result.data).valueOf();
      serviceTime.value = dayjs(currentTimestamp).format("YYYY-MM-DD HH:mm:ss");

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
      console.error("时间服务初始化出错:", error);
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

  // 返回公开的状态和方法
  return {
    serviceTime,
    syncTimeFromServer,
    updateServiceTime
  };
}