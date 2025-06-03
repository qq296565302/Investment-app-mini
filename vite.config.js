import { createBaseConfig } from './vite.common.js';

// https://vitejs.dev/config
export default ({ mode }) => {
  return createBaseConfig({
    mode,
    customConfig: {
      // 这里可以添加特定于独立Vue开发的配置
    }
  });
};
