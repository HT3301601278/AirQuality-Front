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

export default {
  name: 'Map',
  setup() {
    const subscriptionLocations = ref([])

    const initMap = () => {
      const map = new BMap.Map('map-container')
      const point = new BMap.Point(116.404, 39.915) // 默认北京中心点
      map.centerAndZoom(point, 5)
      map.enableScrollWheelZoom(true)
      
      // 添加地图控件
      map.addControl(new BMap.NavigationControl())
      map.addControl(new BMap.ScaleControl())
      
      // 为每个订阅地点添加标记
      subscriptionLocations.value.forEach(subscription => {
        const city = subscription.location.city
        const myGeo = new BMap.Geocoder()
        myGeo.getPoint(city, function(point){
          if (point) {
            const marker = new BMap.Marker(point)
            map.addOverlay(marker)
            
            const label = new BMap.Label(city, {
              offset: new BMap.Size(20, -10)
            })
            marker.setLabel(label)
            
            // 添加点击事件
            marker.addEventListener('click', () => {
              const infoWindow = new BMap.InfoWindow(`
                <div>
                  <p>城市：${subscription.location.city}</p>
                  <p>省份：${subscription.location.province}</p>
                  <p>阈值类型：${subscription.thresholdType === 1 ? 'AQI' : 'PM2.5'}</p>
                  <p>阈值：${subscription.thresholdValue}</p>
                </div>
              `)
              marker.openInfoWindow(infoWindow)
            })
          }
        })
      })
    }

    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/subscriptions')
        if (response.data.code === 200) {
          subscriptionLocations.value = response.data.data
          // 确保百度地图 API 加载完成后再初始化地图
          if (window.BMap) {
            initMap()
          }
        }
      } catch (error) {
        console.error('获取订阅数据失败：', error)
      }
    }

    onMounted(() => {
      // 动态加载百度地图 API
      const script = document.createElement('script')
      script.src = `https://api.map.baidu.com/api?v=3.0&ak=nGzkc24FUDXggYtfJZQ0GQTH1p4tf9RJ&callback=initBMap`
      document.head.appendChild(script)
      
      window.initBMap = () => {
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
}
</style> 