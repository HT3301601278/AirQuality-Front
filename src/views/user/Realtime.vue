<template>
  <div class="realtime-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时空气质量</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示实时空气质量数据</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Realtime',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.realtime-container {
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