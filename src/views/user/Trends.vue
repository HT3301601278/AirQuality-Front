<template>
  <div class="trends-container">
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
          <span>近期趋势分析（最近7天）</span>
          <div class="header-controls">
            <el-radio-group v-model="chartType" size="small" @change="refreshChart">
              <el-radio-button label="line">折线图</el-radio-button>
              <el-radio-button label="area">面积图</el-radio-button>
              <el-radio-button label="bar">柱状图</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" plain @click="refreshData" style="margin-left: 10px;">刷新数据</el-button>
          </div>
        </div>
      </template>
      
      <div v-if="trendsData && trendsData.length > 0">
        <div class="chart-tabs">
          <el-tabs v-model="activeMetric">
            <el-tab-pane label="AQI指数" name="aqi">
              <div class="chart-description">
                <p>展示最近7天的空气质量指数(AQI)变化趋势</p>
              </div>
              <div ref="aqiChart" class="chart-container"></div>
            </el-tab-pane>
            <el-tab-pane label="PM2.5/PM10" name="pm">
              <div class="chart-description">
                <p>展示最近7天的PM2.5和PM10浓度变化趋势</p>
              </div>
              <div ref="pmChart" class="chart-container"></div>
            </el-tab-pane>
            <el-tab-pane label="气体污染物" name="gases">
              <div class="chart-description">
                <p>展示最近7天的主要气体污染物浓度变化趋势</p>
              </div>
              <div ref="gasesChart" class="chart-container"></div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <el-divider />

        <div class="trend-summary">
          <h3>趋势分析总结</h3>
          
          <!-- AQI趋势分析 -->
          <div v-if="activeMetric === 'aqi'">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">AQI均值</div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ aqiStats.avg.toFixed(1) }}</div>
                    <div :class="['stat-level', getAQILevelClass(aqiStats.avg)]">{{ getAQILevel(aqiStats.avg) }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">AQI最大值</div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ aqiStats.max }}</div>
                    <div :class="['stat-level', getAQILevelClass(aqiStats.max)]">{{ getAQILevel(aqiStats.max) }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">AQI最小值</div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ aqiStats.min }}</div>
                    <div :class="['stat-level', getAQILevelClass(aqiStats.min)]">{{ getAQILevel(aqiStats.min) }}</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">趋势</div>
                  </template>
                  <div class="stat-content">
                    <div class="trend-icon">
                      <el-icon v-if="aqiStats.trend === 'up'" color="#F56C6C"><ArrowUp /></el-icon>
                      <el-icon v-else-if="aqiStats.trend === 'down'" color="#67C23A"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399"><Remove /></el-icon>
                    </div>
                    <div class="trend-text">
                      {{ aqiStats.trend === 'up' ? '上升' : (aqiStats.trend === 'down' ? '下降' : '稳定') }}
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          
          <!-- PM趋势分析 -->
          <div v-else-if="activeMetric === 'pm'">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">PM2.5均值</div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ pmStats.pm25.avg.toFixed(1) }}</div>
                    <div class="stat-unit">μg/m³</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">PM10均值</div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ pmStats.pm10.avg.toFixed(1) }}</div>
                    <div class="stat-unit">μg/m³</div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">PM2.5趋势</div>
                  </template>
                  <div class="stat-content">
                    <div class="trend-icon">
                      <el-icon v-if="pmStats.pm25.trend === 'up'" color="#F56C6C"><ArrowUp /></el-icon>
                      <el-icon v-else-if="pmStats.pm25.trend === 'down'" color="#67C23A"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399"><Remove /></el-icon>
                    </div>
                    <div class="trend-text">
                      {{ pmStats.pm25.trend === 'up' ? '上升' : (pmStats.pm25.trend === 'down' ? '下降' : '稳定') }}
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">PM10趋势</div>
                  </template>
                  <div class="stat-content">
                    <div class="trend-icon">
                      <el-icon v-if="pmStats.pm10.trend === 'up'" color="#F56C6C"><ArrowUp /></el-icon>
                      <el-icon v-else-if="pmStats.pm10.trend === 'down'" color="#67C23A"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399"><Remove /></el-icon>
                    </div>
                    <div class="trend-text">
                      {{ pmStats.pm10.trend === 'up' ? '上升' : (pmStats.pm10.trend === 'down' ? '下降' : '稳定') }}
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          
          <!-- 气体污染物趋势分析 -->
          <div v-else-if="activeMetric === 'gases'">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">SO₂趋势</div>
                  </template>
                  <div class="stat-content gas-stat-content">
                    <div class="gas-value-container">
                      <div class="stat-value">{{ gasesStats.so2.avg.toFixed(1) }}</div>
                      <div class="stat-unit">μg/m³</div>
                    </div>
                    <div class="gas-trend-container">
                      <el-icon v-if="gasesStats.so2.trend === 'up'" color="#F56C6C" :size="24"><ArrowUp /></el-icon>
                      <el-icon v-else-if="gasesStats.so2.trend === 'down'" color="#67C23A" :size="24"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399" :size="24"><Remove /></el-icon>
                      <div class="trend-text">
                        {{ gasesStats.so2.trend === 'up' ? '上升' : (gasesStats.so2.trend === 'down' ? '下降' : '稳定') }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">NO₂趋势</div>
                  </template>
                  <div class="stat-content gas-stat-content">
                    <div class="gas-value-container">
                      <div class="stat-value">{{ gasesStats.no2.avg.toFixed(1) }}</div>
                      <div class="stat-unit">μg/m³</div>
                    </div>
                    <div class="gas-trend-container">
                      <el-icon v-if="gasesStats.no2.trend === 'up'" color="#F56C6C" :size="24"><ArrowUp /></el-icon>
                      <el-icon v-else-if="gasesStats.no2.trend === 'down'" color="#67C23A" :size="24"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399" :size="24"><Remove /></el-icon>
                      <div class="trend-text">
                        {{ gasesStats.no2.trend === 'up' ? '上升' : (gasesStats.no2.trend === 'down' ? '下降' : '稳定') }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">O₃趋势</div>
                  </template>
                  <div class="stat-content gas-stat-content">
                    <div class="gas-value-container">
                      <div class="stat-value">{{ gasesStats.o3.avg.toFixed(1) }}</div>
                      <div class="stat-unit">μg/m³</div>
                    </div>
                    <div class="gas-trend-container">
                      <el-icon v-if="gasesStats.o3.trend === 'up'" color="#F56C6C" :size="24"><ArrowUp /></el-icon>
                      <el-icon v-else-if="gasesStats.o3.trend === 'down'" color="#67C23A" :size="24"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399" :size="24"><Remove /></el-icon>
                      <div class="trend-text">
                        {{ gasesStats.o3.trend === 'up' ? '上升' : (gasesStats.o3.trend === 'down' ? '下降' : '稳定') }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-card shadow="hover" class="stat-card">
                  <template #header>
                    <div class="stat-header">CO趋势</div>
                  </template>
                  <div class="stat-content gas-stat-content">
                    <div class="gas-value-container">
                      <div class="stat-value">{{ gasesStats.co.avg.toFixed(2) }}</div>
                      <div class="stat-unit">mg/m³</div>
                    </div>
                    <div class="gas-trend-container">
                      <el-icon v-if="gasesStats.co.trend === 'up'" color="#F56C6C" :size="24"><ArrowUp /></el-icon>
                      <el-icon v-else-if="gasesStats.co.trend === 'down'" color="#67C23A" :size="24"><ArrowDown /></el-icon>
                      <el-icon v-else color="#909399" :size="24"><Remove /></el-icon>
                      <div class="trend-text">
                        {{ gasesStats.co.trend === 'up' ? '上升' : (gasesStats.co.trend === 'down' ? '下降' : '稳定') }}
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无近期趋势数据" />
    </el-card>

    <el-empty v-if="!selectedCity" description="请选择位置查看近期空气质量趋势" />
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { ArrowUp, ArrowDown, Remove } from '@element-plus/icons-vue'

export default {
  name: 'Trends',
  components: {
    ArrowUp,
    ArrowDown,
    Remove
  },
  setup() {
    // 位置选择相关
    const selectedProvince = ref(null)
    const selectedCity = ref(null)
    const provinces = ref([])
    const cities = ref([])
    const loading = ref(false)

    // 图表相关
    const trendsData = ref([])
    const activeMetric = ref('aqi')
    const chartType = ref('line')
    const aqiChart = ref(null)
    const pmChart = ref(null)
    const gasesChart = ref(null)
    let aqiChartInstance = null
    let pmChartInstance = null
    let gasesChartInstance = null

    // 统计信息
    const aqiStats = reactive({
      avg: 0,
      max: 0,
      min: 0,
      trend: 'stable' // 'up', 'down', 'stable'
    })

    const pmStats = reactive({
      pm25: { avg: 0, trend: 'stable' },
      pm10: { avg: 0, trend: 'stable' }
    })

    const gasesStats = reactive({
      so2: { avg: 0, trend: 'stable' },
      no2: { avg: 0, trend: 'stable' },
      o3: { avg: 0, trend: 'stable' },
      co: { avg: 0, trend: 'stable' }
    })

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
      destroyCharts()
      
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
        loadTrendsData()
      }
    }

    // 加载趋势数据
    const loadTrendsData = async () => {
      if (!selectedCity.value) return
      
      loading.value = true
      try {
        // 使用API: 获取最近7天空气质量数据
        const response = await axios.get(`/api/air-quality/last-7-days/${selectedCity.value}`)
        
        if (response.data && response.data.data) {
          trendsData.value = response.data.data.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
          calculateStats()
          initCharts()
        } else {
          ElMessage.error('获取趋势数据失败')
          trendsData.value = []
        }
      } catch (error) {
        console.error('加载趋势数据失败', error)
        ElMessage.error('获取趋势数据失败，请稍后重试')
        trendsData.value = []
      } finally {
        loading.value = false
      }
    }

    // 计算统计数据
    const calculateStats = () => {
      if (!trendsData.value || trendsData.value.length === 0) return

      // 计算AQI统计数据
      calculateMetricStats(trendsData.value.map(item => item.aqi), aqiStats)
      
      // 计算PM统计数据
      calculateMetricStats(trendsData.value.map(item => item.pm25), pmStats.pm25)
      calculateMetricStats(trendsData.value.map(item => item.pm10), pmStats.pm10)
      
      // 计算气体污染物统计数据
      calculateMetricStats(trendsData.value.map(item => item.so2), gasesStats.so2)
      calculateMetricStats(trendsData.value.map(item => item.no2), gasesStats.no2)
      calculateMetricStats(trendsData.value.map(item => item.o3), gasesStats.o3)
      calculateMetricStats(trendsData.value.map(item => item.co), gasesStats.co)
    }

    // 计算单个指标的统计数据
    const calculateMetricStats = (values, statsObj) => {
      if (!values || values.length === 0) return
      
      statsObj.avg = values.reduce((sum, val) => sum + val, 0) / values.length
      statsObj.max = Math.max(...values)
      statsObj.min = Math.min(...values)

      // 使用线性回归计算斜率
      const n = values.length
      const xValues = Array.from({ length: n }, (_, i) => i)
      
      // 计算均值
      const xMean = xValues.reduce((sum, val) => sum + val, 0) / n
      const yMean = statsObj.avg
      
      // 计算斜率
      let numerator = 0
      let denominator = 0
      
      for (let i = 0; i < n; i++) {
        numerator += (xValues[i] - xMean) * (values[i] - yMean)
        denominator += Math.pow(xValues[i] - xMean, 2)
      }
      
      const slope = denominator !== 0 ? numerator / denominator : 0
      
      // 根据斜率判断趋势 - 调整阈值，使系统对变化更敏感
      if (Math.abs(slope) < 0.1) { // 将阈值从0.5降低到0.1
        statsObj.trend = 'stable'
      } else if (slope > 0) {
        statsObj.trend = 'up'
      } else {
        statsObj.trend = 'down'
      }
    }

    // 销毁图表
    const destroyCharts = () => {
      if (aqiChartInstance) {
        aqiChartInstance.dispose()
        aqiChartInstance = null
      }
      if (pmChartInstance) {
        pmChartInstance.dispose()
        pmChartInstance = null
      }
      if (gasesChartInstance) {
        gasesChartInstance.dispose()
        gasesChartInstance = null
      }
    }

    // 初始化图表
    const initCharts = () => {
      if (!trendsData.value || trendsData.value.length === 0) return
      
      destroyCharts()
      
      // 延迟初始化，给DOM更多时间完成渲染
      setTimeout(() => {
        nextTick(() => {
          // 只初始化当前活动的图表
          try {
            if (activeMetric.value === 'aqi' && aqiChart.value) {
              aqiChartInstance = echarts.init(aqiChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: true  // 优化性能
              })
              renderAQIChart()
            } else if (activeMetric.value === 'pm' && pmChart.value) {
              pmChartInstance = echarts.init(pmChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: true
              })
              renderPMChart()
            } else if (activeMetric.value === 'gases' && gasesChart.value) {
              gasesChartInstance = echarts.init(gasesChart.value, null, {
                renderer: 'canvas',
                useDirtyRect: true
              })
              renderGasesChart()
            }
          } catch (e) {
            console.error('初始化图表失败', e)
          }
        })
      }, 200)
    }

    // 渲染AQI图表
    const renderAQIChart = () => {
      if (!aqiChartInstance || !trendsData.value.length) return
      
      const dateTimeLabels = trendsData.value.map(item => formatDateTime(item.dateTime))
      const aqiValues = trendsData.value.map(item => item.aqi)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const dataIndex = params[0].dataIndex
            const data = trendsData.value[dataIndex]
            return `${formatDateTime(data.dateTime)}<br/>
                    AQI: ${data.aqi}<br/>
                    级别: ${data.aqiLevel}`
          }
        },
        legend: {
          data: ['AQI']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: chartType.value === 'bar',
          data: dateTimeLabels,
          axisLabel: {
            formatter: value => formatShortDateTime(value)
          }
        },
        yAxis: {
          type: 'value',
          name: 'AQI',
          min: 'dataMin',
          axisLine: {
            show: true
          }
        },
        visualMap: {
          show: false,
          pieces: [
            {min: 0, max: 50, color: '#67C23A'},
            {min: 51, max: 100, color: '#E6A23C'},
            {min: 101, max: 150, color: '#F56C6C'},
            {min: 151, max: 200, color: '#F56C6C'},
            {min: 201, max: 300, color: '#800080'},
            {min: 301, max: 500, color: '#7B0000'}
          ],
          dimension: 0
        },
        series: createSeries('AQI', aqiValues, '#409EFF')
      }
      
      aqiChartInstance.setOption(option)
    }

    // 渲染PM图表
    const renderPMChart = () => {
      if (!pmChartInstance || !trendsData.value.length) return
      
      const dateTimeLabels = trendsData.value.map(item => formatDateTime(item.dateTime))
      const pm25Values = trendsData.value.map(item => item.pm25)
      const pm10Values = trendsData.value.map(item => item.pm10)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const dataIndex = params[0].dataIndex
            const data = trendsData.value[dataIndex]
            return `${formatDateTime(data.dateTime)}<br/>
                    PM2.5: ${data.pm25} μg/m³<br/>
                    PM10: ${data.pm10} μg/m³`
          }
        },
        legend: {
          data: ['PM2.5', 'PM10']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: chartType.value === 'bar',
          data: dateTimeLabels,
          axisLabel: {
            formatter: value => formatShortDateTime(value)
          }
        },
        yAxis: {
          type: 'value',
          name: 'μg/m³',
          min: 'dataMin',
          axisLine: {
            show: true
          }
        },
        series: [
          ...createSeries('PM2.5', pm25Values, '#409EFF'),
          ...createSeries('PM10', pm10Values, '#67C23A')
        ]
      }
      
      pmChartInstance.setOption(option)
    }

    // 渲染气体污染物图表
    const renderGasesChart = () => {
      if (!gasesChartInstance || !trendsData.value.length) return
      
      const dateTimeLabels = trendsData.value.map(item => formatDateTime(item.dateTime))
      const so2Values = trendsData.value.map(item => item.so2)
      const no2Values = trendsData.value.map(item => item.no2)
      const o3Values = trendsData.value.map(item => item.o3)
      const coValues = trendsData.value.map(item => item.co)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const dataIndex = params[0].dataIndex
            const data = trendsData.value[dataIndex]
            return `${formatDateTime(data.dateTime)}<br/>
                    SO₂: ${data.so2} μg/m³<br/>
                    NO₂: ${data.no2} μg/m³<br/>
                    O₃: ${data.o3} μg/m³<br/>
                    CO: ${data.co} mg/m³`
          }
        },
        legend: {
          data: ['SO₂', 'NO₂', 'O₃', 'CO']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: chartType.value === 'bar',
          data: dateTimeLabels,
          axisLabel: {
            formatter: value => formatShortDateTime(value)
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'μg/m³',
            position: 'left',
            axisLine: {
              show: true
            }
          },
          {
            type: 'value',
            name: 'mg/m³',
            position: 'right',
            axisLine: {
              show: true
            }
          }
        ],
        series: [
          ...createSeries('SO₂', so2Values, '#409EFF', 0),
          ...createSeries('NO₂', no2Values, '#67C23A', 0),
          ...createSeries('O₃', o3Values, '#E6A23C', 0),
          ...createSeries('CO', coValues, '#F56C6C', 1)
        ]
      }
      
      gasesChartInstance.setOption(option)
    }

    // 创建图表系列
    const createSeries = (name, data, color, yAxisIndex = 0) => {
      if (chartType.value === 'line') {
        return [{
          name: name,
          type: 'line',
          yAxisIndex: yAxisIndex,
          data: data,
          itemStyle: {
            color: color
          },
          lineStyle: {
            width: 2
          },
          showSymbol: false,
          smooth: true
        }]
      } else if (chartType.value === 'area') {
        return [{
          name: name,
          type: 'line',
          yAxisIndex: yAxisIndex,
          data: data,
          itemStyle: {
            color: color
          },
          lineStyle: {
            width: 2
          },
          showSymbol: false,
          smooth: true,
          areaStyle: {
            opacity: 0.3
          }
        }]
      } else if (chartType.value === 'bar') {
        return [{
          name: name,
          type: 'bar',
          yAxisIndex: yAxisIndex,
          data: data,
          itemStyle: {
            color: color
          }
        }]
      }
      
      return []
    }

    // 刷新数据
    const refreshData = () => {
      loadTrendsData()
    }

    // 刷新图表
    const refreshChart = () => {
      if (!trendsData.value || trendsData.value.length === 0) return
      
      // 防抖处理
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        nextTick(() => {
          try {
            if (activeMetric.value === 'aqi' && aqiChartInstance) {
              renderAQIChart()
            } else if (activeMetric.value === 'pm' && pmChartInstance) {
              renderPMChart()
            } else if (activeMetric.value === 'gases' && gasesChartInstance) {
              renderGasesChart()
            }
          } catch (e) {
            console.error('刷新图表失败', e)
          }
        })
      }, 200)
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
    }

    // 格式化短日期时间（用于X轴显示）
    const formatShortDateTime = (dateTimeStr) => {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
    }

    const padZero = (num) => {
      return num < 10 ? `0${num}` : num
    }

    // 根据AQI值获取级别
    const getAQILevel = (aqi) => {
      if (aqi <= 50) return '优'
      if (aqi <= 100) return '良'
      if (aqi <= 150) return '轻度污染'
      if (aqi <= 200) return '中度污染'
      if (aqi <= 300) return '重度污染'
      return '严重污染'
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

    // 节流函数
    const throttle = (fn, delay) => {
      let timer = null;
      let lastTime = 0;
      
      return function() {
        const context = this;
        const args = arguments;
        const now = Date.now();
        
        if (now - lastTime >= delay) {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          fn.apply(context, args);
          lastTime = now;
        } else if (!timer) {
          timer = setTimeout(() => {
            fn.apply(context, args);
            lastTime = Date.now();
            timer = null;
          }, delay);
        }
      };
    };

    // 处理窗口大小变化
    const handleResize = throttle(() => {
      if (!trendsData.value || trendsData.value.length === 0) return
      
      try {
        // 只对当前活动图表进行resize
        if (activeMetric.value === 'aqi' && aqiChartInstance) {
          aqiChartInstance.resize({ animation: { duration: 0 } });
        } else if (activeMetric.value === 'pm' && pmChartInstance) {
          pmChartInstance.resize({ animation: { duration: 0 } });
        } else if (activeMetric.value === 'gases' && gasesChartInstance) {
          gasesChartInstance.resize({ animation: { duration: 0 } });
        }
      } catch (e) {
        console.error('Resize图表失败', e);
      }
    }, 300);

    let resizeTimer = null
    let refreshTimer = null  // 添加refreshTimer变量声明

    // 监听图表类型和指标变化
    watch(chartType, () => {
      // 延迟执行，避免频繁刷新
      if (refreshTimer) clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => {
        refreshChart()
      }, 200)
    })

    // 处理标签页变化
    watch(activeMetric, (newVal) => {
      handleTabChange(newVal)
    })

    // 处理标签页切换，延迟加载相应图表
    const handleTabChange = (tab) => {
      // 先销毁所有图表
      destroyCharts()
      
      // 延迟初始化新的图表
      setTimeout(() => {
        if (tab === 'aqi' && aqiChart.value && !aqiChartInstance) {
          try {
            aqiChartInstance = echarts.init(aqiChart.value, null, {
              renderer: 'canvas',
              useDirtyRect: true
            })
            renderAQIChart()
          } catch (e) {
            console.error('初始化AQI图表失败', e)
          }
        } else if (tab === 'pm' && pmChart.value && !pmChartInstance) {
          try {
            pmChartInstance = echarts.init(pmChart.value, null, {
              renderer: 'canvas',
              useDirtyRect: true
            })
            renderPMChart()
          } catch (e) {
            console.error('初始化PM图表失败', e)
          }
        } else if (tab === 'gases' && gasesChart.value && !gasesChartInstance) {
          try {
            gasesChartInstance = echarts.init(gasesChart.value, null, {
              renderer: 'canvas',
              useDirtyRect: true
            })
            renderGasesChart()
          } catch (e) {
            console.error('初始化气体污染物图表失败', e)
          }
        }
      }, 200)
    }

    onMounted(() => {
      loadProvinces()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      destroyCharts()
      window.removeEventListener('resize', handleResize)
      // 清除所有定时器
      if (resizeTimer) clearTimeout(resizeTimer)
      if (refreshTimer) clearTimeout(refreshTimer)
    })

    return {
      selectedProvince,
      selectedCity,
      provinces,
      cities,
      loading,
      trendsData,
      activeMetric,
      chartType,
      aqiChart,
      pmChart,
      gasesChart,
      aqiStats,
      pmStats,
      gasesStats,
      pollutantLabels,
      pollutantUnits,
      handleProvinceChange,
      handleCityChange,
      refreshData,
      refreshChart,
      formatDateTime,
      getAQILevel,
      getAQILevelClass
    }
  }
}
</script>

<style scoped>
.trends-container {
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

.header-controls {
  display: flex;
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

.chart-container {
  width: 100%;
  height: 400px;
  margin: 20px 0;
}

.chart-tabs {
  margin-top: 20px;
}

.chart-description {
  color: #909399;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}

.trend-summary {
  margin-top: 20px;
}

.trend-summary h3 {
  margin-bottom: 20px;
  color: #303133;
}

.stat-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  height: 100%;  /* 使卡片高度填充父容器 */
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-header {
  font-size: 14px;
  color: #606266;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  height: 120px;  /* 固定内容区域高度 */
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-level {
  font-size: 14px;
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 4px;
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

.trend-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.trend-text {
  font-size: 16px;
  font-weight: bold;
}

.stat-unit {
  font-size: 12px;
  color: #909399;
}

@media screen and (max-width: 768px) {
  .location-row {
    flex-direction: column;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

/* 气体污染物卡片样式 */
.gas-stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.gas-value-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.gas-trend-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-unit {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style> 