<template>
  <div class="compare-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>城市数据对比</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示城市空气质量数据对比功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Compare',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.compare-container {
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