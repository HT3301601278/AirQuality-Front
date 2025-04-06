<template>
  <div class="locations-container">
    <el-card class="locations-card" :body-style="{ padding: '0px' }">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <i class="el-icon-location-information" />
            <span>位置管理</span>
          </div>
          <el-button type="primary" @click="handleAdd" round>添加位置</el-button>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" size="default">
          <el-form-item label="省份">
            <el-select v-model="searchForm.province" placeholder="选择省份" clearable @change="handleProvinceChange" class="search-select">
              <el-option v-for="item in provinces" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="城市">
            <el-select v-model="searchForm.city" placeholder="选择城市" clearable :disabled="!searchForm.province" class="search-select">
              <el-option v-for="item in cities" :key="item.id" :label="item.city" :value="item.city" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" class="text-center-btn">搜索</el-button>
            <el-button @click="resetSearch" class="text-center-btn">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 表格区域 -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="paginatedLocations"
          style="width: 100%"
          border
          stripe
          highlight-current-row
          class="location-table"
        >
          <el-table-column type="index" label="序号" width="5%" align="center" />
          <el-table-column prop="id" label="ID" width="8%" align="center" />
          <el-table-column prop="province" label="省份" width="15%" align="center" />
          <el-table-column prop="city" label="城市" width="15%" align="center" />
          <el-table-column prop="longitude" label="经度" width="20%" align="center" />
          <el-table-column prop="latitude" label="纬度" width="20%" align="center" />
          <el-table-column label="操作" width="17%" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" type="primary" @click="handleEdit(scope.row)" plain>编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(scope.row)" plain>删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态 -->
        <el-empty v-if="!loading && filteredLocations.length === 0" description="暂无数据" />
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredLocations.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </div>
    </el-card>
    
    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加位置' : '编辑位置'"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
      center
    >
      <el-form
        ref="locationFormRef"
        :model="locationForm"
        :rules="locationRules"
        label-width="80px"
        :disabled="dialogLoading"
        class="location-form"
      >
        <el-form-item label="省份" prop="province">
          <el-select
            v-model="locationForm.province"
            placeholder="选择省份"
            style="width: 100%"
            filterable
            @change="handleFormProvinceChange"
          >
            <el-option v-for="item in provinces" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="locationForm.city" placeholder="输入城市名称" />
        </el-form-item>
        <el-form-item label="经度" prop="longitude">
          <el-input v-model="locationForm.longitude" placeholder="输入经度，例如：116.407526" />
        </el-form-item>
        <el-form-item label="纬度" prop="latitude">
          <el-input v-model="locationForm.latitude" placeholder="输入纬度，例如：39.904030" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitLocationForm" :loading="dialogLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Locations',
  setup() {
    // 数据状态
    const loading = ref(false)
    const locations = ref([])
    const provinces = ref([])
    const cities = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const searchForm = reactive({
      province: '',
      city: ''
    })

    // 添加/编辑状态
    const dialogVisible = ref(false)
    const dialogType = ref('add') // 'add' 或 'edit'
    const dialogLoading = ref(false)
    const locationFormRef = ref(null)
    const locationForm = reactive({
      id: null,
      province: '',
      city: '',
      longitude: '',
      latitude: ''
    })
    const locationRules = {
      province: [{ required: true, message: '请选择省份', trigger: 'change' }],
      city: [{ required: true, message: '请输入城市名称', trigger: 'blur' }],
      longitude: [
        { required: true, message: '请输入经度', trigger: 'blur' },
        { pattern: /^-?((1[0-7]\d)|([1-9]?\d))(\.\d+)?$/, message: '请输入有效的经度(-180~180)', trigger: 'blur' }
      ],
      latitude: [
        { required: true, message: '请输入纬度', trigger: 'blur' },
        { pattern: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/, message: '请输入有效的纬度(-90~90)', trigger: 'blur' }
      ]
    }

    // 过滤后的位置列表
    const filteredLocations = computed(() => {
      return locations.value.filter(item => {
        const matchProvince = !searchForm.province || item.province === searchForm.province
        const matchCity = !searchForm.city || item.city === searchForm.city
        return matchProvince && matchCity
      })
    })

    // 分页后的数据
    const paginatedLocations = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredLocations.value.slice(start, end)
    })

    // 加载位置数据
    const fetchLocations = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/locations/all', {
          params: {
            page: 0,
            size: 1000 // 获取较大数量的位置，前端分页
          }
        })
        if (response.data.code === 200) {
          locations.value = response.data.data.content
        } else {
          ElMessage.error(response.data.message || '获取位置列表失败')
        }
      } catch (error) {
        console.error('加载位置数据失败:', error)
        ElMessage.error('加载位置数据失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 加载所有省份
    const fetchProvinces = async () => {
      try {
        const response = await axios.get('/api/locations/provinces')
        if (response.data.code === 200) {
          provinces.value = response.data.data
        } else {
          ElMessage.error(response.data.message || '获取省份列表失败')
        }
      } catch (error) {
        console.error('加载省份数据失败:', error)
        ElMessage.error('加载省份数据失败，请稍后重试')
      }
    }

    // 根据省份加载城市列表
    const fetchCities = async (province) => {
      if (!province) {
        cities.value = []
        return
      }
      
      try {
        const response = await axios.get(`/api/locations/cities?province=${encodeURIComponent(province)}`)
        if (response.data.code === 200) {
          cities.value = response.data.data
        } else {
          ElMessage.error(response.data.message || '获取城市列表失败')
        }
      } catch (error) {
        console.error('加载城市数据失败:', error)
        ElMessage.error('加载城市数据失败，请稍后重试')
      }
    }

    // 搜索表单相关
    const handleProvinceChange = (val) => {
      searchForm.city = ''
      fetchCities(val)
    }
    
    const handleSearch = () => {
      currentPage.value = 1 // 搜索时重置到第一页
    }
    
    const resetSearch = () => {
      searchForm.province = ''
      searchForm.city = ''
      cities.value = []
      currentPage.value = 1
    }

    // 分页相关
    const handleSizeChange = (val) => {
      pageSize.value = val
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    // 添加/编辑表单相关
    const handleFormProvinceChange = (val) => {
      locationForm.city = ''
    }
    
    const resetLocationForm = () => {
      if (locationFormRef.value) {
        locationFormRef.value.resetFields()
      }
      locationForm.id = null
      locationForm.province = ''
      locationForm.city = ''
      locationForm.longitude = ''
      locationForm.latitude = ''
    }

    // 添加位置
    const handleAdd = () => {
      dialogType.value = 'add'
      resetLocationForm()
      dialogVisible.value = true
    }

    // 编辑位置
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      resetLocationForm()
      
      // 填充表单数据
      Object.keys(locationForm).forEach(key => {
        if (key in row) {
          locationForm[key] = row[key]
        }
      })
      
      dialogVisible.value = true
    }

    // 提交表单
    const submitLocationForm = () => {
      locationFormRef.value.validate(async (valid) => {
        if (!valid) return
        
        dialogLoading.value = true
        try {
          let response
          if (dialogType.value === 'add') {
            // 添加位置
            response = await axios.post('/api/locations', {
              province: locationForm.province,
              city: locationForm.city,
              longitude: locationForm.longitude,
              latitude: locationForm.latitude
            })
          } else {
            // 更新位置
            response = await axios.put(`/api/locations/${locationForm.id}`, {
              province: locationForm.province,
              city: locationForm.city,
              longitude: locationForm.longitude,
              latitude: locationForm.latitude
            })
          }
          
          if (response.data.code === 200) {
            ElMessage.success(dialogType.value === 'add' ? '添加位置成功' : '更新位置成功')
            dialogVisible.value = false
            fetchLocations() // 刷新位置列表
          } else {
            ElMessage.error(response.data.message || (dialogType.value === 'add' ? '添加位置失败' : '更新位置失败'))
          }
        } catch (error) {
          console.error(dialogType.value === 'add' ? '添加位置失败:' : '更新位置失败:', error)
          ElMessage.error('网络错误，请稍后重试')
        } finally {
          dialogLoading.value = false
        }
      })
    }

    // 删除位置
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除"${row.province}${row.city}"吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await axios.delete(`/api/locations/${row.id}`)
          if (response.data.code === 200) {
            ElMessage.success('删除成功')
            fetchLocations() // 刷新位置列表
          } else {
            ElMessage.error(response.data.message || '删除失败')
          }
        } catch (error) {
          console.error('删除位置失败:', error)
          ElMessage.error('网络错误，请稍后重试')
        }
      }).catch(() => {
        // 用户取消删除
      })
    }

    // 页面加载时获取数据
    onMounted(() => {
      fetchLocations()
      fetchProvinces()
    })

    return {
      // 数据
      loading,
      locations,
      provinces,
      cities,
      currentPage,
      pageSize,
      searchForm,
      filteredLocations,
      paginatedLocations,
      
      // 搜索相关
      handleProvinceChange,
      handleSearch,
      resetSearch,
      
      // 分页相关
      handleSizeChange,
      handleCurrentChange,
      
      // 对话框相关
      dialogVisible,
      dialogType,
      dialogLoading,
      locationFormRef,
      locationForm,
      locationRules,
      handleFormProvinceChange,
      
      // 操作相关
      handleAdd,
      handleEdit,
      submitLocationForm,
      handleDelete
    }
  }
}
</script>

<style scoped>
.locations-container {
  padding: 20px;
}

.locations-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 15px 20px;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-title i {
  margin-right: 8px;
  font-size: 20px;
  color: #409EFF;
}

.search-container {
  padding: 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

.search-select {
  width: 180px;
}

.table-container {
  padding: 0 20px 20px 20px;
}

.location-table {
  margin-top: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.location-table :deep(.el-table__header) {
  width: 100% !important;
}

.location-table :deep(.el-table__header-wrapper table) {
  width: 100% !important;
}

.location-table :deep(.el-table__body) {
  width: 100% !important;
}

.location-table :deep(.el-table__body-wrapper table) {
  width: 100% !important;
}

.location-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.location-form {
  padding: 10px 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-select {
    width: 150px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-header button {
    align-self: flex-end;
  }
}

/* 确保按钮中的文字居中 */
.text-center-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 应用到所有按钮 */
:deep(.el-button) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style> 