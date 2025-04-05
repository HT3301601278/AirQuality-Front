<template>
  <div class="map-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>空气质量地图</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示空气质量地图可视化功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Map',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.map-container {
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