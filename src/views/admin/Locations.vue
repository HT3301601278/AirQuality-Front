<template>
  <div class="locations-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="dashboard-stats">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon"><el-icon><Location /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ totalLocations }}</div>
            <div class="stat-label">总位置数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon"><el-icon><MapLocation /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ provinceCount }}</div>
            <div class="stat-label">覆盖省份</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon"><el-icon><Bell /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ cityCount }}</div>
            <div class="stat-label">覆盖城市</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 位置管理主卡片 -->
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>位置管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索省份/城市"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加位置
            </el-button>
            <el-button type="primary" @click="fetchLocations">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 位置列表 -->
      <el-table
        v-loading="loading"
        :data="filteredLocations"
        stripe
        border
        style="width: 100%"
        class="location-table"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="province" label="省份" width="120" sortable />
        <el-table-column prop="city" label="城市" width="120" sortable />
        <el-table-column prop="longitude" label="经度" width="120" />
        <el-table-column prop="latitude" label="纬度" width="120" />
        <el-table-column label="地图预览" width="200">
          <template #default="scope">
            <div class="map-preview" @click="showMap(scope.row)">
              <el-image 
                :src="getMapPreviewUrl(scope.row)" 
                fit="cover"
                class="preview-image">
                <template #error>
                  <div class="map-preview-placeholder">
                    <el-icon><Picture /></el-icon>
                    地图预览
                  </div>
                </template>
              </el-image>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="subscriptionCount" label="关联订阅数" width="120" sortable>
          <template #default="scope">
            <el-tag type="info">{{ scope.row.subscriptionCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="showEditDialog(scope.row)"
              plain
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除此位置信息吗?"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button 
                  size="small" 
                  type="danger" 
                  plain
                  :disabled="scope.row.subscriptionCount && scope.row.subscriptionCount > 0"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalLocations"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑位置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑位置' : '添加位置'"
      width="500px"
      destroy-on-close
    >
      <el-form 
        :model="locationForm" 
        :rules="rules" 
        ref="locationFormRef" 
        label-width="80px"
        @submit.prevent="submitForm"
      >
        <el-form-item label="省份" prop="province">
          <el-input v-model="locationForm.province" placeholder="请输入省份名称" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="locationForm.city" placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input-number 
            v-model="locationForm.longitude" 
            :precision="6" 
            :step="0.000001"
            :min="-180"
            :max="180"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input-number 
            v-model="locationForm.latitude" 
            :precision="6" 
            :step="0.000001"
            :min="-90"
            :max="90"
            style="width: 100%"
          />
        </el-form-item>

        <div class="coordinate-help">
          <el-alert
            title="坐标获取帮助"
            type="info"
            description="您可以通过高德地图、百度地图等服务获取经纬度坐标。"
            :closable="false"
            show-icon
          />
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 地图查看对话框 -->
    <el-dialog
      v-model="mapDialogVisible"
      title="位置地图"
      width="800px"
      destroy-on-close
    >
      <div class="map-container" ref="mapContainer">
        <div v-if="currentLocation" class="location-info-overlay">
          <div class="location-name">{{ currentLocation.province }} {{ currentLocation.city }}</div>
          <div class="location-coords">
            经度: {{ currentLocation.longitude }}，纬度: {{ currentLocation.latitude }}
          </div>
        </div>
        <div class="map-content">
          <!-- 地图内容将通过 iframe 加载或其他地图组件显示 -->
          <iframe 
            v-if="mapUrl" 
            :src="mapUrl" 
            frameborder="0" 
            width="100%" 
            height="400px"
            class="map-iframe"
          ></iframe>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { Location, MapLocation, Bell, Search, Plus, Refresh, Picture } from '@element-plus/icons-vue'

export default {
  name: 'Locations',
  components: {
    Location,
    MapLocation,
    Bell,
    Search,
    Plus,
    Refresh,
    Picture
  },
  setup() {
    // 状态定义
    const loading = ref(false)
    const submitting = ref(false)
    const locations = ref([])
    const searchKeyword = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalLocations = ref(0)
    const dialogVisible = ref(false)
    const mapDialogVisible = ref(false)
    const isEdit = ref(false)
    const currentLocation = ref(null)
    const mapUrl = ref('')
    const locationFormRef = ref(null)
    
    // 表单数据
    const locationForm = reactive({
      id: null,
      province: '',
      city: '',
      longitude: 0,
      latitude: 0
    })
    
    // 表单验证规则
    const rules = {
      province: [
        { required: true, message: '请输入省份名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      city: [
        { required: true, message: '请输入城市名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      longitude: [
        { required: true, message: '请输入经度', trigger: 'blur' }
      ],
      latitude: [
        { required: true, message: '请输入纬度', trigger: 'blur' }
      ]
    }
    
    // 计算属性
    const filteredLocations = computed(() => {
      if (!searchKeyword.value) {
        return locations.value
      }
      const keyword = searchKeyword.value.toLowerCase()
      return locations.value.filter(item => 
        item.province.toLowerCase().includes(keyword) || 
        item.city.toLowerCase().includes(keyword)
      )
    })
    
    const provinceCount = computed(() => {
      const provinces = new Set(locations.value.map(item => item.province))
      return provinces.size
    })
    
    const cityCount = computed(() => {
      return locations.value.length
    })
    
    // 方法
    const fetchLocations = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/locations/all')
        if (response.data.code === 200) {
          locations.value = response.data.data
          totalLocations.value = response.data.data.length
          
          // 获取每个位置的订阅数量
          await fetchSubscriptionCounts()
        } else {
          ElMessage.error('获取位置数据失败：' + response.data.message)
        }
      } catch (error) {
        console.error('获取位置数据错误', error)
        ElMessage.error('获取位置数据出错，请重试')
      } finally {
        loading.value = false
      }
    }
    
    const fetchSubscriptionCounts = async () => {
      try {
        const response = await axios.get('/api/admin/subscriptions')
        if (response.data.code === 200) {
          const subscriptions = response.data.data
          
          // 计算每个位置关联的订阅数量
          const locationCounts = {}
          subscriptions.forEach(sub => {
            if (sub.location && sub.location.id) {
              const locationId = sub.location.id
              locationCounts[locationId] = (locationCounts[locationId] || 0) + 1
            }
          })
          
          // 更新位置数据
          locations.value = locations.value.map(location => ({
            ...location,
            subscriptionCount: locationCounts[location.id] || 0
          }))
        }
      } catch (error) {
        console.error('获取订阅数据错误', error)
      }
    }
    
    const showAddDialog = () => {
      isEdit.value = false
      Object.keys(locationForm).forEach(key => {
        locationForm[key] = key === 'longitude' || key === 'latitude' ? 0 : ''
      })
      dialogVisible.value = true
    }
    
    const showEditDialog = (row) => {
      isEdit.value = true
      Object.keys(locationForm).forEach(key => {
        locationForm[key] = row[key]
      })
      dialogVisible.value = true
    }
    
    const submitForm = async () => {
      if (!locationFormRef.value) return
      
      await locationFormRef.value.validate(async (valid) => {
        if (valid) {
          submitting.value = true
          try {
            let response
            if (isEdit.value) {
              // 更新位置
              response = await axios.put(`/api/locations/${locationForm.id}`, {
                province: locationForm.province,
                city: locationForm.city,
                longitude: locationForm.longitude.toString(),
                latitude: locationForm.latitude.toString()
              })
            } else {
              // 添加位置
              response = await axios.post('/api/locations', {
                province: locationForm.province,
                city: locationForm.city,
                longitude: locationForm.longitude.toString(),
                latitude: locationForm.latitude.toString()
              })
            }
            
            if (response.data.code === 200) {
              ElMessage.success(isEdit.value ? '位置更新成功' : '位置添加成功')
              dialogVisible.value = false
              fetchLocations()
            } else {
              ElMessage.error((isEdit.value ? '更新' : '添加') + '位置失败：' + response.data.message)
            }
          } catch (error) {
            console.error((isEdit.value ? '更新' : '添加') + '位置错误', error)
            ElMessage.error((isEdit.value ? '更新' : '添加') + '位置出错，请重试')
          } finally {
            submitting.value = false
          }
        }
      })
    }
    
    const handleDelete = async (row) => {
      try {
        const response = await axios.delete(`/api/locations/${row.id}`)
        if (response.data.code === 200) {
          ElMessage.success('位置删除成功')
          fetchLocations()
        } else {
          ElMessage.error('删除位置失败：' + response.data.message)
        }
      } catch (error) {
        console.error('删除位置错误', error)
        ElMessage.error('删除位置出错，请重试')
      }
    }
    
    const handleSearch = () => {
      // 搜索功能已由计算属性 filteredLocations 实现
    }
    
    const handleSizeChange = (size) => {
      pageSize.value = size
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
    }
    
    const getMapPreviewUrl = (location) => {
      // 返回地图静态图片URL，这里使用高德地图静态图API作为示例
      // 实际应用中需要替换为真实的API和密钥
      return `https://restapi.amap.com/v3/staticmap?location=${location.longitude},${location.latitude}&zoom=14&size=200*100&markers=mid,,A:${location.longitude},${location.latitude}&key=您的高德地图API密钥`
    }
    
    const showMap = (location) => {
      currentLocation.value = location
      // 构建地图URL，这里使用高德地图作为示例
      mapUrl.value = `https://uri.amap.com/marker?position=${location.longitude},${location.latitude}&name=${location.province}${location.city}`
      mapDialogVisible.value = true
    }
    
    // 生命周期钩子
    onMounted(() => {
      fetchLocations()
    })
    
    return {
      loading,
      submitting,
      locations,
      filteredLocations,
      searchKeyword,
      currentPage,
      pageSize,
      totalLocations,
      dialogVisible,
      mapDialogVisible,
      isEdit,
      locationForm,
      rules,
      locationFormRef,
      currentLocation,
      mapUrl,
      provinceCount,
      cityCount,
      
      fetchLocations,
      showAddDialog,
      showEditDialog,
      submitForm,
      handleDelete,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      getMapPreviewUrl,
      showMap
    }
  }
}
</script>

<style scoped>
.locations-container {
  padding: 20px;
}

.dashboard-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  height: 100px;
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 15px;
  color: #409eff;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.main-card {
  margin-bottom: 20px;
}

.location-table {
  margin-top: 15px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.map-preview {
  width: 100%;
  height: 60px;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.map-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
}

.map-preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 12px;
  background-color: #f5f7fa;
}

.map-preview-placeholder .el-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

.coordinate-help {
  margin: 10px 0 20px;
}

.map-container {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.location-info-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.location-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.location-coords {
  font-size: 12px;
  color: #606266;
}

.map-iframe {
  border: none;
}
</style> 