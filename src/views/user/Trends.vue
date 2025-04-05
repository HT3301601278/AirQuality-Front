<template>
  <div class="trends-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>近期趋势分析</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示空气质量近期趋势分析图表</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Trends',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.trends-container {
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