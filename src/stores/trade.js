export const useTradeStore = defineStore('trade', {
  state: () => ({
    tradeStatus: 0,
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