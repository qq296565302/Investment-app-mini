// 导入 axios 库用于发送 HTTP 请求
import axios from "axios";

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3, // 最大重试次数
  retryDelay: 1000, // 重试间隔（毫秒）
  retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ECONNABORTED"], // 可重试的错误类型
};

/**
 * HttpService 类，用于封装 HTTP 请求操作，并提供统一的配置和拦截器。
 */
class HttpService {
  // 静态属性，用于存储不同 baseURL 的实例
  static instances = {};
  // 静态属性，用于存储默认的配置项
  static configurationItems = {
    // 请求超时时间，单位毫秒
    timeout: 10000,
    // 存储 token 的键名
    tokenKey: "access_token",
    // 启用响应拦截器
    enableResponseInterception: true,
  };

  /**
   * 构造函数，初始化 HttpService 实例。
   * @param {string} defaultBaseURL - 默认的基础 URL。
   * @param {Object} configuration - 自定义配置项。
   */
  constructor(defaultBaseURL, configuration = {}) {
    // 如果已经存在该 baseURL 的实例，则直接返回
    if (HttpService.instances[defaultBaseURL]) {
      return HttpService.instances[defaultBaseURL];
    }

    // 合并默认配置和自定义配置
    this.configuration = Object.assign(
      HttpService.configurationItems,
      configuration
    );

    // 创建 axios 实例，并设置基础 URL 和超时时间
    this.axiosInstance = axios.create({
      baseURL: defaultBaseURL,
      timeout: this.configuration.timeout,
    });

    // 添加请求拦截器，用于在发送请求前添加 token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        // 如果请求发生错误，直接返回 Promise 错误
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器，用于统一处理响应数据
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.configuration.enableResponseInterception) {
          return this.respondToInterception(response);
        }
        return response.data;
      },
      (error) => {
        // 检查是否是网络错误
        if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
          // 保留原始错误信息，以便重试机制可以识别
          return Promise.reject(error);
        }

        let errorMessage = error.statusText || "Unknown Error 未知错误";
        if (Number(error.status) === 404) {
          errorMessage = "Not Found 接口不存在";
        } else if (Number(error.status) === 500) {
          errorMessage = "Internal Server Error 服务器内部错误";
        }
        const errorData = {
          message: errorMessage,
          code: Number(error.status),
        };
        return Promise.reject(new Error(JSON.stringify(errorData)));
      }
    );

    // 将当前实例存储到静态属性中，以便复用
    HttpService.instances[defaultBaseURL] = this;
    return this;
  }

  respondToInterception(response) {
    return response.data;
  }

  /**
   * 发送 GET 请求，支持自动重试机制。
   * @param {string} url - 请求的 URL。
   * @param {Object} params - 请求参数。
   * @returns {Promise} - 返回请求的 Promise。
   */
  async get(url, params = {}) {
    // 实现重试逻辑
    let retries = 0;
    while (true) {
      try {
        return await this.axiosInstance.get(url, { params });
      } catch (error) {
        // 检查是否是可重试的错误类型
        const errorMessage = error.message || "";
        const isRetryableError = RETRY_CONFIG.retryableErrors.some((errType) =>
          errorMessage.includes(errType)
        );

        // 如果达到最大重试次数或不是可重试的错误，则抛出错误
        if (retries >= RETRY_CONFIG.maxRetries || !isRetryableError) {
          throw error;
        }

        // 增加重试计数并等待
        retries++;
        console.log(`请求 ${url} 失败，正在进行第 ${retries} 次重试...`);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_CONFIG.retryDelay)
        );
      }
    }
  }

  /**
   * 发送 POST 请求。
   * @param {string} url - 请求的 URL。
   * @param {Object} data - 请求的数据。
   * @returns {Promise} - 返回请求的 Promise。
   */
  post(url, data = {}) {
    return this.axiosInstance.post(url, data);
  }

  /**
   * 发送 PUT 请求。
   * @param {string} url - 请求的 URL。
   * @param {Object} data - 请求的数据。
   * @returns {Promise} - 返回请求的 Promise。
   */
  put(url, data = {}) {
    return this.axiosInstance.put(url, data);
  }

  /**
   * 发送 DELETE 请求。
   * @param {string} url - 请求的 URL。
   * @param {Object} data - 请求的数据。
   * @returns {Promise} - 返回请求的 Promise。
   */
  delete(url, data = {}) {
    return this.axiosInstance.delete(url, data);
  }
}

/**
 * 创建并导出一个 HttpService 实例的函数。
 * 这个函数接受一个默认的基础 URL、一个请求白名单和一个配置对象作为参数。
 * 如果没有提供白名单或配置对象，则使用默认值。
 *
 * @param {string} defaultBaseURL - 默认的基础 URL，所有请求的基础路径。
 * @param {string[]} whitelist - 请求白名单，白名单内的请求不添加 token。
 * @param {Object} configuration - 自定义配置项。
 * @returns {HttpService} - 返回一个新的 HttpService 实例。
 */
export default (defaultBaseURL) => new HttpService(defaultBaseURL);
