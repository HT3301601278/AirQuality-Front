<template>
  <div class="subscriptions-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订阅管理</span>
          <el-button type="primary" size="small" @click="showAddDialog">添加订阅</el-button>
        </div>
      </template>
      <div class="content">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="subscriptions.length === 0" class="empty-container">
          <el-empty description="暂无订阅数据" />
          <el-button type="primary" @click="showAddDialog">立即添加</el-button>
        </div>
        <div v-else class="subscription-list">
          <el-table :data="subscriptions" style="width: 100%" border>
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="省份" prop="location.province" />
            <el-table-column label="城市" prop="location.city" />
            <el-table-column label="监测类型">
              <template #default="scope">
                {{ getThresholdTypeName(scope.row.thresholdType) }}
              </template>
            </el-table-column>
            <el-table-column label="阈值" prop="thresholdValue" />
            <el-table-column label="创建时间">
              <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="changeStatus(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteSubscription(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- 添加订阅对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加订阅"
      width="500px"
    >
      <el-form :model="subscriptionForm" :rules="rules" ref="subscriptionFormRef" label-width="80px">
        <el-form-item label="省份" prop="province">
          <el-select v-model="subscriptionForm.province" placeholder="请选择省份" style="width: 100%" @change="fetchCities">
            <el-option
              v-for="province in provinces"
              :key="province"
              :label="province"
              :value="province"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-select v-model="subscriptionForm.city" placeholder="请选择城市" style="width: 100%" @change="setLocationId">
            <el-option
              v-for="city in cities"
              :key="city.id"
              :label="city.city"
              :value="city.city"
              :city-id="city.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="监测类型" prop="thresholdType">
          <el-select v-model="subscriptionForm.thresholdType" placeholder="请选择监测类型" style="width: 100%">
            <el-option :label="'AQI'" :value="1" />
            <el-option :label="'PM2.5'" :value="2" />
            <el-option :label="'PM10'" :value="3" />
            <el-option :label="'O3'" :value="4" />
            <el-option :label="'NO2'" :value="5" />
            <el-option :label="'SO2'" :value="6" />
            <el-option :label="'CO'" :value="7" />
            <el-option :label="'NO'" :value="8" />
            <el-option :label="'NH3'" :value="9" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="thresholdValue">
          <el-input-number v-model="subscriptionForm.thresholdValue" :min="0" :precision="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addSubscription">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'Subscriptions',
  setup() {
    const loading = ref(true)
    const subscriptions = ref([])
    const dialogVisible = ref(false)
    const subscriptionFormRef = ref(null)
    const provinces = ref([])
    const cities = ref([])
    
    const subscriptionForm = reactive({
      province: '',
      city: '',
      locationId: null,
      thresholdType: 1,
      thresholdValue: 100
    })
    
    const rules = {
      province: [{ required: true, message: '请选择省份', trigger: 'change' }],
      city: [{ required: true, message: '请选择城市', trigger: 'change' }],
      thresholdType: [{ required: true, message: '请选择监测类型', trigger: 'change' }],
      thresholdValue: [{ required: true, message: '请输入阈值', trigger: 'blur' }]
    }
    
    // 获取用户的所有订阅
    const fetchSubscriptions = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/subscriptions')
        if (response.data.code === 200) {
          subscriptions.value = response.data.data
        } else {
          ElMessage.error(response.data.message || '获取订阅失败')
        }
      } catch (error) {
        console.error('获取订阅失败:', error)
        ElMessage.error('网络错误，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 获取所有省份
    const fetchProvinces = async () => {
      try {
        const response = await axios.get('/api/locations/provinces')
        if (response.data.code === 200) {
          provinces.value = response.data.data
        }
      } catch (error) {
        console.error('获取省份失败:', error)
        ElMessage.error('获取省份失败，请稍后重试')
      }
    }
    
    // 获取省份下的城市
    const fetchCities = async () => {
      cities.value = []
      subscriptionForm.city = ''
      subscriptionForm.locationId = null
      
      if (!subscriptionForm.province) return
      
      try {
        const response = await axios.get(`/api/locations/cities?province=${subscriptionForm.province}`)
        if (response.data.code === 200) {
          cities.value = response.data.data
        }
      } catch (error) {
        console.error('获取城市失败:', error)
        ElMessage.error('获取城市失败，请稍后重试')
      }
    }
    
    // 设置locationId
    const setLocationId = () => {
      const selectedCity = cities.value.find(item => item.city === subscriptionForm.city)
      if (selectedCity) {
        subscriptionForm.locationId = selectedCity.id
      }
    }
    
    // 展示添加对话框
    const showAddDialog = () => {
      dialogVisible.value = true
      if (provinces.value.length === 0) {
        fetchProvinces()
      }
    }
    
    // 添加订阅
    const addSubscription = async () => {
      if (!subscriptionFormRef.value) return
      
      await subscriptionFormRef.value.validate(async (valid) => {
        if (!valid) return
        
        if (!subscriptionForm.locationId) {
          ElMessage.error('请选择有效的城市')
          return
        }
        
        try {
          const response = await axios.post('/api/subscriptions', {
            locationId: subscriptionForm.locationId,
            thresholdType: subscriptionForm.thresholdType,
            thresholdValue: subscriptionForm.thresholdValue
          })
          
          if (response.data.code === 200) {
            ElMessage.success('添加订阅成功')
            dialogVisible.value = false
            fetchSubscriptions()
            // 重置表单
            subscriptionForm.province = ''
            subscriptionForm.city = ''
            subscriptionForm.locationId = null
            subscriptionForm.thresholdType = 1
            subscriptionForm.thresholdValue = 100
          } else {
            ElMessage.error(response.data.message || '添加订阅失败')
          }
        } catch (error) {
          console.error('添加订阅失败:', error)
          ElMessage.error('网络错误，请稍后重试')
        }
      })
    }
    
    // 更新订阅状态
    const changeStatus = async (subscription) => {
      try {
        const response = await axios.put(`/api/subscriptions/${subscription.id}/status?status=${subscription.status}`)
        if (response.data.code === 200) {
          ElMessage.success('更新状态成功')
        } else {
          ElMessage.error(response.data.message || '更新状态失败')
          // 回滚状态
          subscription.status = subscription.status === 1 ? 0 : 1
        }
      } catch (error) {
        console.error('更新状态失败:', error)
        ElMessage.error('网络错误，请稍后重试')
        // 回滚状态
        subscription.status = subscription.status === 1 ? 0 : 1
      }
    }
    
    // 删除订阅
    const deleteSubscription = async (subscription) => {
      ElMessageBox.confirm(
        `确定要删除"${subscription.location.province}${subscription.location.city}"的订阅吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await axios.delete(`/api/subscriptions/${subscription.id}`)
          if (response.data.code === 200) {
            ElMessage.success('删除成功')
            fetchSubscriptions()
          } else {
            ElMessage.error(response.data.message || '删除失败')
          }
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('网络错误，请稍后重试')
        }
      }).catch(() => {
        // 用户取消删除
      })
    }
    
    // 获取阈值类型名称
    const getThresholdTypeName = (type) => {
      const typeMap = {
        1: 'AQI',
        2: 'PM2.5',
        3: 'PM10',
        4: 'O3',
        5: 'NO2',
        6: 'SO2',
        7: 'CO',
        8: 'NO',
        9: 'NH3'
      }
      return typeMap[type] || '未知'
    }
    
    // 格式化时间
    const formatTime = (time) => {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
    
    onMounted(() => {
      fetchSubscriptions()
    })
    
    return {
      loading,
      subscriptions,
      dialogVisible,
      subscriptionFormRef,
      subscriptionForm,
      rules,
      provinces,
      cities,
      fetchCities,
      setLocationId,
      showAddDialog,
      addSubscription,
      changeStatus,
      deleteSubscription,
      getThresholdTypeName,
      formatTime
    }
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
  margin-bottom: 10px;
}

.content {
  min-height: 300px;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-container .el-button {
  margin-top: 20px;
}

.subscription-list {
  margin-top: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style> 