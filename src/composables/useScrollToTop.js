
import { ref } from 'vue';

/**
 * 滚动到顶部的组合式函数
 * @param {Function} refreshCallback - 刷新数据的回调函数
 * @param {Object} options - 配置选项
 * @param {Number} options.threshold - 显示回到顶部按钮的滚动阈值，默认为 200
 * @returns {Object} - 包含容器引用、是否显示回到顶部按钮的状态、滚动处理函数和回到顶部处理函数
 */
export default function useScrollToTop(refreshCallback, options = {}) {
  const { threshold = 200 } = options;
  const container = ref(null);
  const showBackToTop = ref(false);
  
  // 处理滚动事件
  const handleScroll = () => {
    if (container.value) {
      const scrollTop = container.value.scrollTop; // 获取滚动距离
      showBackToTop.value = scrollTop > threshold;
    }
  };
  
  // 处理回到顶部
  const handleBackToTop = async () => {
    if (container.value) {
      container.value.scrollTop = 0; // 设置滚动距离为 0
      if (refreshCallback && typeof refreshCallback === 'function') {
        await refreshCallback();
      }
    }
  };
  
  return {
    container,
    showBackToTop,
    handleScroll,
    handleBackToTop
  };
}
