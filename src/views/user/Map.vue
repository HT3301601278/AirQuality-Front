<template>
  <div class="map-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>空气质量地图</span>
        </div>
      </template>
      <div class="content">
        <div id="map-container" style="height: 600px;"></div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'

export default {
  name: 'Map',
  setup() {
    const subscriptionLocations = ref([])
    const map = ref(null)

    const fetchAirQuality = async (locationId) => {
      console.log('开始获取空气质量数据，locationId:', locationId)
      try {
        const response = await axios.get(`/api/air-quality/current/${locationId}`)
        console.log('获取到的空气质量数据:', response.data)
        if (response.data.code === 200) {
          return response.data.data
        }
        return null
      } catch (error) {
        console.error('获取空气质量数据失败：', error)
        ElMessage.error('获取空气质量数据失败')
        return null
      }
    }

    const createInfoWindow = (subscription, airQuality) => {
      console.log('创建信息窗口，数据:', { subscription, airQuality })
      let infoContent = `
        <div style="padding: 10px;">
          <h4 style="margin: 0 0 10px 0;">${subscription.location.city}空气质量信息</h4>
          <p style="margin: 5px 0;">省份：${subscription.location.province}</p>
          <p style="margin: 5px 0;">订阅阈值类型：${subscription.thresholdType === 1 ? 'AQI' : 'PM2.5'}</p>
          <p style="margin: 5px 0;">订阅阈值：${subscription.thresholdValue}</p>
      `

      if (airQuality) {
        infoContent += `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
            <h4 style="margin: 0 0 10px 0;">实时数据</h4>
            <p style="margin: 5px 0;">AQI：${airQuality.aqi} (${airQuality.aqiLevel})</p>
            <p style="margin: 5px 0;">PM2.5：${airQuality.pm25} μg/m³</p>
            <p style="margin: 5px 0;">PM10：${airQuality.pm10} μg/m³</p>
            <p style="margin: 5px 0;">更新时间：${new Date(airQuality.dateTime).toLocaleString()}</p>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">${airQuality.healthRecommendation}</p>
          </div>
        `
      } else {
        infoContent += `
          <p style="color: #f56c6c; margin: 5px 0;">暂无实时数据</p>
        `
      }

      infoContent += '</div>'

      return new BMap.InfoWindow(infoContent, {
        width: 300,
        height: 320,
        title: ''
      })
    }

    const initMap = () => {
      console.log('初始化地图')
      if (!window.BMap) {
        console.error('百度地图 API 未加载')
        ElMessage.error('地图加载失败')
        return
      }

      try {
        map.value = new BMap.Map('map-container')
        const point = new BMap.Point(116.404, 39.915)
        map.value.centerAndZoom(point, 5)
        map.value.enableScrollWheelZoom(true)
        
        map.value.addControl(new BMap.NavigationControl())
        map.value.addControl(new BMap.ScaleControl())
        
        console.log('开始添加订阅位置标记，数量:', subscriptionLocations.value.length)
        subscriptionLocations.value.forEach((subscription, index) => {
          console.log(`处理第 ${index + 1} 个订阅位置:`, subscription)
          const city = subscription.location.city
          const myGeo = new BMap.Geocoder()
          
          myGeo.getPoint(city, function(point){
            console.log(`城市 ${city} 的坐标:`, point)
            if (point) {
              const marker = new BMap.Marker(point)
              map.value.addOverlay(marker)
              
              const label = new BMap.Label(city, {
                offset: new BMap.Size(20, -10)
              })
              marker.setLabel(label)
              
              marker.addEventListener('click', function() {
                console.log(`点击了城市 ${city} 的标记`)
                const loadingInstance = ElLoading.service({
                  target: document.querySelector('.content'),
                  text: '加载空气质量数据中...'
                })
                
                fetchAirQuality(subscription.location.id)
                  .then(airQuality => {
                    console.log('获取到空气质量数据:', airQuality)
                    const infoWindow = createInfoWindow(subscription, airQuality)
                    marker.openInfoWindow(infoWindow)
                  })
                  .catch(error => {
                    console.error('处理点击事件失败：', error)
                    ElMessage.error('加载数据失败')
                  })
                  .finally(() => {
                    loadingInstance.close()
                  })
              })
            } else {
              console.error(`无法获取城市坐标：${city}`)
              ElMessage.warning(`无法在地图上标记城市：${city}`)
            }
          })
        })
      } catch (error) {
        console.error('地图初始化失败：', error)
        ElMessage.error('地图初始化失败')
      }
    }

    const fetchSubscriptions = async () => {
      console.log('开始获取订阅数据')
      try {
        const response = await axios.get('/api/subscriptions')
        console.log('获取到的订阅数据:', response.data)
        if (response.data.code === 200) {
          subscriptionLocations.value = response.data.data
          if (window.BMap) {
            initMap()
          }
        }
      } catch (error) {
        console.error('获取订阅数据失败：', error)
        ElMessage.error('获取订阅数据失败')
      }
    }

    onMounted(() => {
      console.log('组件挂载，开始加载百度地图 API')
      const script = document.createElement('script')
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=nGzkc24FUDXggYtfJZQ0GQTH1p4tf9RJ&callback=initBMap`
      script.onerror = () => {
        console.error('百度地图 API 加载失败')
        ElMessage.error('地图加载失败')
      }
      document.head.appendChild(script)
      
      window.initBMap = () => {
        console.log('百度地图 API 加载完成')
        fetchSubscriptions()
      }
    })

    return {}
  }
}
</script>

<style scoped>
.map-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding: 20px 0;
  position: relative;
}
</style> 