
// 创建一个简单的事件总线
class EventBus {
    constructor() {
        this.events = {};
    }

    // 订阅事件
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    // 取消订阅
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        if (!callback) {
            delete this.events[eventName];
            return;
        }
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    // 触发事件
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(callback => {
            callback(data);
        });
    }
}

// 创建单例实例
const eventBus = new EventBus();

export default eventBus;
