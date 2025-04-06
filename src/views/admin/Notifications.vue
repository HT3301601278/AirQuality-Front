<template>
  <div class="notifications-container">
    <el-card class="statistics-card">
      <div class="statistics">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-title">总通知数</div>
              <div class="stat-value">{{ totalNotifications }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-title">未读通知</div>
              <div class="stat-value">{{ unreadNotifications }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-title">已读通知</div>
              <div class="stat-value">{{ readNotifications }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">通知管理</span>
          <div class="filters">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户名或地区"
              clearable
              class="search-input"
              @clear="handleSearchClear"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="readStatusFilter" placeholder="读取状态" class="filter-select">
              <el-option label="全部" value="" />
              <el-option label="已读" value="read" />
              <el-option label="未读" value="unread" />
            </el-select>
            <el-select v-model="thresholdTypeFilter" placeholder="阈值类型" class="filter-select">
              <el-option label="全部" value="" />
              <el-option label="AQI" value="1" />
              <el-option label="PM2.5" value="2" />
            </el-select>
            <el-button type="primary" @click="refreshNotifications">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredNotifications"
        style="width: 100%"
        stripe
        border
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="150">
          <template #default="scope">
            <div>
              <div><strong>ID:</strong> {{ scope.row.user.id }}</div>
              <div><strong>用户名:</strong> {{ scope.row.user.username }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="通知内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="地区信息" width="150">
          <template #default="scope">
            <div>{{ scope.row.locationProvince }} - {{ scope.row.locationCity }}</div>
          </template>
        </el-table-column>
        <el-table-column label="阈值信息" width="200">
          <template #default="scope">
            <div>
              <div><strong>类型:</strong> {{ getThresholdTypeName(scope.row.thresholdType) }}</div>
              <div><strong>阈值:</strong> {{ scope.row.thresholdValue }}</div>
              <div><strong>实际值:</strong> {{ scope.row.actualValue }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isRead ? 'info' : 'danger'">
              {{ scope.row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              v-if="!scope.row.isRead"
              size="small"
              type="primary"
              @click="markAsRead(scope.row)"
              :disabled="markingRead"
            >
              标为已读
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="showDeleteConfirm(scope.row)"
              :disabled="deleting"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredNotifications.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'Notifications',
  components: {
    Search
  },
  setup() {
    const notifications = ref([])
    const loading = ref(false)
    const markingRead = ref(false)
    const deleting = ref(false)
    const searchQuery = ref('')
    const readStatusFilter = ref('')
    const thresholdTypeFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)

    const fetchNotifications = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/admin/notifications')
        if (response.data && response.data.code === 200) {
          notifications.value = response.data.data
        } else {
          ElMessage.error('获取通知数据失败')
        }
      } catch (error) {
        console.error('获取通知列表错误:', error)
        ElMessage.error('获取通知数据出错: ' + error.message)
      } finally {
        loading.value = false
      }
    }

    const refreshNotifications = () => {
      fetchNotifications()
    }

    const markAsRead = async (notification) => {
      if (notification.isRead) return
      
      markingRead.value = true
      try {
        await axios.put(`/api/notifications/${notification.id}/read`)
        notification.isRead = true
        ElMessage.success('已将通知标记为已读')
      } catch (error) {
        console.error('标记通知为已读失败:', error)
        ElMessage.error('标记通知为已读失败: ' + error.message)
      } finally {
        markingRead.value = false
      }
    }

    const showDeleteConfirm = (notification) => {
      ElMessageBox.confirm(
        '确定要删除这条通知吗？此操作不可恢复。',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          // 这里假设有删除通知的API，如果没有可以省略此功能
          deleteNotification(notification)
        })
        .catch(() => {
          // 用户取消删除
        })
    }

    const deleteNotification = async (notification) => {
      deleting.value = true
      try {
        // 注：API文档中没有提供删除通知的接口，此处为示例
        // await axios.delete(`/api/admin/notifications/${notification.id}`)
        // 由于没有API，这里只是从本地数组中移除
        const index = notifications.value.findIndex(n => n.id === notification.id)
        if (index !== -1) {
          notifications.value.splice(index, 1)
          ElMessage.success('通知已删除')
        }
      } catch (error) {
        console.error('删除通知失败:', error)
        ElMessage.error('删除通知失败: ' + error.message)
      } finally {
        deleting.value = false
      }
    }

    const filteredNotifications = computed(() => {
      let result = [...notifications.value]

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(
          notification =>
            notification.user.username.toLowerCase().includes(query) ||
            notification.locationProvince.toLowerCase().includes(query) ||
            notification.locationCity.toLowerCase().includes(query) ||
            notification.message.toLowerCase().includes(query)
        )
      }

      // 状态过滤
      if (readStatusFilter.value) {
        const isRead = readStatusFilter.value === 'read'
        result = result.filter(notification => notification.isRead === isRead)
      }

      // 阈值类型过滤
      if (thresholdTypeFilter.value) {
        result = result.filter(
          notification => notification.thresholdType.toString() === thresholdTypeFilter.value
        )
      }

      return result
    })

    const paginatedNotifications = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value
      return filteredNotifications.value.slice(startIndex, startIndex + pageSize.value)
    })

    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    const handleSearchClear = () => {
      searchQuery.value = ''
    }

    const formatDateTime = (dateTimeStr) => {
      const date = new Date(dateTimeStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const getThresholdTypeName = (type) => {
      const types = {
        1: 'AQI',
        2: 'PM2.5'
      }
      return types[type] || `未知(${type})`
    }

    // 统计信息
    const totalNotifications = computed(() => notifications.value.length)
    
    const unreadNotifications = computed(() => 
      notifications.value.filter(notification => !notification.isRead).length
    )
    
    const readNotifications = computed(() => 
      notifications.value.filter(notification => notification.isRead).length
    )

    onMounted(() => {
      fetchNotifications()
    })

    return {
      notifications,
      filteredNotifications,
      paginatedNotifications,
      loading,
      markingRead,
      deleting,
      searchQuery,
      readStatusFilter,
      thresholdTypeFilter,
      currentPage,
      pageSize,
      totalNotifications,
      unreadNotifications,
      readNotifications,
      refreshNotifications,
      markAsRead,
      showDeleteConfirm,
      handleSizeChange,
      handleCurrentChange,
      handleSearchClear,
      formatDateTime,
      getThresholdTypeName
    }
  }
}
</script>

<style scoped>
.notifications-container {
  padding: 20px;
}

.statistics-card {
  margin-bottom: 20px;
}

.statistics {
  padding: 10px;
}

.stat-item {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters {
    margin-top: 10px;
    width: 100%;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
}
</style> 