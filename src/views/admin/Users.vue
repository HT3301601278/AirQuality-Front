<template>
  <div class="users-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="dashboard-stats" v-if="dashboard">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboard.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon"><el-icon><Bell /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboard.subscriptionCount }}</div>
            <div class="stat-label">订阅总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户管理主卡片 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/邮箱"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="fetchUsers">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="filteredUsers"
        stripe
        border
        style="width: 100%"
        class="user-table"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" width="150" sortable />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="用户类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.userType === 1 ? 'danger' : 'info'">
              {{ scope.row.userType === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
              :disabled="scope.row.userType === 1"
            />
            <span class="status-text">{{ scope.row.status === 1 ? '启用' : '禁用' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="180" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="showUserSubscriptions(scope.row)"
              plain
            >
              查看订阅
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalUsers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 订阅查看对话框 -->
    <el-dialog
      v-model="subscriptionDialogVisible"
      title="用户订阅"
      width="80%"
      destroy-on-close
    >
      <div class="dialog-header" v-if="currentUser">
        <span class="user-info">用户: {{ currentUser.username }} ({{ currentUser.email }})</span>
      </div>
      <el-table
        v-loading="subscriptionLoading"
        :data="userSubscriptions"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="订阅ID" width="80" />
        <el-table-column label="位置信息" width="200">
          <template #default="scope">
            <div class="location-info">
              <div>{{ scope.row.location.province }} {{ scope.row.location.city }}</div>
              <div class="location-coords">
                经度: {{ scope.row.location.longitude }}
                纬度: {{ scope.row.location.latitude }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="监控指标" width="180">
          <template #default="scope">
            <el-tag :type="getThresholdTypeTag(scope.row.thresholdType)">
              {{ getThresholdTypeName(scope.row.thresholdType) }}
              {{ scope.row.thresholdValue }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-popconfirm
              title="确定删除此订阅吗?"
              @confirm="handleDeleteSubscription(scope.row)"
            >
              <template #reference>
                <el-button size="small" type="danger" plain>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'Users',
  setup() {
    // 状态定义
    const loading = ref(false)
    const users = ref([])
    const dashboard = ref(null)
    const searchKeyword = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalUsers = ref(0)
    const subscriptionDialogVisible = ref(false)
    const subscriptionLoading = ref(false)
    const userSubscriptions = ref([])
    const currentUser = ref(null)

    // 计算属性 - 筛选后的用户列表
    const filteredUsers = computed(() => {
      if (!searchKeyword.value) {
        const start = (currentPage.value - 1) * pageSize.value
        const end = start + pageSize.value
        return users.value.slice(start, end)
      }
      
      const filtered = users.value.filter(user => {
        const keyword = searchKeyword.value.toLowerCase()
        return user.username.toLowerCase().includes(keyword) || 
               (user.email && user.email.toLowerCase().includes(keyword))
      })
      
      totalUsers.value = filtered.length
      return filtered.slice(
        (currentPage.value - 1) * pageSize.value,
        currentPage.value * pageSize.value
      )
    })

    // 获取仪表盘数据
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/admin/dashboard')
        if (response.data.code === 200) {
          dashboard.value = response.data.data
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error)
        ElMessage.error('获取仪表盘数据失败')
      }
    }

    // 获取所有用户数据
    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/admin/users')
        if (response.data.code === 200) {
          users.value = response.data.data
          totalUsers.value = users.value.length
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败')
      } finally {
        loading.value = false
      }
    }

    // 改变用户状态
    const handleStatusChange = async (user) => {
      try {
        const response = await axios.put(`/api/admin/users/${user.id}/status?status=${user.status}`)
        if (response.data.code === 200) {
          ElMessage.success(`用户 ${user.username} 状态已更新`)
        }
      } catch (error) {
        console.error('更新用户状态失败:', error)
        ElMessage.error('更新用户状态失败')
        // 恢复原状态
        user.status = user.status === 1 ? 0 : 1
      }
    }

    // 查看用户订阅
    const showUserSubscriptions = async (user) => {
      subscriptionDialogVisible.value = true
      currentUser.value = user
      subscriptionLoading.value = true
      
      try {
        const response = await axios.get('/api/admin/subscriptions')
        if (response.data.code === 200) {
          // 筛选出当前用户的订阅
          userSubscriptions.value = response.data.data.filter(
            sub => sub.userId === user.id
          )
        }
      } catch (error) {
        console.error('获取订阅列表失败:', error)
        ElMessage.error('获取订阅列表失败')
      } finally {
        subscriptionLoading.value = false
      }
    }

    // 删除用户订阅
    const handleDeleteSubscription = async (subscription) => {
      try {
        const response = await axios.delete(
          `/api/admin/users/${currentUser.value.id}/subscriptions/${subscription.id}`
        )
        
        if (response.data.code === 200) {
          ElMessage.success('订阅删除成功')
          // 从列表中移除已删除的订阅
          userSubscriptions.value = userSubscriptions.value.filter(
            sub => sub.id !== subscription.id
          )
        }
      } catch (error) {
        console.error('删除订阅失败:', error)
        ElMessage.error('删除订阅失败')
      }
    }

    // 分页相关方法
    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page
    }

    // 搜索方法
    const handleSearch = () => {
      currentPage.value = 1
    }

    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return '未知'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 获取阈值类型名称
    const getThresholdTypeName = (type) => {
      const types = {
        1: 'AQI >',
        2: 'PM2.5 >',
        3: 'PM10 >',
        4: 'CO >',
        5: 'NO2 >',
        6: 'SO2 >',
        7: 'O3 >'
      }
      return types[type] || `类型${type} >`
    }

    // 获取阈值类型对应的标签样式
    const getThresholdTypeTag = (type) => {
      const tags = {
        1: 'danger',
        2: 'warning',
        3: 'warning',
        4: 'info',
        5: 'info',
        6: 'info',
        7: 'info'
      }
      return tags[type] || 'info'
    }

    // 组件挂载时加载数据
    onMounted(() => {
      fetchDashboard()
      fetchUsers()
    })

    return {
      loading,
      users,
      dashboard,
      filteredUsers,
      searchKeyword,
      currentPage,
      pageSize,
      totalUsers,
      subscriptionDialogVisible,
      subscriptionLoading,
      userSubscriptions,
      currentUser,
      fetchUsers,
      handleStatusChange,
      showUserSubscriptions,
      handleDeleteSubscription,
      handleSizeChange,
      handleCurrentChange,
      handleSearch,
      formatDate,
      getThresholdTypeName,
      getThresholdTypeTag
    }
  }
}
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.dashboard-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 40px;
  color: #409EFF;
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.status-text {
  margin-left: 8px;
  font-size: 13px;
  color: #909399;
}

.user-table {
  margin: 20px 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-header {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #EBEEF5;
}

.user-info {
  font-size: 16px;
  font-weight: bold;
}

.location-info {
  display: flex;
  flex-direction: column;
}

.location-coords {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>