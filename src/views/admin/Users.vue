<template>
  <div class="users-container">
    <el-card class="main-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="left-area">
            <span class="title">用户管理</span>
            <el-tag type="info" effect="plain">{{ filteredUsers.length }}位用户</el-tag>
          </div>
          <div class="header-operations">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名/邮箱..."
              prefix-icon="Search"
              clearable
              class="search-input"
              @input="handleSearch"
            />
            <div class="filter-buttons">
              <el-button type="primary" :icon="Refresh" circle @click="refreshData" title="刷新数据"></el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 批量操作工具栏 -->
      <div class="bulk-actions" v-if="selectedUsers.length > 0">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>
            已选择 {{ selectedUsers.length }} 个用户
          </template>
          <div class="bulk-actions-buttons">
            <el-button type="success" size="small" @click="bulkSetStatus(1)">批量启用</el-button>
            <el-button type="danger" size="small" @click="bulkSetStatus(0)">批量禁用</el-button>
            <el-button size="small" @click="clearSelection">取消选择</el-button>
          </div>
        </el-alert>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedUsers"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        row-key="id"
        :header-cell-style="{ backgroundColor: '#f5f7fa' }"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column label="用户类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.userType === 1 ? 'danger' : 'primary'" effect="dark">
              {{ scope.row.userType === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
              :active-text="'启用'"
              :inactive-text="'禁用'"
              inline-prompt
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.lastLoginTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              link
              :icon="View"
              @click="viewUserDetails(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 30, 50]"
          :total="filteredUsers.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="用户详情"
      width="30%"
      center
      :modal-append-to-body="false"
      destroy-on-close
      class="user-detail-dialog"
    >
      <div v-if="currentUser" class="user-details">
        <div class="user-avatar">
          <el-avatar 
            :size="100" 
            :src="currentUser.avatar"
            :fallback="defaultAvatarUrl"
          ></el-avatar>
          <h3>{{ currentUser.username }}</h3>
        </div>
        
        <div class="detail-item">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
            <el-descriptions-item label="用户类型">
              <el-tag :type="currentUser.userType === 1 ? 'danger' : 'primary'">
                {{ currentUser.userType === 1 ? '管理员' : '普通用户' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户状态">
              <el-tag :type="currentUser.status === 1 ? 'success' : 'info'">
                {{ currentUser.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentUser.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间">{{ formatDate(currentUser.lastLoginTime) }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 用户订阅列表 -->
          <div class="subscription-section" v-if="currentUser.subscriptions && currentUser.subscriptions.length">
            <h3 class="subscription-title">用户订阅 ({{currentUser.subscriptions.length}})</h3>
            <el-table :data="currentUser.subscriptions" border size="small" style="width: 100%; margin-top: 10px;">
              <el-table-column label="地点" prop="location" width="45%">
                <template #default="scope">
                  {{ scope.row.location.province }} {{ scope.row.location.city }}
                </template>
              </el-table-column>
              <el-table-column label="阈值类型" width="15%">
                <template #default="scope">
                  {{ scope.row.thresholdType === 1 ? 'AQI' : 'PM2.5' }}
                </template>
              </el-table-column>
              <el-table-column prop="thresholdValue" label="阈值" width="10%" />
              <el-table-column label="状态" width="20%">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
                    {{ scope.row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="notification-info" v-if="currentUser.notificationCount !== undefined">
            <el-statistic title="通知数量" :value="currentUser.notificationCount">
              <template #suffix>
                <el-tag size="small" effect="plain">条</el-tag>
              </template>
            </el-statistic>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleUserStatusInDialog" 
            :class="{ 'danger-button': currentUser && currentUser.status === 1 }"
          >
            {{ currentUser && currentUser.status === 1 ? '禁用用户' : '启用用户' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { View, Search, Refresh, UserFilled } from '@element-plus/icons-vue'

export default {
  name: 'Users',
  setup() {
    const allUsers = ref([]) // 所有用户数据
    const users = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const searchQuery = ref('')
    const selectedUsers = ref([])
    const dialogVisible = ref(false)
    const currentUser = ref(null)
    const defaultAvatarUrl = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

    // 过滤后的用户列表
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return allUsers.value
      
      const query = searchQuery.value.toLowerCase()
      return allUsers.value.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      )
    })

    // 当前页的用户列表
    const pagedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredUsers.value.slice(start, end)
    })

    const fetchUsers = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/admin/users', {
          params: {
            page: 0,
            size: 1000 // 获取较大数量的用户，前端分页
          }
        })
        allUsers.value = response.data.data.content
        
        // 重置分页
        currentPage.value = 1
      } catch (error) {
        ElMessage.error('获取用户列表失败')
        console.error('Error fetching users:', error)
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      currentPage.value = 1 // 搜索时重置到第一页
    }

    const handleStatusChange = async (user) => {
      try {
        await axios.put(`/api/admin/users/${user.id}/status?status=${user.status}`)
        ElMessage.success({
          message: `用户 ${user.username} ${user.status === 1 ? '已启用' : '已禁用'}`,
          type: 'success'
        })
      } catch (error) {
        user.status = user.status === 1 ? 0 : 1 // 恢复原状态
        ElMessage.error('更新用户状态失败')
        console.error('Error updating user status:', error)
      }
    }

    const bulkSetStatus = async (status) => {
      ElMessageBox.confirm(
        `确定要${status === 1 ? '启用' : '禁用'}选中的 ${selectedUsers.value.length} 个用户吗？`,
        '批量操作确认',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(async () => {
        loading.value = true
        try {
          const promises = selectedUsers.value.map(user => 
            axios.put(`/api/admin/users/${user.id}/status?status=${status}`)
          )
          await Promise.all(promises)
          
          // 更新本地状态
          selectedUsers.value.forEach(selectedUser => {
            const user = allUsers.value.find(u => u.id === selectedUser.id)
            if (user) {
              user.status = status
            }
          })
          
          ElMessage.success(`批量${status === 1 ? '启用' : '禁用'}操作成功`)
          clearSelection()
        } catch (error) {
          ElMessage.error('批量操作失败')
          console.error('Error in bulk operation:', error)
        } finally {
          loading.value = false
        }
      }).catch(() => {
        ElMessage.info('已取消操作')
      })
    }

    const handleSelectionChange = (selection) => {
      selectedUsers.value = selection
    }

    const clearSelection = () => {
      selectedUsers.value = []
    }

    const handleSizeChange = (val) => {
      pageSize.value = val
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    const refreshData = () => {
      fetchUsers()
      ElMessage({
        message: '数据已刷新',
        type: 'success',
        duration: 1500
      })
    }

    const viewUserDetails = (user) => {
      loading.value = true
      axios.get(`/api/admin/users/${user.id}`)
        .then(response => {
          if (response.data.code === 200) {
            currentUser.value = response.data.data
            dialogVisible.value = true
          } else {
            ElMessage.error('获取用户详情失败')
          }
        })
        .catch(error => {
          ElMessage.error('获取用户详情失败')
          console.error('Error fetching user details:', error)
        })
        .finally(() => {
          loading.value = false
        })
    }

    const handleUserStatusInDialog = async () => {
      if (!currentUser.value) return
      
      const newStatus = currentUser.value.status === 1 ? 0 : 1
      try {
        await axios.put(`/api/admin/users/${currentUser.value.id}/status?status=${newStatus}`)
        
        // 更新对话框中的用户状态
        currentUser.value.status = newStatus
        
        // 同时更新表格中的对应用户
        const userInTable = allUsers.value.find(u => u.id === currentUser.value.id)
        if (userInTable) {
          userInTable.status = newStatus
        }
        
        ElMessage.success(`用户 ${currentUser.value.username} ${newStatus === 1 ? '已启用' : '已禁用'}`)
      } catch (error) {
        ElMessage.error('更新用户状态失败')
        console.error('Error updating user status:', error)
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '暂无记录'
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const avatarUrl = (user) => {
      // 根据用户名生成随机颜色的头像
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random&color=fff&size=128`
    }

    onMounted(() => {
      fetchUsers()
    })

    return {
      users,
      filteredUsers,
      pagedUsers,
      loading,
      currentPage,
      pageSize,
      searchQuery,
      selectedUsers,
      dialogVisible,
      currentUser,
      handleStatusChange,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      clearSelection,
      bulkSetStatus,
      formatDate,
      handleSearch,
      refreshData,
      viewUserDetails,
      handleUserStatusInDialog,
      avatarUrl,
      View,
      Search,
      Refresh,
      UserFilled,
      defaultAvatarUrl
    }
  }
}
</script>

<style scoped>
.users-container {
  padding: 20px;
}

.main-card {
  transition: all 0.3s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.left-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.header-operations {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 240px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.bulk-actions {
  margin-bottom: 16px;
}

.bulk-actions-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f8f9fa;
}

:deep(.el-table) {
  margin: 16px 0;
  border-radius: 4px;
  overflow: hidden;
  table-layout: fixed;
}

:deep(.el-table__header) {
  font-weight: bold;
  width: 100% !important;
}

:deep(.el-table__header-wrapper table),
:deep(.el-table__body-wrapper table) {
  width: 100% !important;
}

:deep(.el-tag) {
  text-align: center;
  min-width: 80px;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 10px;
}

.user-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.detail-item {
  width: 100%;
}

.danger-button {
  --el-button-hover-text-color: var(--el-color-danger);
  --el-button-hover-border-color: var(--el-color-danger);
  --el-button-hover-bg-color: var(--el-color-danger-light-9);
}

@media screen and (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-operations {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-buttons {
    width: 100%;
    flex-wrap: wrap;
  }
}

:deep(.user-detail-dialog .el-dialog) {
  margin: 0 auto !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-height: 80vh;
  overflow-y: auto;
}

.subscription-section {
  width: 100%;
  margin-top: 20px;
}

.subscription-title {
  margin-bottom: 10px;
  font-size: 16px;
  color: #606266;
  text-align: left;
}
</style>