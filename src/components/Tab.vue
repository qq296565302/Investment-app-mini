<template>
    <div class="menu">
        <a v-for="(option, index) in options" :key="index" href="#" class="link"
            :class="{ active: modelValue === option.value }" @click.prevent="onChange(option.value)">
            <span class="link-icon">
                <cmpsvg v-if="option.icon" :use="svgIcon[option.icon]" />
                <!-- 默认图标，如果没有提供icon -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor"
                    viewBox="0 0 256 256">
                    <rect width="256" height="256" fill="none"></rect>
                    <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-linecap="round"
                        stroke-linejoin="round" stroke-width="16"></circle>
                </svg>
            </span>
            <span class="link-title">{{ option.label }}</span>
        </a>
    </div>
</template>

<script setup>
const { svgIcon } = getCurrentInstance().proxy;
/**
 * Tab组件 - 可配置的标签页导航组件
 * 支持动态配置选项和change事件
 */

const props = defineProps({
    // 选项数组，包含 value、label 和可选的 icon
    options: {
        type: Array,
        required: true,
        default: () => [],
        validator: (value) => {
            return value.every(option =>
                option.hasOwnProperty('value') &&
                option.hasOwnProperty('label')
            );
        }
    },
    // v-model 绑定值
    modelValue: {
        type: [String, Number],
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

/**
 * 处理选项变更
 * @param {string|number} value - 选中的值
 */
const onChange = (value) => {
    emit('update:modelValue', value);
    emit('change', value);
};
</script>

<style scoped>
/* From Uiverse.io by Admin12121 */
.menu {
    padding: 10px;
    background-color: #fff;
    position: relative;
    display: flex;
    justify-content: center;
    border-radius: 15px;
    box-shadow: 0 10px 25px 0 rgba(0, 0, 0, 0.075);
}

.link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 40px;
    border-radius: 8px;
    position: relative;
    z-index: 1;
    overflow: hidden;
    transform-origin: center left;
    transition: width 0.2s ease-in;
    text-decoration: none;
    color: inherit;
    cursor: pointer;

    &:before {
        position: absolute;
        z-index: -1;
        content: "";
        display: block;
        border-radius: 8px;
        width: 100%;
        height: 100%;
        top: 0;
        transform: translateX(100%);
        transition: transform 0.2s ease-in;
        transform-origin: center right;
        background-color: #eee;
    }

    &:hover,
    &:focus,
    &.active {
        outline: 0;
        width: 130px;

        &:before,
        .link-title {
            transform: translateX(0);
            opacity: 1;
        }
    }

    &.active {
        &:before {
            background-color: rgba(209, 99, 172, 0.493);
        }

        color: #003a92;
    }
}

.link-icon {
    width: 22px;
    height: 22px;
    display: block;
    flex-shrink: 0;
    left: 18px;
    position: absolute;

    svg {
        width: 28px;
        height: 28px;
    }
}

.link-title {
    transform: translateX(100%);
    transition: transform 0.2s ease-in;
    transform-origin: center right;
    display: block;
    text-align: center;
    text-indent: 32px;
    width: 100%;
    opacity: 0;
    transition: transform 0.2s ease-in, opacity 0.2s ease-in;
}

.link:hover .link-title,
.link:focus .link-title,
.link.active .link-title {
    opacity: 1;
}
</style>