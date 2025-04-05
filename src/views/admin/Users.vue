<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>
      <div class="content">
        <p>此模块将显示用户管理功能</p>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Users',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.users-container {
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