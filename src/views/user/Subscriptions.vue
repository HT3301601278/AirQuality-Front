<template>
  <div class="subscriptions-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订阅管理</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示用户订阅管理功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Subscriptions',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.subscriptions-container {
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