export const useTradeStore = defineStore('trade', {
  state: () => ({
    tradeStatus: '0',
    tradeStatusMap: {
      '3': '未到开盘时间',
      '2': '当日已收盘',
      '1': '正在交易中',
      '0': '今日休市'
    },
    lastTradeTime: null,
    nearestTradeDate: null,
  }),
  actions: {
    updateTradeStatus(status) {
      this.tradeStatus = status;
    },
    updateLastTradeTime(time) {
      this.lastTradeTime = time;
    },
    updateNearestTradeDate(date) {
      this.nearestTradeDate = date;
    },
  },
  getters: {
    tradeStatusName: (state) => state.tradeStatusMap[state.tradeStatus],
  },
});