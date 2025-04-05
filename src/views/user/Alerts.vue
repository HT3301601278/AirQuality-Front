<template>
  <div class="alerts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>警报查看</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示用户警报查看功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Alerts',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.alerts-container {
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