<template>
  <div class="locations-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>位置管理</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示位置管理功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Locations',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.locations-container {
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