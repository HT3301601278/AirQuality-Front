<template>
  <div class="notifications-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知管理</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示通知管理功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Notifications',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.notifications-container {
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