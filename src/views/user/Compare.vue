<template>
  <div class="compare-container">
    <el-card class="city-select-card">
      <template #header>
        <div class="card-header">
          <span>城市数据对比</span>
          <el-button type="primary" size="small" @click="compareData" :disabled="!canCompare">
            开始对比
          </el-button>
        </div>
      </template>
      
      <div class="city-select-content">
        <div v-for="(city, index) in selectedCities" :key="index" class="city-select-item">
          <div class="city-select-header">
            <span>城市 {{ index + 1 }}</span>
            <el-button 
              v-if="index > 1"
              type="danger" 
              size="small" 
              circle 
              @click="removeCity(index)" 
              icon="Delete"
            />
          </div>
          
          <el-form :model="city" label-position="top">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="省份">
                  <el-select 
                    v-model="city.province" 
                    placeholder="请选择省份" 
                    @change="(val) => handleProvinceChange(val, index)"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="province in provinces"
                      :key="province"
                      :label="province"
                      :value="province"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="城市">
                  <el-select 
                    v-model="city.cityId" 
                    placeholder="请选择城市" 
                    :disabled="!city.province"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="cityOption in city.cities"
                      :key="cityOption.id"
                      :label="cityOption.city"
                      :value="cityOption.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="add-city-btn">
          <el-button 
            type="dashed" 
            @click="addCity" 
            :disabled="selectedCities.length >= 5"
            icon="Plus"
          >
            添加城市(最多5个)
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="compare-type-card">
      <template #header>
        <div class="card-header">
          <span>对比类型</span>
        </div>
      </template>
      
      <div class="compare-type-content">
        <el-radio-group v-model="compareType" @change="handleCompareTypeChange">
          <el-radio-button label="historical">自定义时间段对比</el-radio-button>
          <el-radio-button label="specific-dates">特定日期对比</el-radio-button>
        </el-radio-group>

        <div class="time-selector mt-20">
          <template v-if="compareType === 'historical'">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              style="width: 100%"
            />
          </template>
          <template v-else>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-date-picker
                  v-model="specificDate1"
                  type="date"
                  placeholder="选择日期1"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-date-picker
                  v-model="specificDate2"
                  type="date"
                  placeholder="选择日期2"
                  format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-col>
            </el-row>
          </template>
        </div>
      </div>
    </el-card>

    <el-card class="compare-result-card" v-loading="loading" v-if="hasComparisonData">
      <template #header>
        <div class="card-header">
          <span>对比结果</span>
        </div>
      </template>
      
      <div class="compare-result-content">
        <div class="metrics-selector">
          <el-select
            v-model="selectedMetrics"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择指标"
            style="width: 100%"
          >
            <el-option
              v-for="metric in availableMetrics"
              :key="metric.value"
              :label="metric.label"
              :value="metric.value"
            />
          </el-select>
        </div>

        <el-tabs v-model="activeChartTab" @tab-click="handleChartTabChange">
          <el-tab-pane label="柱状图" name="bar">
            <div ref="barChart" class="chart-container"></div>
          </el-tab-pane>
          <el-tab-pane label="雷达图" name="radar">
            <div ref="radarChart" class="chart-container"></div>
          </el-tab-pane>
          <el-tab-pane label="折线图" name="line">
            <div class="line-chart-controls">
              <div class="line-chart-legend">
                <div v-for="(city, cityIndex) in selectedCities.filter(c => c.cityId)" :key="cityIndex">
                  <el-checkbox 
                    v-model="city.visible" 
                    :label="city.cityName"
                    :style="{ color: cityColors[cityIndex % cityColors.length] }"
                    @change="updateLineChart"
                  />
                </div>
              </div>
              <div class="line-chart-metric-selector">
                <el-select
                  v-model="lineChartMetric"
                  placeholder="选择指标"
                  size="small"
                  @change="updateLineChart"
                >
                  <el-option
                    v-for="metric in availableMetrics"
                    :key="metric.value"
                    :label="metric.label"
                    :value="metric.value"
                  />
                </el-select>
              </div>
            </div>
            <div ref="lineChart" class="chart-container"></div>
          </el-tab-pane>
        </el-tabs>

        <div class="data-table-container mt-20">
          <h3>详细指标对比</h3>
          <el-table :data="tableData" border stripe style="width: 100%">
            <el-table-column prop="metric" label="指标" width="120" />
            <el-table-column 
              v-for="(city, index) in selectedCities.filter(c => c.cityId)" 
              :key="index"
              :prop="'city' + index"
              :label="city.cityName || '城市' + (index + 1)"
            />
            <el-table-column 
              v-if="selectedCities.filter(c => c.cityId).length >= 2"
              prop="difference" 
              label="差异值(%)" 
              width="120" 
            />
          </el-table>
        </div>

        <div class="health-recommendations mt-20">
          <h3>健康建议对比</h3>
          <el-collapse>
            <el-collapse-item 
              v-for="(city, index) in selectedCities.filter(c => c.cityId)" 
              :key="index"
              :title="city.cityName || '城市' + (index + 1)"
            >
              <div v-if="city.healthRecommendation" class="recommendation-content">
                {{ city.healthRecommendation }}
              </div>
              <div v-else class="recommendation-content">
                暂无健康建议数据
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>

    <el-empty 
      v-if="!loading && !hasComparisonData && showEmptyState" 
      description="请选择城市和时间后开始对比" 
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Compare',
  setup() {
    const provinces = ref([])
    const selectedCities = ref([
      { province: '', cityId: null, cityName: '', cities: [], visible: true, healthRecommendation: '' },
      { province: '', cityId: null, cityName: '', cities: [], visible: true, healthRecommendation: '' }
    ])
    const compareType = ref('historical')
    const dateRange = ref([])
    const specificDate1 = ref('')
    const specificDate2 = ref('')
    const loading = ref(false)
    const hasComparisonData = ref(false)
    const showEmptyState = ref(false)
    const comparisonData = ref([])
    
    const activeChartTab = ref('bar')
    const barChart = ref(null)
    const radarChart = ref(null)
    const lineChart = ref(null)
    let barChartInstance = null
    let radarChartInstance = null
    let lineChartInstance = null
    const cityColors = [
      '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'
    ]

    const tableData = ref([])
    const availableMetrics = [
      { label: 'AQI', value: 'aqi' },
      { label: 'CO', value: 'co' },
      { label: 'NO', value: 'no' },
      { label: 'NO2', value: 'no2' },
      { label: 'O3', value: 'o3' },
      { label: 'SO2', value: 'so2' },
      { label: 'PM2.5', value: 'pm25' },
      { label: 'PM10', value: 'pm10' },
      { label: 'NH3', value: 'nh3' }
    ]
    const selectedMetrics = ref(['aqi', 'pm25', 'pm10'])
    const lineChartMetric = ref('aqi')

    const canCompare = computed(() => {
      const hasCities = selectedCities.value.filter(city => city.cityId).length >= 2
      if (compareType.value === 'historical') {
        return hasCities && dateRange.value && dateRange.value.length === 2
      } else {
        return hasCities && specificDate1.value && specificDate2.value
      }
    })

    onMounted(async () => {
      await loadProvinces()
      setTimeout(() => {
        showEmptyState.value = true
      }, 500)
    })

    const loadProvinces = async () => {
      try {
        const response = await axios.get('/api/locations/provinces')
        if (response.data.code === 200) {
          provinces.value = response.data.data
        }
      } catch (error) {
        console.error('加载省份失败', error)
        ElMessage.error('加载省份数据失败')
      }
    }

    const handleProvinceChange = async (province, index) => {
      try {
        selectedCities.value[index].cityId = null
        selectedCities.value[index].cityName = ''
        selectedCities.value[index].cities = []
        
        const response = await axios.get(`/api/locations/cities?province=${province}`)
        if (response.data.code === 200) {
          selectedCities.value[index].cities = response.data.data
        }
      } catch (error) {
        console.error('加载城市失败', error)
        ElMessage.error('加载城市数据失败')
      }
    }

    watch(selectedCities, (newValue) => {
      newValue.forEach((city, index) => {
        if (city.cityId && city.cities.length > 0) {
          const selectedCity = city.cities.find(c => c.id === city.cityId)
          if (selectedCity) {
            selectedCities.value[index].cityName = selectedCity.city
          }
        }
      })
    }, { deep: true })

    const addCity = () => {
      if (selectedCities.value.length < 5) {
        selectedCities.value.push({ 
          province: '', 
          cityId: null, 
          cityName: '',
          cities: [], 
          visible: true,
          healthRecommendation: ''
        })
      }
    }

    const removeCity = (index) => {
      selectedCities.value.splice(index, 1)
    }

    const handleCompareTypeChange = () => {
      if (compareType.value === 'historical') {
        dateRange.value = []
        specificDate1.value = ''
        specificDate2.value = ''
      } else {
        dateRange.value = []
        specificDate1.value = ''
        specificDate2.value = ''
      }
    }

    const compareData = async () => {
      if (!canCompare.value) return
      
      loading.value = true
      hasComparisonData.value = false
      comparisonData.value = []
      
      try {
        const promises = []
        const validCities = selectedCities.value.filter(city => city.cityId)
        
        for (const city of validCities) {
          if (compareType.value === 'historical') {
            const startTime = new Date(dateRange.value[0])
            const endTime = new Date(dateRange.value[1])
            startTime.setHours(0, 0, 0, 0)
            endTime.setHours(23, 59, 59, 999)
            
            const startTimeStr = startTime.toISOString().split('.')[0]
            const endTimeStr = endTime.toISOString().split('.')[0]
            
            promises.push(
              axios.get(`/api/air-quality/historical/${city.cityId}?startTime=${startTimeStr}&endTime=${endTimeStr}`)
            )
          } else {
            const date1 = new Date(specificDate1.value)
            const date2 = new Date(specificDate2.value)
            date1.setHours(12, 0, 0, 0)
            date2.setHours(12, 0, 0, 0)
            
            const date1Str = date1.toISOString().split('.')[0]
            const date2Str = date2.toISOString().split('.')[0]
            
            promises.push(
              axios.get(`/api/air-quality/compare-dates/${city.cityId}?date1=${date1Str}&date2=${date2Str}`)
            )
          }
        }
        
        const results = await Promise.all(promises)
        
        results.forEach((result, index) => {
          if (result.data.code === 200) {
            let cityData
            
            if (compareType.value === 'historical') {
              cityData = {
                cityId: validCities[index].cityId,
                cityName: validCities[index].cityName,
                data: result.data.data
              }
              
              if (result.data.data && result.data.data.length > 0) {
                validCities[index].healthRecommendation = result.data.data[0].healthRecommendation
              }
            } else {
              cityData = {
                cityId: validCities[index].cityId,
                cityName: validCities[index].cityName,
                data: result.data.data.flat()
              }
              
              if (result.data.data && result.data.data[0] && result.data.data[0].length > 0) {
                validCities[index].healthRecommendation = result.data.data[0][0].healthRecommendation
              }
            }
            
            comparisonData.value.push(cityData)
          }
        })
        
        processTableData()
        
        hasComparisonData.value = true
        nextTick(() => {
          initCharts()
        })
      } catch (error) {
        console.error('对比数据获取失败', error)
        ElMessage.error('对比数据获取失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    const processTableData = () => {
      tableData.value = []
      
      const cityAverages = comparisonData.value.map(city => {
        const result = {}
        
        availableMetrics.forEach(metric => {
          const values = city.data.map(item => parseFloat(item[metric.value]) || 0)
          const validValues = values.filter(val => !isNaN(val))
          
          if (validValues.length > 0) {
            const sum = validValues.reduce((a, b) => a + b, 0)
            result[metric.value] = sum / validValues.length
          } else {
            result[metric.value] = 0
          }
        })
        
        return result
      })
      
      availableMetrics.forEach(metric => {
        const row = {
          metric: metric.label
        }
        
        cityAverages.forEach((cityAvg, index) => {
          row['city' + index] = cityAvg[metric.value].toFixed(2)
        })
        
        if (cityAverages.length >= 2) {
          const values = cityAverages.map(city => city[metric.value])
          const max = Math.max(...values)
          const min = Math.min(...values)
          
          if (max > 0 && min > 0) {
            const diffPercent = ((max - min) / min * 100).toFixed(2)
            row.difference = diffPercent
          } else {
            row.difference = '0.00'
          }
        }
        
        tableData.value.push(row)
      })
    }

    const handleChartTabChange = () => {
      nextTick(() => {
        updateCharts()
      })
    }
    
    const initCharts = () => {
      if (barChartInstance) barChartInstance.dispose()
      if (radarChartInstance) radarChartInstance.dispose()
      if (lineChartInstance) lineChartInstance.dispose()
      
      barChartInstance = echarts.init(barChart.value)
      radarChartInstance = echarts.init(radarChart.value)
      lineChartInstance = echarts.init(lineChart.value)
      
      updateCharts()
      
      window.addEventListener('resize', () => {
        barChartInstance.resize()
        radarChartInstance.resize()
        lineChartInstance.resize()
      })
    }
    
    const updateCharts = () => {
      updateBarChart()
      updateRadarChart()
      updateLineChart()
    }
    
    const updateBarChart = () => {
      if (!barChartInstance) return
      
      const series = []
      const cities = selectedCities.value.filter(city => city.cityId)
      
      selectedMetrics.value.forEach(metric => {
        const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric
        
        const data = cities.map((city, index) => {
          const cityData = comparisonData.value.find(d => d.cityId === city.cityId)
          if (!cityData || !cityData.data || cityData.data.length === 0) return 0
          
          const values = cityData.data.map(item => parseFloat(item[metric]) || 0)
          const validValues = values.filter(val => !isNaN(val))
          
          if (validValues.length > 0) {
            return {
              value: (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2),
              itemStyle: { color: cityColors[index % cityColors.length] }
            }
          }
          
          return 0
        })
        
        series.push({
          name: metricLabel,
          type: 'bar',
          data,
          emphasis: {
            focus: 'series'
          },
          label: {
            show: true,
            position: 'top'
          }
        })
      })
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: selectedMetrics.value.map(metric => 
            availableMetrics.find(m => m.value === metric)?.label || metric
          )
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: cities.map(city => city.cityName),
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '数值'
        },
        series
      }
      
      barChartInstance.setOption(option)
    }
    
    const updateRadarChart = () => {
      if (!radarChartInstance) return
      
      const indicators = selectedMetrics.value.map(metric => {
        const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric
        
        let max = 0
        comparisonData.value.forEach(city => {
          city.data.forEach(item => {
            const val = parseFloat(item[metric]) || 0
            if (!isNaN(val) && val > max) max = val
          })
        })
        
        return {
          name: metricLabel,
          max: max * 1.2
        }
      })
      
      const series = [{
        type: 'radar',
        data: comparisonData.value.map((city, index) => {
          const data = selectedMetrics.value.map(metric => {
            const values = city.data.map(item => parseFloat(item[metric]) || 0)
            const validValues = values.filter(val => !isNaN(val))
            
            if (validValues.length > 0) {
              return validValues.reduce((a, b) => a + b, 0) / validValues.length
            }
            
            return 0
          })
          
          return {
            value: data,
            name: city.cityName,
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5,
                y: 0.5,
                r: 0.5,
                colorStops: [
                  {
                    offset: 0,
                    color: cityColors[index % cityColors.length] + '80'
                  },
                  {
                    offset: 1,
                    color: cityColors[index % cityColors.length] + '30'
                  }
                ],
                globalCoord: false
              }
            },
            lineStyle: {
              width: 1,
              color: cityColors[index % cityColors.length]
            },
            itemStyle: {
              color: cityColors[index % cityColors.length]
            }
          }
        })
      }]
      
      const option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          data: comparisonData.value.map(city => city.cityName)
        },
        radar: {
          shape: 'circle',
          indicator: indicators
        },
        series
      }
      
      radarChartInstance.setOption(option)
    }
    
    const updateLineChart = () => {
      if (!lineChartInstance) return
      
      const sortedData = {}
      comparisonData.value.forEach((city, index) => {
        if (!selectedCities.value[index].visible) return
        
        sortedData[city.cityId] = {}
        city.data.forEach(item => {
          const date = new Date(item.dateTime)
          sortedData[city.cityId][date.getTime()] = item
        })
      })
      
      const allTimes = new Set()
      Object.values(sortedData).forEach(cityData => {
        Object.keys(cityData).forEach(time => allTimes.add(parseInt(time)))
      })
      
      const timeArray = Array.from(allTimes).sort((a, b) => a - b)
      
      const xAxisData = timeArray.map(time => {
        const date = new Date(time)
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
      })
      
      const series = []
      
      selectedCities.value.forEach((cityObj, index) => {
        if (!cityObj.cityId || !cityObj.visible) return
        
        const city = comparisonData.value.find(c => c.cityId === cityObj.cityId)
        if (!city) return
        
        const data = timeArray.map(time => {
          const item = sortedData[city.cityId][time]
          return item ? (parseFloat(item[lineChartMetric.value]) || 0) : null
        })
        
        series.push({
          name: city.cityName,
          type: 'line',
          symbol: 'circle',
          symbolSize: 6,
          data,
          smooth: true,
          lineStyle: {
            width: 2,
            color: cityColors[index % cityColors.length]
          },
          itemStyle: {
            color: cityColors[index % cityColors.length]
          }
        })
      })
      
      const metricLabel = availableMetrics.find(m => m.value === lineChartMetric.value)?.label || lineChartMetric.value
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: selectedCities.value
            .filter(city => city.cityId && city.visible)
            .map(city => city.cityName)
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxisData,
          axisLabel: {
            interval: Math.ceil(xAxisData.length / 10),
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: metricLabel
        },
        series
      }
      
      lineChartInstance.setOption(option)
    }

    return {
      provinces,
      selectedCities,
      compareType,
      dateRange,
      specificDate1,
      specificDate2,
      loading,
      hasComparisonData,
      showEmptyState,
      canCompare,
      
      handleProvinceChange,
      addCity,
      removeCity,
      handleCompareTypeChange,
      compareData,
      
      barChart,
      radarChart,
      lineChart,
      activeChartTab,
      handleChartTabChange,
      cityColors,
      updateLineChart,
      
      tableData,
      availableMetrics,
      selectedMetrics,
      lineChartMetric
    }
  }
}
</script>

<style scoped>
.compare-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-type-card,
.compare-result-card {
  margin-top: 20px;
}

.city-select-content {
  margin-bottom: 20px;
}

.city-select-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.city-select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.add-city-btn {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.mt-20 {
  margin-top: 20px;
}

.compare-result-content {
  padding: 10px 0;
}

.chart-container {
  height: 400px;
  margin-top: 20px;
}

.metrics-selector {
  margin-bottom: 20px;
}

.line-chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.line-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.health-recommendations {
  margin-top: 30px;
}

.recommendation-content {
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.data-table-container {
  margin-top: 30px;
}

.data-table-container h3 {
  margin-bottom: 15px;
}

@media screen and (max-width: 768px) {
  .line-chart-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>
