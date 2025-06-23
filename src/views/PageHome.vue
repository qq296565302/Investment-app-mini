<template>
    <div class="Page-Home">
        <Topbar />
        <router-view v-slot="{ Component }" class="layout-container">
            <keep-alive include="RealTimeMarket">
                <component :is="Component" />
            </keep-alive>
        </router-view>
        <Header />
    </div>
</template>

<script setup>
import Header from "./Layout/Header.vue";
import Topbar from "./Layout/Topbar.vue";

const { Service, Request, CRUD, Storage, $message } = getCurrentInstance()?.proxy;

// 新版 WebScoket
import WebSocketService from '@zhaoshijun/ws-service';
// 获取单例实例
const ws = WebSocketService.getInstance();

// 连接到WebSocket服务器
ws.connect(import.meta.env.VITE_WS_URL)
    .then(() => {
        console.log(' WebSocketService 连接成功');
        ws.sendTypedMessage('getStatus', {
            type: 'tradeStatus'
        });
    })
    .catch(error => {
        console.error(' WebSocketService 连接失败:', error);
    });

// 组件卸载前关闭WebSocket连接
onBeforeUnmount(() => {
    // 断开连接
    ws.disconnect();
});
defineExpose({});
</script>
<style scoped lang="scss">
.Page-Home {
    box-sizing: border-box;
    height: 100%;
    overflow: hidden;
    position: relative;
    width: 100%;

    .layout-container {
        height: calc(100% - var(--client-topbar-height) - var(--layout-header-height) - 1px);
        width: 100%;
    }
}
</style>
