import { ElMessage } from "element-plus";

// 定义常量
const SUCCESS_CODE = 200;
const DEFAULT_ERROR_MESSAGE = "请求失败，请重试...";

class CRUD {
  /**
   * 统一处理API请求的工具类
   * @class CRUD
   */
  constructor() {
    // 可以在这里初始化一些配置
    this.defaultConfig = {
      showErrorMessage: true,
      showSuccessMessage: false,
    };
  }

  /**
   * 解析错误信息
   * @param {Error} error - 错误对象
   * @returns {string} 格式化后的错误信息
   * @private
   */
  _parseErrorMessage(error) {
    try {
      const parsedError = JSON.parse(error.message);
      return parsedError?.msg || parsedError?.message || DEFAULT_ERROR_MESSAGE;
    } catch {
      return parsedError.message || DEFAULT_ERROR_MESSAGE;
    }
  }

  /**
   * 检查响应状态
   * @param {Object} result - API响应结果
   * @returns {boolean} 是否成功
   * @private
   */
  _checkResponseStatus(result) {
    return Number(result.code) === SUCCESS_CODE;
  }

  /**
   * 执行API请求并统一处理结果
   * @param {Function} callback - 异步请求回调
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 处理后的结果
   */
  async launch(callback, options = {}) {
    const config = { ...this.defaultConfig, ...options };
    try {
      // 执行请求
      let result;
      try {
        result = await callback();
        if (!this._checkResponseStatus(result)) {
          throw new Error(
            JSON.stringify({
              data: [],
              code: Number(result.code),
              success: false,
              message: result.msg,
            })
          );
        }
      } catch (error) {
        console.error("请求错误:", error);
        throw error;
      }

      // 处理成功响应
      if (config.showSuccessMessage) {
        const message = options.successMessage || result.msg || "操作成功";
        ElMessage.success(message);
      }

      return {
        data: result.data || [],
        code: Number(result.code),
        success: true,
        message: result.msg,
      };
    } catch (error) {
      // 处理错误
      const errorMessage = this._parseErrorMessage(error);
      if (config.showErrorMessage) {
        ElMessage.error("请求失败，错误信息：" + errorMessage);
      }

      return {
        data: [],
        code: error.code || 500,
        success: false,
        message: errorMessage,
      };
    }
  }
}

export default new CRUD();
