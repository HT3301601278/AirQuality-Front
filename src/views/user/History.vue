<template>
  <div class="history-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>历史数据查询</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示空气质量历史数据查询功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'History',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}
</style> 