<template>
    <div class="Layout-Header">
        <div class="active-background" :style="activeBgStyle"></div>
        <p class="PingFang" :class="{ active: currentIndex === index }" v-for="(header, index) in headers" :key="index" @click="handleHeaderClick(index)">{{ header.title }}</p>
    </div>
</template>

<script setup>
const router = useRouter();
const { Service, Storage, Request, Utils, CRUD } = getCurrentInstance()?.proxy;

// 当前选中的索引
const currentIndex = ref(0);

// 背景动画样式
const activeBgStyle = ref({
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease-in-out'
});

// 初始化时根据当前路由设置选中索引
onMounted(() => {
    const currentPath = router.currentRoute.value.path;
    const index = headers.findIndex(item => item.path === currentPath);
    if (index !== -1) {
        currentIndex.value = index;
        updateActiveBgPosition(index, false); // 不使用动画初始化位置
    }
});

// 更新背景位置
const updateActiveBgPosition = (index, useTransition = true) => {
    const position = index * 100; // 每个菜单项宽度为100px
    activeBgStyle.value = {
        transform: `translateX(${position}px)`,
        transition: useTransition ? 'transform 0.3s ease-in-out' : 'none'
    };
};

const headers = [{
    title: '行情',
    path: '/real-time-market'
}, {
    title: '期货',
    path: '/futures'
}, {
    title: '美股',
    path: '/us'
}, {
    title: '亚太市场',
    path: '/ap'
}, {
    title: '欧洲市场',
    path: '/eu'
}];
const handleHeaderClick = (index) => {
    // 更新当前选中索引
    currentIndex.value = index;
    
    // 更新背景位置（带动画）
    updateActiveBgPosition(index);
    
    // 路由跳转
    // router.push(headers[index].path);
};
onBeforeMount(() => { });
onMounted(async() => {
});
defineExpose({});
</script>
<style scoped lang="scss">
.Layout-Header {
    height: var(--layout-header-height);
    background-color: var(--primary-color);
    transition: height 0.5s ease;
    display: grid;
    grid-template-columns: repeat(5, 100px);
    position: relative;
    
    .active-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100px;
        height: 100%;
        background-color: #0062ff;
        z-index: 1;
        border-radius: 0;
    }
    
    p {
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 14px;
        color: #fff;
        letter-spacing: 2px;
        &.active {
            color: #fff;
            position: relative;
            z-index: 2;
        }
    }
}
</style>
