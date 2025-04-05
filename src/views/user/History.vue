<template>
  <div class="history-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>历史数据查询</span>
        </div>
      </template>
      <div class="content">
        <el-form :inline="true" :model="queryForm" class="query-form">
          <el-form-item label="省份">
            <el-select v-model="queryForm.province" placeholder="请选择省份" @change="handleProvinceChange" style="width: 180px">
              <el-option v-for="province in provinces" :key="province" :label="province" :value="province"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="城市">
            <el-select v-model="queryForm.city" placeholder="请选择城市" @change="handleCityChange" :disabled="!queryForm.province" style="width: 180px">
              <el-option v-for="city in cities" :key="city.id" :label="city.city" :value="city.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DDTHH:mm:ss"
              :shortcuts="dateShortcuts"
              :disabledDate="disabledDate"
              style="width: 350px"
            >
              <template #range-separator>
                <el-icon><ArrowRight /></el-icon>
              </template>
              <template #default="{ visible }">
                <div v-if="visible" class="el-picker-panel__footer">
                  <span class="el-picker-panel__footer-note">注：最长可选择30天时间范围</span>
                </div>
              </template>
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryData" :disabled="!queryForm.city || !queryForm.dateRange">查询</el-button>
          </el-form-item>
        </el-form>

        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="historyData.length > 0" class="data-container">
          <el-tabs v-model="activeTab" class="main-tabs">
            <el-tab-pane label="总览表" name="overview">
              <el-table :data="historyData" stripe style="width: 100%" height="450" class="data-table">
                <el-table-column prop="dateTime" label="日期时间" width="160">
                  <template #default="scope">
                    {{ formatDateTime(scope.row.dateTime) }}
                  </template>
                </el-table-column>
                <el-table-column prop="aqi" label="AQI" width="80">
                  <template #default="scope">
                    <span :style="getAQIStyle(scope.row.aqi)">{{ scope.row.aqi }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="aqiLevel" label="空气质量等级" width="120">
                  <template #default="scope">
                    <el-tag :type="getAQILevelType(scope.row.aqiLevel)">{{ scope.row.aqiLevel }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pm25" label="PM2.5 (μg/m³)" width="120"></el-table-column>
                <el-table-column prop="pm10" label="PM10 (μg/m³)" width="120"></el-table-column>
                <el-table-column prop="o3" label="O3 (μg/m³)" width="100"></el-table-column>
                <el-table-column prop="no2" label="NO2 (μg/m³)" width="100"></el-table-column>
                <el-table-column prop="so2" label="SO2 (μg/m³)" width="100"></el-table-column>
                <el-table-column prop="co" label="CO (mg/m³)" width="100"></el-table-column>
                <el-table-column prop="no" label="NO (μg/m³)" width="100"></el-table-column>
                <el-table-column prop="nh3" label="NH3 (μg/m³)" width="100"></el-table-column>
                <el-table-column prop="healthRecommendation" label="健康建议" min-width="200"></el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="详细趋势" name="details">
              <el-tabs v-model="activeChart" class="chart-tabs">
                <el-tab-pane label="AQI趋势" name="aqi">
                  <div class="chart-description">
                    <p>空气质量指数（AQI）变化趋势图，展示了所选时间段内AQI的变化情况。</p>
                    <p>参考标准：0-50优，51-100良，101-150轻度污染，151-200中度污染，201-300重度污染，>300严重污染</p>
                  </div>
                  <div ref="aqiChart" class="chart"></div>
                </el-tab-pane>
                <el-tab-pane label="PM2.5趋势" name="pm25">
                  <div class="chart-description">
                    <p>PM2.5（细颗粒物）浓度变化趋势图，单位：μg/m³</p>
                    <p>参考标准：24小时平均浓度限值35μg/m³（WHO标准）</p>
                  </div>
                  <div ref="pm25Chart" class="chart"></div>
                </el-tab-pane>
                <el-tab-pane label="PM10趋势" name="pm10">
                  <div class="chart-description">
                    <p>PM10（可吸入颗粒物）浓度变化趋势图，单位：μg/m³</p>
                    <p>参考标准：24小时平均浓度限值50μg/m³（WHO标准）</p>
                  </div>
                  <div ref="pm10Chart" class="chart"></div>
                </el-tab-pane>
                <el-tab-pane label="气体污染物" name="gases">
                  <div class="chart-description">
                    <p>主要气体污染物（O3、NO2、SO2、CO）浓度变化趋势图</p>
                  </div>
                  <div ref="gasesChart" class="chart"></div>
                </el-tab-pane>
              </el-tabs>
            </el-tab-pane>
          </el-tabs>
        </div>
        
        <el-empty v-else description="暂无数据" :image-size="200"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch, onUnmounted } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import 'dayjs/locale/zh-cn'
import { ArrowRight } from '@element-plus/icons-vue'

export default {
  name: 'History',
  setup() {
    const queryForm = reactive({
      province: '',
      city: '',
      dateRange: null,
      locationId: null
    })
    
    const provinces = ref([])
    const cities = ref([])
    const historyData = ref([])
    const loading = ref(false)
    const activeTab = ref('overview')
    const activeChart = ref('aqi')
    
    const aqiChart = ref(null)
    const pm25Chart = ref(null)
    const pm10Chart = ref(null)
    const gasesChart = ref(null)
    
    let aqiChartInstance = null
    let pm25ChartInstance = null
    let pm10ChartInstance = null
    let gasesChartInstance = null

    const dateShortcuts = [
      {
        text: '最近一周',
        value: () => {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
          return [start, end]
        },
      },
      {
        text: '最近一个月',
        value: () => {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
          return [start, end]
        },
      }
    ]

    const disabledDate = (time) => {
      // 限制最早日期为2020年12月31日，最晚日期为当前日期
      if (time.getTime() > Date.now() || time.getTime() < new Date('2020-12-31').getTime()) {
        return true
      }
      
      // 如果已经选择了开始时间，则限制结束时间不能超过开始时间30天
      if (queryForm.dateRange && queryForm.dateRange[0]) {
        const startTime = new Date(queryForm.dateRange[0])
        const endTime = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (time.getTime() > endTime.getTime()) {
          return true
        }
      }
      
      // 如果已经选择了结束时间，则限制开始时间不能早于结束时间30天
      if (queryForm.dateRange && queryForm.dateRange[1]) {
        const endTime = new Date(queryForm.dateRange[1])
        const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (time.getTime() < startTime.getTime()) {
          return true
        }
      }
      
      return false
    }

    const getProvinces = async () => {
      try {
        const response = await axios.get('/api/locations/provinces')
        if (response.data.code === 200) {
          provinces.value = response.data.data
        }
      } catch (error) {
        console.error('获取省份失败:', error)
      }
    }

    const getCities = async (province) => {
      try {
        const response = await axios.get(`/api/locations/cities?province=${province}`)
        if (response.data.code === 200) {
          cities.value = response.data.data
        }
      } catch (error) {
        console.error('获取城市失败:', error)
      }
    }

    const handleProvinceChange = (val) => {
      queryForm.city = ''
      queryForm.locationId = null
      if (val) {
        getCities(val)
      } else {
        cities.value = []
      }
    }

    const handleCityChange = (val) => {
      queryForm.locationId = val
    }

    const queryData = async () => {
      if (!queryForm.locationId || !queryForm.dateRange || queryForm.dateRange.length !== 2) {
        return
      }

      loading.value = true
      historyData.value = []

      try {
        const [startTime, endTime] = queryForm.dateRange
        const response = await axios.get(`/api/air-quality/historical/${queryForm.locationId}`, {
          params: {
            startTime,
            endTime
          }
        })

        if (response.data.code === 200) {
          historyData.value = response.data.data
          // 如果当前在详细趋势标签页，则初始化图表
          if (activeTab.value === 'details') {
            nextTick(() => {
              initCharts()
            })
          }
        }
      } catch (error) {
        console.error('获取历史数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    const initCharts = () => {
      nextTick(() => {
        // 初始化AQI图表
        if (aqiChartInstance) {
          aqiChartInstance.dispose()
        }
        if (aqiChart.value) {
          aqiChartInstance = echarts.init(aqiChart.value)
          
          const timeData = historyData.value.map(item => formatDateTime(item.dateTime))
          const aqiData = historyData.value.map(item => item.aqi)
          
          aqiChartInstance.setOption({
            title: {
              text: 'AQI趋势变化'
            },
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: timeData,
              axisLabel: {
                rotate: 45
              }
            },
            yAxis: {
              type: 'value',
              name: 'AQI'
            },
            series: [{
              name: 'AQI',
              type: 'line',
              data: aqiData.length > 0 ? aqiData : [],
              smooth: true,
              areaStyle: {
                opacity: 0.3
              }
            }]
          })

          if (aqiData.length === 0) {
            aqiChartInstance.setOption({
              graphic: {
                elements: [{
                  type: 'text',
                  left: 'center',
                  top: 'middle',
                  style: {
                    text: '暂无数据',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                  }
                }]
              }
            })
          }
        }
        
        // 初始化PM2.5图表
        if (pm25ChartInstance) {
          pm25ChartInstance.dispose()
        }
        if (pm25Chart.value) {
          pm25ChartInstance = echarts.init(pm25Chart.value)
          
          const timeData = historyData.value.map(item => formatDateTime(item.dateTime))
          const pm25Data = historyData.value.map(item => item.pm25)
          
          pm25ChartInstance.setOption({
            title: {
              text: 'PM2.5趋势变化'
            },
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: timeData,
              axisLabel: {
                rotate: 45
              }
            },
            yAxis: {
              type: 'value',
              name: 'PM2.5 (μg/m³)'
            },
            series: [{
              name: 'PM2.5',
              type: 'line',
              data: pm25Data.length > 0 ? pm25Data : [],
              smooth: true,
              areaStyle: {
                opacity: 0.3
              }
            }]
          })

          if (pm25Data.length === 0) {
            pm25ChartInstance.setOption({
              graphic: {
                elements: [{
                  type: 'text',
                  left: 'center',
                  top: 'middle',
                  style: {
                    text: '暂无数据',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                  }
                }]
              }
            })
          }
        }
        
        // 初始化PM10图表
        if (pm10ChartInstance) {
          pm10ChartInstance.dispose()
        }
        if (pm10Chart.value) {
          pm10ChartInstance = echarts.init(pm10Chart.value)
          
          const timeData = historyData.value.map(item => formatDateTime(item.dateTime))
          const pm10Data = historyData.value.map(item => item.pm10)
          
          pm10ChartInstance.setOption({
            title: {
              text: 'PM10趋势变化'
            },
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: timeData,
              axisLabel: {
                rotate: 45
              }
            },
            yAxis: {
              type: 'value',
              name: 'PM10 (μg/m³)'
            },
            series: [{
              name: 'PM10',
              type: 'line',
              data: pm10Data.length > 0 ? pm10Data : [],
              smooth: true,
              areaStyle: {
                opacity: 0.3
              }
            }]
          })

          if (pm10Data.length === 0) {
            pm10ChartInstance.setOption({
              graphic: {
                elements: [{
                  type: 'text',
                  left: 'center',
                  top: 'middle',
                  style: {
                    text: '暂无数据',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                  }
                }]
              }
            })
          }
        }
        
        // 初始化气体污染物图表
        if (gasesChartInstance) {
          gasesChartInstance.dispose()
        }
        if (gasesChart.value) {
          gasesChartInstance = echarts.init(gasesChart.value)
          
          const timeData = historyData.value.map(item => formatDateTime(item.dateTime))
          const o3Data = historyData.value.map(item => item.o3)
          const no2Data = historyData.value.map(item => item.no2)
          const so2Data = historyData.value.map(item => item.so2)
          const coData = historyData.value.map(item => item.co)
          
          gasesChartInstance.setOption({
            title: {
              text: '气体污染物浓度变化趋势图'
            },
            tooltip: {
              trigger: 'axis'
            },
            xAxis: {
              type: 'category',
              data: timeData,
              axisLabel: {
                rotate: 45
              }
            },
            yAxis: {
              type: 'value',
              name: '浓度'
            },
            series: [
              {
                name: 'O3',
                type: 'line',
                data: o3Data.length > 0 ? o3Data : [],
                smooth: true,
                areaStyle: {
                  opacity: 0.1
                }
              },
              {
                name: 'NO2',
                type: 'line',
                data: no2Data.length > 0 ? no2Data : [],
                smooth: true,
                areaStyle: {
                  opacity: 0.1
                }
              },
              {
                name: 'SO2',
                type: 'line',
                data: so2Data.length > 0 ? so2Data : [],
                smooth: true,
                areaStyle: {
                  opacity: 0.1
                }
              },
              {
                name: 'CO',
                type: 'line',
                data: coData.length > 0 ? coData : [],
                smooth: true,
                areaStyle: {
                  opacity: 0.1
                }
              }
            ]
          })

          if (timeData.length === 0) {
            gasesChartInstance.setOption({
              graphic: {
                elements: [{
                  type: 'text',
                  left: 'center',
                  top: 'middle',
                  style: {
                    text: '暂无数据',
                    fill: '#999',
                    font: '14px Microsoft YaHei'
                  }
                }]
              }
            })
          }
        }
      })
    }

    // 监听窗口大小变化，重新渲染图表
    const handleResize = () => {
      nextTick(() => {
        if (aqiChartInstance && aqiChart.value) aqiChartInstance.resize()
        if (pm25ChartInstance && pm25Chart.value) pm25ChartInstance.resize()
        if (pm10ChartInstance && pm10Chart.value) pm10ChartInstance.resize()
        if (gasesChartInstance && gasesChart.value) gasesChartInstance.resize()
      })
    }

    // 监听activeTab变化，切换到详细趋势时初始化图表
    watch(activeTab, (newValue) => {
      if (newValue === 'details' && historyData.value.length > 0) {
        nextTick(() => {
          initCharts()
        })
      }
    })

    // 监听activeChart变化，确保图表渲染
    watch(activeChart, () => {
      if (activeTab.value === 'details' && historyData.value.length > 0) {
        nextTick(() => {
          handleResize()
        })
      }
    })

    const getAQIStyle = (aqi) => {
      if (aqi <= 50) return { color: '#4caf50' }  // 优
      if (aqi <= 100) return { color: '#ffeb3b' }  // 良
      if (aqi <= 150) return { color: '#ff9800' }  // 轻度污染
      if (aqi <= 200) return { color: '#f44336' }  // 中度污染
      if (aqi <= 300) return { color: '#9c27b0' }  // 重度污染
      return { color: '#7e0023' }  // 严重污染
    }

    const getAQILevelType = (level) => {
      switch (level) {
        case '优': return 'success'
        case '良': return 'warning'
        case '轻度污染': return ''
        case '中度污染': return 'danger'
        case '重度污染': return 'danger'
        case '严重污染': return 'danger'
        default: return 'info'
      }
    }

    onMounted(() => {
      getProvinces()
      window.addEventListener('resize', handleResize)
    })

    // 组件卸载时清理图表实例
    onUnmounted(() => {
      if (aqiChartInstance) {
        aqiChartInstance.dispose()
        aqiChartInstance = null
      }
      if (pm25ChartInstance) {
        pm25ChartInstance.dispose()
        pm25ChartInstance = null
      }
      if (pm10ChartInstance) {
        pm10ChartInstance.dispose()
        pm10ChartInstance = null
      }
      if (gasesChartInstance) {
        gasesChartInstance.dispose()
        gasesChartInstance = null
      }
      window.removeEventListener('resize', handleResize)
    })

    return {
      queryForm,
      provinces,
      cities,
      historyData,
      loading,
      activeTab,
      activeChart,
      aqiChart,
      pm25Chart,
      pm10Chart,
      gasesChart,
      handleProvinceChange,
      handleCityChange,
      queryData,
      formatDateTime,
      dateShortcuts,
      disabledDate,
      getAQIStyle,
      getAQILevelType,
      ArrowRight
    }
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding: 20px 0;
}

.query-form {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
}

.main-tabs {
  margin-top: 20px;
}

.chart-tabs {
  margin-top: 10px;
}

.chart-description {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.chart-description p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.chart {
  height: 400px;
  margin: 10px 0;
}

.data-table {
  margin-top: 20px;
}

.loading-container {
  padding: 40px;
}

.el-picker-panel__footer-note {
  color: #909399;
  font-size: 12px;
  padding: 0 12px;
}
</style> 