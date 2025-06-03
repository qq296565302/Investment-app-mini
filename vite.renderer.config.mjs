import { createBaseConfig } from './vite.common.js';

// Electron渲染进程的Vite配置
export default ({ mode }) => {
  return createBaseConfig({
    mode,
    customConfig: {
      // 这里可以添加特定于Electron渲染进程的配置
    }
  });
};
