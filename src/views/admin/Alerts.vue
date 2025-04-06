<template>
  <div class="admin-alerts-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>警报管理</span>
          <div class="header-operations">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索用户或位置" 
              prefix-icon="el-icon-search"
              clearable
              class="search-input"
              @input="handleSearch"
            />
            <el-select v-model="statusFilter" placeholder="订阅状态" @change="handleFilter">
              <el-option label="全部" value="" />
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </div>
        </div>
      </template>
      
      <div class="content">
        <el-table
          v-loading="loading"
          :data="filteredSubscriptions"
          style="width: 100%"
          border
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column label="位置信息" min-width="220">
            <template #default="scope">
              <div>
                <div><strong>省份:</strong> {{ scope.row.location.province }}</div>
                <div><strong>城市:</strong> {{ scope.row.location.city }}</div>
                <div>
                  <strong>坐标:</strong> 
                  {{ scope.row.location.longitude }}, {{ scope.row.location.latitude }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="阈值信息" min-width="180">
            <template #default="scope">
              <el-tag :type="getThresholdTagType(scope.row.thresholdType)">
                {{ getThresholdTypeName(scope.row.thresholdType) }}
              </el-tag>
              <div class="mt-2">
                <strong>值:</strong> {{ scope.row.thresholdValue }}
                {{ getThresholdUnit(scope.row.thresholdType) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" sortable width="180" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDeleteSubscription(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalSubscriptions"
            :page-size="pageSize"
            :current-page="currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
        <el-empty v-if="filteredSubscriptions.length === 0" description="没有找到警报订阅数据" />
      </div>
    </el-card>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      v-model="deleteDialogVisible"
      width="30%"
    >
      <span>确定要删除用户 ID {{ selectedSubscription.userId }} 的警报订阅吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'AdminAlerts',
  setup() {
    const loading = ref(false)
    const subscriptions = ref([])
    const searchQuery = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalSubscriptions = ref(0)
    const deleteDialogVisible = ref(false)
    const selectedSubscription = reactive({
      id: null,
      userId: null
    })

    const filteredSubscriptions = computed(() => {
      let result = subscriptions.value
      
      // 应用搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(sub => 
          sub.userId.toString().includes(query) ||
          sub.location.province.toLowerCase().includes(query) ||
          sub.location.city.toLowerCase().includes(query)
        )
      }
      
      // 应用状态过滤
      if (statusFilter.value !== '') {
        result = result.filter(sub => sub.status === statusFilter.value)
      }
      
      // 更新总数
      totalSubscriptions.value = result.length
      
      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return result.slice(start, end)
    })

    // 获取所有订阅
    const fetchSubscriptions = async () => {
      loading.value = true
      try {
        const response = await fetch('/api/admin/subscriptions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 确保包含认证令牌
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        
        if (data.code === 200) {
          subscriptions.value = data.data
          totalSubscriptions.value = data.data.length
        } else {
          ElMessage.error(data.message || '获取订阅数据失败')
        }
      } catch (error) {
        console.error('获取订阅数据出错:', error)
        ElMessage.error('获取订阅数据时发生错误')
      } finally {
        loading.value = false
      }
    }

    const getThresholdTypeName = (type) => {
      const types = {
        1: '空气质量指数(AQI)',
        2: 'PM2.5',
        3: 'PM10',
        4: 'CO',
        5: 'NO2',
        6: 'SO2',
        7: 'O3'
      }
      return types[type] || `类型${type}`
    }

    const getThresholdTagType = (type) => {
      const types = {
        1: 'danger',
        2: 'warning',
        3: 'warning',
        4: 'info',
        5: 'info',
        6: 'info',
        7: 'info'
      }
      return types[type] || 'info'
    }

    const getThresholdUnit = (type) => {
      const units = {
        1: '',
        2: 'μg/m³',
        3: 'μg/m³',
        4: 'mg/m³',
        5: 'μg/m³',
        6: 'μg/m³',
        7: 'μg/m³'
      }
      return units[type] || ''
    }

    const handleSearch = () => {
      currentPage.value = 1
    }

    const handleFilter = () => {
      currentPage.value = 1
    }

    const handleSizeChange = (size) => {
      pageSize.value = size
      currentPage.value = 1
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page
    }

    const handleDeleteSubscription = (subscription) => {
      selectedSubscription.id = subscription.id
      selectedSubscription.userId = subscription.userId
      deleteDialogVisible.value = true
    }

    const confirmDelete = async () => {
      try {
        const response = await fetch(`/api/admin/users/${selectedSubscription.userId}/subscriptions/${selectedSubscription.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        const data = await response.json()
        
        if (data.code === 200) {
          ElMessage.success('订阅删除成功')
          fetchSubscriptions() // 重新加载数据
        } else {
          ElMessage.error(data.message || '删除订阅失败')
        }
      } catch (error) {
        console.error('删除订阅出错:', error)
        ElMessage.error('删除订阅时发生错误')
      } finally {
        deleteDialogVisible.value = false
      }
    }

    onMounted(() => {
      fetchSubscriptions()
    })

    return {
      loading,
      subscriptions,
      filteredSubscriptions,
      searchQuery,
      statusFilter,
      currentPage,
      pageSize,
      totalSubscriptions,
      deleteDialogVisible,
      selectedSubscription,
      getThresholdTypeName,
      getThresholdTagType,
      getThresholdUnit,
      handleSearch,
      handleFilter,
      handleSizeChange,
      handleCurrentChange,
      handleDeleteSubscription,
      confirmDelete
    }
  }
}
</script>

<style scoped>
.admin-alerts-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-operations {
  display: flex;
  gap: 15px;
}

.search-input {
  width: 220px;
}

.content {
  padding: 20px 0;
}

.mt-2 {
  margin-top: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 