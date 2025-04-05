<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h2>管理员控制台</h2>
          <p>这里是管理员仪表盘，您可以查看系统概况和管理系统资源。</p>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><User /></el-icon>
              <span>用户数量</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic">152</div>
            <div class="statistic-label">注册用户</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Location /></el-icon>
              <span>监测位置</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic">85</div>
            <div class="statistic-label">城市和地区</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Warning /></el-icon>
              <span>警报总数</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic statistic-warning">24</div>
            <div class="statistic-label">今日触发的警报</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :sm="24" :md="12" :lg="6">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Message /></el-icon>
              <span>通知总数</span>
            </div>
          </template>
          <div class="card-body">
            <div class="statistic">120</div>
            <div class="statistic-label">今日发送的通知</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24" :xl="12">
        <el-card class="user-card">
          <template #header>
            <div class="card-header">
              <span>最近注册的用户</span>
              <el-button type="primary" size="small" plain>查看所有</el-button>
            </div>
          </template>
          <el-table :data="recentUsers" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="userType" label="用户类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.userType === 1 ? 'danger' : ''">
                  {{ scope.row.userType === 1 ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="注册时间" width="180" />
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" size="small" plain>编辑</el-button>
                <el-button type="danger" size="small" plain>禁用</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="24" :xl="12">
        <el-card class="warning-card">
          <template #header>
            <div class="card-header">
              <span>最近的警报</span>
              <el-button type="primary" size="small" plain>查看所有</el-button>
            </div>
          </template>
          <el-table :data="recentAlerts" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="city" label="城市" />
            <el-table-column prop="pollutant" label="污染物" />
            <el-table-column prop="value" label="值" width="80" />
            <el-table-column prop="threshold" label="阈值" width="80" />
            <el-table-column prop="level" label="等级" width="100">
              <template #default="scope">
                <el-tag :type="getAlertLevel(scope.row.level).color">
                  {{ getAlertLevel(scope.row.level).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card class="actions-card">
          <template #header>
            <div class="card-header">
              <span>系统管理操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary">用户管理</el-button>
            <el-button type="success">位置管理</el-button>
            <el-button type="warning">警报管理</el-button>
            <el-button type="info">通知管理</el-button>
            <el-button type="danger">系统设置</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref } from 'vue'
import { User, Location, Warning, Message } from '@element-plus/icons-vue'

export default {
  name: 'AdminDashboard',
  components: {
    User,
    Location,
    Warning,
    Message
  },
  setup() {
    // 模拟最近用户数据
    const recentUsers = ref([
      { id: 1001, username: 'user1', email: 'user1@example.com', userType: 0, status: 1, createTime: '2023-06-01 15:30:00' },
      { id: 1002, username: 'admin2', email: 'admin2@example.com', userType: 1, status: 1, createTime: '2023-06-01 14:20:00' },
      { id: 1003, username: 'user3', email: 'user3@example.com', userType: 0, status: 0, createTime: '2023-06-01 12:10:00' },
      { id: 1004, username: 'user4', email: 'user4@example.com', userType: 0, status: 1, createTime: '2023-06-01 10:05:00' }
    ])
    
    // 模拟最近警报数据
    const recentAlerts = ref([
      { id: 2001, city: '北京', pollutant: 'PM2.5', value: 95, threshold: 75, level: 'warning', createTime: '2023-06-01 16:00:00' },
      { id: 2002, city: '上海', pollutant: 'O3', value: 160, threshold: 150, level: 'warning', createTime: '2023-06-01 15:30:00' },
      { id: 2003, city: '广州', pollutant: 'PM10', value: 215, threshold: 150, level: 'danger', createTime: '2023-06-01 14:20:00' },
      { id: 2004, city: '成都', pollutant: 'NO2', value: 80, threshold: 50, level: 'warning', createTime: '2023-06-01 12:10:00' }
    ])
    
    // 获取警报等级和对应的颜色
    const getAlertLevel = (level) => {
      if (level === 'info') {
        return { text: '信息', color: 'info' }
      } else if (level === 'warning') {
        return { text: '警告', color: 'warning' }
      } else if (level === 'danger') {
        return { text: '危险', color: 'danger' }
      } else {
        return { text: '未知', color: 'info' }
      }
    }
    
    return {
      recentUsers,
      recentAlerts,
      getAlertLevel
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
  color: #f56c6c;
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
  justify-content: space-between;
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
  color: #f56c6c;
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