<template>
  <div class="realtime-container">
    <el-card class="location-card">
      <template #header>
        <div class="card-header">
          <span>选择位置</span>
        </div>
      </template>
      <div class="location-select">
        <el-row :gutter="20" class="location-row">
          <el-col :xs="24" :sm="10" :md="8" :lg="6">
            <el-select 
              v-model="selectedProvince" 
              placeholder="请选择省份" 
              @change="handleProvinceChange"
              class="province-select">
              <el-option
                v-for="province in provinces"
                :key="province"
                :label="province"
                :value="province"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="10" :md="8" :lg="6">
            <el-select 
              v-model="selectedCity" 
              placeholder="请选择城市" 
              @change="handleCityChange"
              :disabled="!selectedProvince"
              class="city-select">
              <el-option
                v-for="city in cities"
                :key="city.id"
                :label="city.city"
                :value="city.id"
              />
            </el-select>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card v-loading="loading" class="mt-20" v-if="selectedCity">
      <template #header>
        <div class="card-header">
          <span>实时空气质量</span>
          <el-button type="primary" size="small" plain @click="refreshData">刷新数据</el-button>
        </div>
      </template>
      <div class="content" v-if="airQualityData">
        <div class="air-quality-overview">
          <div class="aqi-box">
            <div class="aqi-value">{{ airQualityData.aqi }}</div>
            <div :class="['aqi-level', getAQILevelClass(airQualityData.aqi)]">
              {{ airQualityData.aqiLevel }}
            </div>
            <div class="update-time">更新时间: {{ formatDateTime(airQualityData.dateTime) }}</div>
          </div>

          <div class="health-recommendation">
            <h3>健康建议</h3>
            <p>{{ airQualityData.healthRecommendation }}</p>
          </div>
        </div>

        <el-divider />

        <h3>空气质量详细指标</h3>
        <el-row :gutter="20" class="air-quality-details">
          <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="(value, key) in pollutants" :key="key">
            <div class="pollutant-item">
              <div class="pollutant-name">{{ pollutantLabels[key] || key }}</div>
              <div class="pollutant-value">{{ airQualityData[key] }}</div>
              <div class="pollutant-unit">{{ pollutantUnits[key] }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      <el-empty v-else description="暂无数据" />
    </el-card>

    <el-empty v-if="!selectedCity" description="请选择位置查看实时空气质量数据" />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  name: 'Realtime',
  setup() {
    const selectedProvince = ref(null)
    const selectedCity = ref(null)
    const provinces = ref([])
    const cities = ref([])
    const airQualityData = ref(null)
    const loading = ref(false)

    // 定义污染物名称和单位映射
    const pollutantLabels = {
      pm25: 'PM2.5',
      pm10: 'PM10',
      co: 'CO',
      no: 'NO',
      no2: 'NO₂',
      o3: 'O₃',
      so2: 'SO₂',
      nh3: 'NH₃'
    }

    const pollutantUnits = {
      pm25: 'μg/m³',
      pm10: 'μg/m³',
      co: 'mg/m³',
      no: 'μg/m³',
      no2: 'μg/m³',
      o3: 'μg/m³',
      so2: 'μg/m³',
      nh3: 'μg/m³'
    }

    const pollutants = {
      pm25: null,
      pm10: null,
      co: null,
      no: null,
      no2: null,
      o3: null,
      so2: null,
      nh3: null
    }

    // 加载省份数据
    const loadProvinces = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/locations/provinces')
        if (response.data && response.data.data) {
          provinces.value = response.data.data
        } else {
          ElMessage.error('省份数据格式不正确')
        }
      } catch (error) {
        console.error('加载省份数据失败', error)
        ElMessage.error('加载省份数据失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 处理省份变化
    const handleProvinceChange = async () => {
      selectedCity.value = null
      cities.value = []
      
      if (!selectedProvince.value) return
      
      loading.value = true
      try {
        const response = await axios.get(`/api/locations/cities?province=${encodeURIComponent(selectedProvince.value)}`)
        if (response.data && response.data.data) {
          cities.value = response.data.data
        } else {
          ElMessage.error('城市数据格式不正确')
        }
      } catch (error) {
        console.error('加载城市数据失败', error)
        ElMessage.error('加载城市数据失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 处理城市变化
    const handleCityChange = () => {
      if (selectedCity.value) {
        loadAirQualityData()
      }
    }

    // 加载空气质量数据
    const loadAirQualityData = async () => {
      if (!selectedCity.value) return
      
      loading.value = true
      try {
        // 使用API: 获取当前空气质量
        const response = await axios.get(`/api/air-quality/current/${selectedCity.value}`)
        
        if (response.data && response.data.data) {
          airQualityData.value = response.data.data
        } else {
          ElMessage.error('获取空气质量数据失败')
          airQualityData.value = null
        }
      } catch (error) {
        console.error('加载空气质量数据失败', error)
        ElMessage.error('获取空气质量数据失败，请稍后重试')
        airQualityData.value = null
      } finally {
        loading.value = false
      }
    }

    // 刷新数据
    const refreshData = () => {
      loadAirQualityData()
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`
    }

    const padZero = (num) => {
      return num < 10 ? `0${num}` : num
    }

    // 根据AQI值获取对应的CSS类名
    const getAQILevelClass = (aqi) => {
      if (aqi <= 50) return 'level-good'
      if (aqi <= 100) return 'level-moderate'
      if (aqi <= 150) return 'level-unhealthy-sensitive'
      if (aqi <= 200) return 'level-unhealthy'
      if (aqi <= 300) return 'level-very-unhealthy'
      return 'level-hazardous'
    }

    onMounted(() => {
      loadProvinces()
    })

    return {
      selectedProvince,
      selectedCity,
      provinces,
      cities,
      airQualityData,
      loading,
      pollutantLabels,
      pollutantUnits,
      pollutants,
      loadAirQualityData,
      refreshData,
      formatDateTime,
      getAQILevelClass,
      handleProvinceChange,
      handleCityChange
    }
  }
}
</script>

<style scoped>
.realtime-container {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.location-select {
  width: 100%;
  padding: 10px 0;
}

.location-row {
  display: flex;
  justify-content: center;
}

.province-select,
.city-select {
  width: 100%;
  margin-bottom: 10px;
}

@media screen and (max-width: 768px) {
  .location-row {
    flex-direction: column;
  }
}

.air-quality-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.aqi-box {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  min-width: 200px;
}

.aqi-value {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 5px;
}

.aqi-level {
  font-size: 20px;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.level-good {
  background-color: #67C23A;
  color: white;
}

.level-moderate {
  background-color: #E6A23C;
  color: white;
}

.level-unhealthy-sensitive {
  background-color: #F56C6C;
  color: white;
}

.level-unhealthy {
  background-color: #F56C6C;
  color: white;
}

.level-very-unhealthy {
  background-color: #800080;
  color: white;
}

.level-hazardous {
  background-color: #7B0000;
  color: white;
}

.update-time {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.health-recommendation {
  flex: 1;
  background-color: #ecf5ff;
  padding: 15px;
  border-radius: 8px;
  min-width: 300px;
}

.health-recommendation h3 {
  color: #409EFF;
  margin-top: 0;
  margin-bottom: 10px;
}

.health-recommendation p {
  margin: 0;
  line-height: 1.6;
}

.air-quality-details {
  margin-top: 20px;
}

.pollutant-item {
  text-align: center;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.pollutant-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.pollutant-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.pollutant-unit {
  font-size: 12px;
  color: #909399;
}
</style> 