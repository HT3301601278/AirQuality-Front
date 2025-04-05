<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>欢迎使用空气质量监测系统</h2>
          <p>这里是您的个人仪表盘，您可以查看关注城市的空气质量数据和订阅信息。</p>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><MapLocation /></el-icon>
              <span>城市数量</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic">10</div>
            <div class="statistic-label">已关注的城市</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Bell /></el-icon>
              <span>订阅数量</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic">5</div>
            <div class="statistic-label">活跃的订阅</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Warning /></el-icon>
              <span>警报数量</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic statistic-warning">2</div>
            <div class="statistic-label">未处理的警报</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><DataLine /></el-icon>
              <span>数据状态</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic statistic-success">在线</div>
            <div class="statistic-label">实时数据更新</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="recent-data-card">
          <template #header>
            <div class="card-header">
              <span>关注城市的最新空气质量指数</span>
            </div>
          </template>
          <el-table :data="citiesData" style="width: 100%" stripe>
            <el-table-column prop="city" label="城市名称" />
            <el-table-column prop="aqi" label="AQI" width="100">
              <template #default="scope">
                <el-tag :type="getAQILevel(scope.row.aqi).color">
                  {{ scope.row.aqi }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="空气质量等级" width="150">
              <template #default="scope">
                <span>{{ getAQILevel(scope.row.aqi).text }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="pm25" label="PM2.5" width="100" />
            <el-table-column prop="pm10" label="PM10" width="100" />
            <el-table-column prop="updateTime" label="更新时间" width="180" />
            <el-table-column label="操作" width="180">
              <template #default>
                <el-button type="primary" size="small" plain>查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="actions-card">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary">查看实时空气质量</el-button>
            <el-button type="success">添加城市订阅</el-button>
            <el-button type="warning">查看警报信息</el-button>
            <el-button type="info">查看空气质量地图</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue'
import { MapLocation, Bell, Warning, DataLine } from '@element-plus/icons-vue'

export default {
  name: 'UserDashboard',
  components: {
    MapLocation,
    Bell,
    Warning,
    DataLine
  },
  setup() {
    // 模拟城市数据
    const citiesData = ref([
      { city: '北京', aqi: 120, pm25: 75, pm10: 120, updateTime: '2023-06-01 08:00:00' },
      { city: '上海', aqi: 65, pm25: 32, pm10: 58, updateTime: '2023-06-01 08:00:00' },
      { city: '广州', aqi: 85, pm25: 45, pm10: 78, updateTime: '2023-06-01 08:00:00' },
      { city: '深圳', aqi: 55, pm25: 28, pm10: 52, updateTime: '2023-06-01 08:00:00' },
      { city: '杭州', aqi: 75, pm25: 38, pm10: 70, updateTime: '2023-06-01 08:00:00' }
    ])
    
    // 获取AQI等级和对应的颜色
    const getAQILevel = (aqi) => {
      if (aqi <= 50) {
        return { text: '优', color: 'success' }
      } else if (aqi <= 100) {
        return { text: '良', color: '' }
      } else if (aqi <= 150) {
        return { text: '轻度污染', color: 'warning' }
      } else if (aqi <= 200) {
        return { text: '中度污染', color: 'warning' }
      } else if (aqi <= 300) {
        return { text: '重度污染', color: 'danger' }
      } else {
        return { text: '严重污染', color: 'danger' }
      }
    }
    
    return {
      citiesData,
      getAQILevel
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 10px;
}

.mt-20 {
  margin-top: 20px;
}

.welcome-card {
  text-align: center;
  padding: 10px;
}

.welcome-card h2 {
  color: #409EFF;
  font-size: 24px;
  margin-bottom: 10px;
}

.welcome-card p {
  color: #606266;
  font-size: 16px;
}

.dashboard-card {
  margin-bottom: 10px;
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
}

.header-icon {
  margin-right: 5px;
  font-size: 18px;
}

.card-body {
  text-align: center;
  padding: 20px 0;
}

.statistic {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.statistic-warning {
  color: #E6A23C;
}

.statistic-success {
  color: #67C23A;
}

.statistic-label {
  margin-top: 10px;
  color: #909399;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
</style> 