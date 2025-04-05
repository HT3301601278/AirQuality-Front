<template>
  <div class="forecast-container">
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
              @change="loadForecastData"
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
          <span>空气质量预报</span>
          <el-button type="primary" size="small" plain @click="loadForecastData">刷新数据</el-button>
        </div>
      </template>
      
      <div v-if="error" class="error-message">
        <el-alert
          :title="error"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      
      <div v-else-if="!forecastData.length" class="empty-data">
        <el-empty description="暂无预报数据" />
      </div>
      
      <div v-else class="forecast-content">
        <el-tabs type="border-card">
          <el-tab-pane label="列表视图">
            <div class="data-table">
              <el-table :data="forecastData" stripe style="width: 100%">
                <el-table-column prop="dateTime" label="预报时间" width="180">
                  <template #default="scope">
                    {{ formatDateTime(scope.row.dateTime) }}
                  </template>
                </el-table-column>
                <el-table-column prop="aqi" label="AQI" width="100" sortable />
                <el-table-column prop="aqiLevel" label="空气质量等级" width="120">
                  <template #default="scope">
                    <el-tag :type="getAqiLevelType(scope.row.aqiLevel)">{{ scope.row.aqiLevel }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pm25" label="PM2.5" width="100" sortable />
                <el-table-column prop="pm10" label="PM10" width="100" sortable />
                <el-table-column prop="o3" label="O3" width="100" sortable />
                <el-table-column prop="healthRecommendation" label="健康建议" min-width="250" show-overflow-tooltip />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="图表视图">
            <div class="chart-container" ref="chartContainer">
              <div class="chart-controls">
                <div class="chart-type-selection">
                  <el-radio-group v-model="chartType" @change="initChart" size="small">
                    <el-radio-button label="line">折线图</el-radio-button>
                    <el-radio-button label="bar">柱状图</el-radio-button>
                    <el-radio-button label="area">面积图</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              
              <div class="metrics-selection">
                <el-button type="primary" size="small" plain @click="toggleAllMetrics" class="select-all-btn">
                  {{ isAllMetricsSelected ? '取消全选' : '全选' }}
                </el-button>
                <el-checkbox-group v-model="selectedMetrics" @change="initChart" size="small" class="metrics-group">
                  <el-checkbox label="aqi">AQI</el-checkbox>
                  <el-checkbox label="pm25">PM2.5</el-checkbox>
                  <el-checkbox label="pm10">PM10</el-checkbox>
                  <el-checkbox label="o3">O3</el-checkbox>
                  <el-checkbox label="co">CO</el-checkbox>
                  <el-checkbox label="no">NO</el-checkbox>
                  <el-checkbox label="no2">NO2</el-checkbox>
                  <el-checkbox label="so2">SO2</el-checkbox>
                  <el-checkbox label="nh3">NH3</el-checkbox>
                </el-checkbox-group>
              </div>
                
              <div id="airQualityChart" style="width: 100%; height: 500px;"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <el-empty v-if="!selectedCity" description="请选择位置查看空气质量预报数据" />
  </div>
</template>

<script>
export default {
  name: 'Forecast'
}
</script>

<script setup>
import { ref, onMounted, nextTick, watch, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const provinces = ref([])
const cities = ref([])
const selectedProvince = ref(null)
const selectedCity = ref(null)
const forecastData = ref([])
const loading = ref(false)
const error = ref('')
const chartInstance = ref(null)
const chartType = ref('line')
const selectedMetrics = ref(['aqi', 'pm25', 'pm10', 'o3'])
const allMetrics = ['aqi', 'pm25', 'pm10', 'o3', 'co', 'no', 'no2', 'so2', 'nh3']
const chartDom = ref(null)

// 计算是否所有指标都被选中
const isAllMetricsSelected = computed(() => {
  return selectedMetrics.value.length === allMetrics.length
})

// 全选/取消全选
const toggleAllMetrics = () => {
  if (isAllMetricsSelected.value) {
    selectedMetrics.value = []
  } else {
    selectedMetrics.value = [...allMetrics]
  }
}

const loadProvinces = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/locations/provinces')
    if (response.data && response.data.data) {
      provinces.value = response.data.data
    } else {
      ElMessage.error('省份数据格式不正确')
    }
  } catch (err) {
    error.value = err.message || '加载省份数据失败'
    console.error('加载省份列表出错:', err)
    ElMessage.error('加载省份数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleProvinceChange = async () => {
  selectedCity.value = null
  forecastData.value = []
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
  } catch (err) {
    error.value = err.message || '加载城市数据失败'
    console.error('加载城市列表出错:', err)
    ElMessage.error('加载城市数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadForecastData = async () => {
  if (!selectedCity.value) return
  
  loading.value = true
  error.value = ''
  destroyChart() // 先销毁图表
  
  try {
    const response = await axios.get(`/api/air-quality/forecast/${selectedCity.value}`)
    if (response.data.code === 200) {
      forecastData.value = response.data.data
    } else {
      throw new Error(response.data.message || '加载预报数据失败')
    }
  } catch (err) {
    error.value = err.message || '加载预报数据失败'
    console.error('加载空气质量预报数据出错:', err)
    forecastData.value = []
    ElMessage.error('获取预报数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
}

const padZero = (num) => {
  return num < 10 ? `0${num}` : num
}

const getAqiLevelType = (level) => {
  switch (level) {
    case '优': return 'success'
    case '良': return 'warning'
    case '轻度污染': return 'danger'
    case '中度污染': return 'danger'
    case '重度污染': return 'danger'
    case '严重污染': return 'danger'
    default: return 'info'
  }
}

// 监听数据变化，更新图表
watch(forecastData, () => {
  nextTick(() => {
    if (forecastData.value && forecastData.value.length > 0) {
      destroyChart()
      nextTick(() => {
        initChart()
      })
    }
  })
}, { deep: true })

// 监听图表类型变化
watch(chartType, () => {
  nextTick(() => {
    destroyChart()
    nextTick(() => {
      initChart()
    })
  })
})

// 监听选中指标变化
watch(selectedMetrics, () => {
  nextTick(() => {
    destroyChart()
    nextTick(() => {
      initChart()
    })
  })
}, { deep: true })

// 销毁图表实例
const destroyChart = () => {
  if (chartInstance.value) {
    try {
      chartInstance.value.dispose()
    } catch (e) {
      console.error('销毁图表实例时出错:', e)
    }
    chartInstance.value = null
  }
}

// 初始化图表
const initChart = () => {
  if (!forecastData.value || forecastData.value.length === 0 || !selectedMetrics.value || selectedMetrics.value.length === 0) {
    console.warn('数据或指标不足，跳过图表初始化')
    return
  }
  
  // 确保先销毁旧实例
  destroyChart()
  
  // 获取DOM元素
  const chartDomElement = document.getElementById('airQualityChart')
  if (!chartDomElement) {
    console.error('找不到图表容器元素')
    return
  }
  
  try {
    // 创建图表实例
    chartInstance.value = echarts.init(chartDomElement)
    
    // 准备数据
    const timeData = []
    const seriesData = {}
    const validMetrics = []
    
    // 预处理数据，确保所有数据有效
    selectedMetrics.value.forEach(metric => {
      if (forecastData.value[0] && forecastData.value[0][metric] !== undefined) {
        validMetrics.push(metric)
        seriesData[metric] = []
      }
    })
    
    if (validMetrics.length === 0) {
      console.warn('没有有效的指标可显示')
      return
    }
    
    // 构建有效数据
    forecastData.value.forEach(item => {
      try {
        // 格式化日期
        const dateStr = formatDateTime(item.dateTime)
        timeData.push(dateStr)
        
        // 收集各指标数据
        validMetrics.forEach(metric => {
          const value = item[metric]
          seriesData[metric].push(value !== undefined && value !== null ? Number(value) : null)
        })
      } catch (e) {
        console.error('处理数据项时出错:', e)
      }
    })
    
    // 指标名称映射
    const metricsMap = {
      aqi: { name: 'AQI', color: '#5470c6' },
      pm25: { name: 'PM2.5', color: '#91cc75' },
      pm10: { name: 'PM10', color: '#fac858' },
      o3: { name: 'O3', color: '#ee6666' },
      co: { name: 'CO', color: '#73c0de' },
      no: { name: 'NO', color: '#3ba272' },
      no2: { name: 'NO2', color: '#fc8452' },
      so2: { name: 'SO2', color: '#9a60b4' },
      nh3: { name: 'NH3', color: '#ea7ccc' }
    }
    
    // 生成图表系列
    const series = []
    const legendData = []
    
    validMetrics.forEach(metric => {
      const metricInfo = metricsMap[metric]
      if (!metricInfo) return
      
      legendData.push(metricInfo.name)
      
      // 确定图表类型
      let type = chartType.value
      if (type === 'area') {
        type = 'line' // area是line的变种
      }
      
      const seriesItem = {
        name: metricInfo.name,
        type: type,
        data: seriesData[metric],
        itemStyle: {
          color: metricInfo.color
        }
      }
      
      // 如果是面积图，添加区域样式
      if (chartType.value === 'area') {
        seriesItem.areaStyle = {}
      }
      
      series.push(seriesItem)
    })
    
    // 简化图表配置，减少不必要的选项
    const option = {
      title: {
        text: '空气质量预报趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: legendData,
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '13%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: chartType.value === 'bar',
        data: timeData
      },
      yAxis: {
        type: 'value'
      },
      series: series
    }
    
    // 简单配置，确保渲染成功后再添加更多功能
    chartInstance.value.setOption(option, true)
    
    // 图表渲染成功后，添加更多交互功能
    nextTick(() => {
      try {
        if (chartInstance.value) {
          const fullOption = {
            ...option,
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'cross',
                label: {
                  backgroundColor: '#6a7985'
                }
              },
              formatter: function(params) {
                if (!params || params.length === 0) return ''
                
                let result = params[0].axisValue + '<br/>'
                params.forEach(param => {
                  if (param.value === null || param.value === undefined) return
                  
                  // 为不同的指标添加不同的单位
                  let unit = ''
                  if (['pm25', 'pm10', 'aqi'].includes(param.seriesName.toLowerCase())) {
                    unit = ' μg/m³'
                  } else if (['o3', 'no', 'no2', 'so2', 'nh3'].includes(param.seriesName.toLowerCase())) {
                    unit = ' ppb'
                  } else if (param.seriesName.toLowerCase() === 'co') {
                    unit = ' ppm'
                  }
                  
                  result += `<div style="display:flex;justify-content:space-between;min-width:150px">
                    <span style="margin-right:10px;display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${param.color}"></span>
                    <span style="flex:1">${param.seriesName}: </span>
                    <span style="font-weight:bold">${param.value}${unit}</span>
                  </div>`
                })
                return result
              }
            },
            toolbox: {
              feature: {
                saveAsImage: { title: '保存为图片' },
                dataZoom: {
                  yAxisIndex: 'none',
                  title: {
                    zoom: '区域缩放',
                    back: '还原缩放'
                  }
                },
                restore: { title: '还原' }
              }
            },
            dataZoom: [
              {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                start: 0,
                end: 100,
                bottom: 10
              },
              {
                type: 'inside',
                xAxisIndex: [0],
                start: 0,
                end: 100
              }
            ]
          }
          
          chartInstance.value.setOption(fullOption, false)
        }
      } catch (e) {
        console.error('设置交互选项时出错:', e)
      }
    })
  } catch (error) {
    console.error('初始化图表时出错:', error)
    ElMessage.error('图表渲染失败，请稍后重试')
    destroyChart()
  }
}

// 监听窗口大小变化，调整图表尺寸
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 在组件挂载时监听窗口大小变化
onMounted(() => {
  loadProvinces()
  window.addEventListener('resize', handleResize)
})

// 在组件卸载时移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  destroyChart()
})
</script>

<style scoped>
.forecast-container {
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

.loading-container, .empty-data, .error-message {
  padding: 40px 0;
  text-align: center;
}

.forecast-content {
  margin-top: 20px;
  width: 100%;
  overflow: hidden;
}

.el-tabs--border-card {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 600px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.chart-controls {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.chart-type-selection {
  margin-bottom: 10px;
}

.metrics-selection {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.select-all-btn {
  min-width: 80px;
}

.metrics-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

#airQualityChart {
  flex: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .location-row {
    flex-direction: column;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .metrics-selection {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .metrics-group {
    margin-top: 10px;
  }
}
</style> 