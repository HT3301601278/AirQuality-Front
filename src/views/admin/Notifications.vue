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
              <el-option label="PM10" value="3" />
              <el-option label="SO2" value="4" />
              <el-option label="NO2" value="5" />
              <el-option label="O3" value="6" />
              <el-option label="CO" value="7" />
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
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column label="用户信息" width="150">
          <template #default="scope">
            <div>
              <div><strong>ID:</strong> {{ scope.row.user.id }}</div>
              <div><strong>用户名:</strong> {{ scope.row.user.username }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="通知内容" min-width="350" show-overflow-tooltip />
        <el-table-column label="地区信息" width="150">
          <template #default="scope">
            <div>{{ scope.row.locationProvince }} - {{ scope.row.locationCity }}</div>
          </template>
        </el-table-column>
        <el-table-column label="阈值信息" width="120">
          <template #default="scope">
            <div>
              <div><strong>类型:</strong> {{ getThresholdTypeName(scope.row.thresholdType) }}</div>
              <div><strong>阈值:</strong> {{ scope.row.thresholdValue }}</div>
              <div><strong>实际值:</strong> {{ scope.row.actualValue }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isRead ? 'info' : 'danger'">
              {{ scope.row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
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
    const searchQuery = ref('')
    const readStatusFilter = ref('')
    const thresholdTypeFilter = ref('')
    const sortColumn = ref('createdAt')
    const sortOrder = ref('descending')

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

      // 按ID排序
      result.sort((a, b) => {
        if (sortColumn.value === 'id') {
          return sortOrder.value === 'ascending' ? a.id - b.id : b.id - a.id
        }
        // 按创建时间排序
        else if (sortColumn.value === 'createdAt') {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return sortOrder.value === 'ascending' ? dateA - dateB : dateB - dateA
        }
        // 默认按创建时间降序
        else {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        }
      })

      return result
    })

    const handleSearchClear = () => {
      searchQuery.value = ''
    }

    const handleSortChange = (column) => {
      if (column.prop) {
        sortColumn.value = column.prop
        sortOrder.value = column.order || 'descending'
      } else {
        // 重置为默认排序
        sortColumn.value = 'createdAt'
        sortOrder.value = 'descending'
      }
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
        2: 'PM2.5',
        3: 'PM10',
        4: 'SO2',
        5: 'NO2',
        6: 'O3',
        7: 'CO'
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
      loading,
      searchQuery,
      readStatusFilter,
      thresholdTypeFilter,
      sortColumn,
      sortOrder,
      totalNotifications,
      unreadNotifications,
      readNotifications,
      refreshNotifications,
      handleSearchClear,
      handleSortChange,
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

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: space-between;
}

.single-button {
  justify-content: center;
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