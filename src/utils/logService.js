const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { format } = require('date-fns');

/**
 * 日志服务 - 负责将应用日志保存到本地文件
 */
class LogService {
  constructor(options = {}) {
    // 单例模式
    if (LogService.instance) {
      return LogService.instance;
    }
    LogService.instance = this;

    // 配置选项
    this.options = {
      // 默认日志目录为 D:/electron
      logDir: options.logDir || 'D:/electron',
      // 其他配置项可以在这里添加
    };

    // 初始化日志目录和文件
    this.initialize();
  }

  /**
   * 初始化日志服务
   */
  initialize() {
    // 确定日志存储目录 (使用配置的目录或默认目录)
    this.logDir = this.options.logDir;
    
    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
        console.log(`Created log directory: ${this.logDir}`);
      } catch (error) {
        console.error(`Failed to create log directory: ${this.logDir}`, error);
        // 如果创建失败，回退到应用数据目录
        this.logDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
        console.log(`Using fallback log directory: ${this.logDir}`);
      }
    }
    
    // 创建当天的日志文件
    this.currentDate = format(new Date(), 'yyyy-MM-dd');
    this.logFile = path.join(this.logDir, `${this.currentDate}.log`);
    
    console.log(`Log file initialized: ${this.logFile}`);
  }

  /**
   * 写入日志到文件
   * @param {string} level - 日志级别 (info, warn, error)
   * @param {string} source - 日志来源
   * @param {string} message - 日志消息
   * @param {object} data - 额外数据
   */
  writeLog(level, source, message, data = null) {
    try {
      // 检查是否需要创建新的日志文件（日期变更）
      const today = format(new Date(), 'yyyy-MM-dd');
      if (today !== this.currentDate) {
        this.currentDate = today;
        this.logFile = path.join(this.logDir, `${this.currentDate}.log`);
      }

      // 格式化日志条目
      const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
      let logEntry = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;
      
      // 如果有额外数据，添加到日志中
      if (data) {
        let dataStr;
        try {
          dataStr = JSON.stringify(data);
        } catch (e) {
          dataStr = String(data);
        }
        logEntry += ` | ${dataStr}`;
      }
      
      logEntry += '\n';
      
      // 写入日志文件
      fs.appendFileSync(this.logFile, logEntry, 'utf8');
      
      return true;
    } catch (error) {
      console.error('写入日志文件失败:', error);
      return false;
    }
  }

  /**
   * 记录信息日志
   * @param {string} source - 日志来源
   * @param {string} message - 日志消息
   * @param {object} data - 额外数据
   */
  info(source, message, data = null) {
    return this.writeLog('info', source, message, data);
  }

  /**
   * 记录警告日志
   * @param {string} source - 日志来源
   * @param {string} message - 日志消息
   * @param {object} data - 额外数据
   */
  warn(source, message, data = null) {
    return this.writeLog('warn', source, message, data);
  }

  /**
   * 记录错误日志
   * @param {string} source - 日志来源
   * @param {string} message - 日志消息
   * @param {object} data - 额外数据
   */
  error(source, message, data = null) {
    return this.writeLog('error', source, message, data);
  }

  /**
   * 获取所有日志文件列表
   * @returns {Array} 日志文件列表
   */
  getLogFiles() {
    try {
      return fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => path.join(this.logDir, file));
    } catch (error) {
      console.error('获取日志文件列表失败:', error);
      return [];
    }
  }

  /**
   * 读取指定日志文件内容
   * @param {string} logFile - 日志文件路径
   * @returns {string} 日志文件内容
   */
  readLogFile(logFile) {
    try {
      return fs.readFileSync(logFile, 'utf8');
    } catch (error) {
      console.error('读取日志文件失败:', error);
      return '';
    }
  }

  /**
   * 清理过期日志文件
   * @param {number} daysToKeep - 保留的天数
   */
  cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = new Date();
      
      files.forEach(file => {
        if (!file.endsWith('.log')) return;
        
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime);
        
        // 计算文件日期与当前日期的差值（天）
        const daysDiff = Math.floor((now - fileDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > daysToKeep) {
          fs.unlinkSync(filePath);
          console.log(`已删除过期日志文件: ${file}`);
        }
      });
    } catch (error) {
      console.error('清理过期日志文件失败:', error);
    }
  }
}

// 创建日志服务实例
const createLogService = (options = {}) => {
  return new LogService(options);
};

module.exports = { createLogService };
