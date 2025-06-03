<template>
    <div class="shanghai">
        <el-auto-resizer>
            <template #default="{ height, width }">
                <el-table-v2 :columns="tableColumns" :data="tableData" :width="width" :height="height" fixed />
            </template>
        </el-auto-resizer>
    </div>
</template>
<script setup>
const tableColumns = [
    { field: 'name', label: '名称', title: '名称', width: 'auto' },
    { field: 'code', label: '代码', title: '代码', width: 100 },
    { field: 'price', label: '价格', title: '价格', width: 100 },
    { field: 'change', label: '涨跌', title: '涨跌', width: 100 },
    { field: 'volume', label: '成交量', title: '成交量', width: 100 },
    // { field: 'amount', label: '成交额', title: '成交额' },
    { field: 'high', label: '最高', title: '最高' },
    { field: 'low', label: '最低', title: '最低' },
    { field: 'open', label: '今开', title: '今开' },
    { field: 'close', label: '昨收', title: '昨收' },
    // { field: 'preClose', label: '前收盘', title: '前收盘' },
    { field: 'amplitude', label: '振幅', title: '振幅' },
    { field: 'turnoverRate', label: '换手率', title: '换手率' },
    { field: 'pe', label: '市盈率', title: '市盈率' },
    // { field: 'pb', label: '市净率', title: '市净率' },
    // { field: 'total', label: '总市值', title: '总市值' },
    // { field: 'circ', label: '流通市值', title: '流通市值' },
    // { field: 'date', label: '日期', title: '日期' },
    // { field: 'time', label: '时间', title: '时间' },
];
const tableData = ref([]);
</script>
<style scoped lang="scss">
.shanghai {
    width: 100%;
    height: 100%;
}
</style>
