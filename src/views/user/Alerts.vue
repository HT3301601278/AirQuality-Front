<template>
  <div class="alerts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">警报查看</span>
          <div class="header-actions">
            <el-badge :value="unreadCount" :max="99" class="unread-badge" v-if="unreadCount > 0">
              <el-button type="primary" size="small" @click="markAllAsRead">
                标记全部为已读
              </el-button>
            </el-badge>
            <el-button type="primary" size="small" @click="markAllAsRead" v-else>
              标记全部为已读
            </el-button>
            <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="unread">未读</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      
      <div class="content" v-loading="loading">
        <el-empty description="暂无警报" v-if="notifications.length === 0"></el-empty>

        <div class="notification-list" v-else>
          <el-card 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{'unread': !notification.isRead}"
            shadow="hover"
          >
            <template #header>
              <div class="notification-header">
                <div class="notification-info">
                  <el-tag v-if="!notification.isRead" type="danger" size="small">未读</el-tag>
                  <el-tag v-else type="info" size="small">已读</el-tag>
                  <span class="created-time">{{ formatDate(notification.createdAt) }}</span>
                </div>
                <el-button 
                  v-if="!notification.isRead" 
                  type="primary" 
                  link 
                  @click="markAsRead(notification.id)"
                >
                  标为已读
                </el-button>
              </div>
            </template>

            <div class="notification-content">
              <h3 class="location">{{ notification.locationProvince }} {{ notification.locationCity }}</h3>
              <p class="message">{{ notification.message }}</p>
              <div class="details">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="污染类型">
                    {{ getThresholdTypeName(notification.thresholdType) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="当前值">
                    {{ notification.actualValue }} {{ getThresholdTypeUnit(notification.thresholdType) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="阈值">
                    {{ notification.thresholdValue }} {{ getThresholdTypeUnit(notification.thresholdType) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="超出">
                    {{ (notification.actualValue - notification.thresholdValue).toFixed(2) }} {{ getThresholdTypeUnit(notification.thresholdType) }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'Alerts',
  setup() {
    const notifications = ref([])
    const unreadCount = ref(0)
    const loading = ref(false)
    const activeTab = ref('all')

    // 获取所有通知
    const fetchAllNotifications = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/notifications')
        notifications.value = response.data
        getUnreadCount()
      } catch (error) {
        console.error('获取通知失败', error)
        ElMessage.error('获取通知失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 获取未读通知
    const fetchUnreadNotifications = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/notifications/unread')
        notifications.value = response.data
        getUnreadCount()
      } catch (error) {
        console.error('获取未读通知失败', error)
        ElMessage.error('获取未读通知失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 获取未读通知数量
    const getUnreadCount = async () => {
      try {
        const response = await axios.get('/api/notifications/unread/count')
        unreadCount.value = response.data.count
      } catch (error) {
        console.error('获取未读通知数量失败', error)
      }
    }

    // 标记单个通知为已读
    const markAsRead = async (id) => {
      try {
        await axios.put(`/api/notifications/${id}/read`)
        ElMessage.success('已标记为已读')
        if (activeTab.value === 'all') {
          // 更新通知状态
          const notification = notifications.value.find(n => n.id === id)
          if (notification) {
            notification.isRead = true
          }
        } else {
          // 从未读列表中移除
          notifications.value = notifications.value.filter(n => n.id !== id)
        }
        getUnreadCount()
      } catch (error) {
        console.error('标记已读失败', error)
        ElMessage.error('标记已读失败，请稍后重试')
      }
    }

    // 标记所有通知为已读
    const markAllAsRead = async () => {
      try {
        await axios.put('/api/notifications/read-all')
        ElMessage.success('已全部标记为已读')
        if (activeTab.value === 'all') {
          // 更新所有通知状态
          notifications.value.forEach(notification => {
            notification.isRead = true
          })
        } else {
          // 清空未读列表
          notifications.value = []
        }
        unreadCount.value = 0
      } catch (error) {
        console.error('标记全部已读失败', error)
        ElMessage.error('标记全部已读失败，请稍后重试')
      }
    }

    // 切换标签页
    const handleTabChange = (tab) => {
      if (tab === 'all') {
        fetchAllNotifications()
      } else {
        fetchUnreadNotifications()
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 获取污染类型名称
    const getThresholdTypeName = (type) => {
      const typeMap = {
        1: 'AQI',
        2: 'PM2.5',
        3: 'PM10',
        4: 'O3',
        5: 'NO2',
        6: 'SO2',
        7: 'CO',
        8: 'NH3',
        9: 'NO'
      }
      return typeMap[type] || '未知类型'
    }

    // 获取污染类型单位
    const getThresholdTypeUnit = (type) => {
      const unitMap = {
        1: '',
        2: 'μg/m³',
        3: 'μg/m³',
        4: 'μg/m³',
        5: 'μg/m³',
        6: 'μg/m³',
        7: 'mg/m³',
        8: 'μg/m³',
        9: 'μg/m³'
      }
      return unitMap[type] || ''
    }

    onMounted(() => {
      fetchAllNotifications()
    })

    return {
      notifications,
      unreadCount,
      loading,
      activeTab,
      markAsRead,
      markAllAsRead,
      handleTabChange,
      formatDate,
      getThresholdTypeName,
      getThresholdTypeUnit
    }
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

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.unread-badge :deep(.el-badge__content) {
  z-index: 1;
}

.content {
  min-height: 300px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  border-left: 4px solid #e6e6e6;
  transition: all 0.3s;
}

.notification-item.unread {
  border-left: 4px solid #f56c6c;
  background-color: #fef9f9;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.created-time {
  color: #909399;
  font-size: 14px;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location {
  font-size: 16px;
  color: #303133;
  margin: 0;
  font-weight: 500;
}

.message {
  color: #606266;
  margin: 0;
  line-height: 1.5;
}

.details {
  margin-top: 12px;
}
</style> 