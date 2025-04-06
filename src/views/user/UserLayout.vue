<template>
  <div class="app-container">
    <el-container class="layout-container">
      <el-aside width="240px" class="sidebar-container">
        <div class="logo-container">
          <h1 class="logo-title">空气质量监测</h1>
        </div>
        <el-menu
          class="sidebar-menu"
          :default-active="$route.path"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/user/map">
            <el-icon><MapLocation /></el-icon>
            <template #title>空气质量地图</template>
          </el-menu-item>

          <el-sub-menu index="data">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>空气质量数据</span>
            </template>
            <el-menu-item index="/user/realtime">实时空气质量</el-menu-item>
            <el-menu-item index="/user/forecast">空气质量预报</el-menu-item>
            <el-menu-item index="/user/history">历史数据查询</el-menu-item>
            <el-menu-item index="/user/trends">近期趋势分析</el-menu-item>
            <el-menu-item index="/user/compare">城市数据对比</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="subscription">
            <template #title>
              <el-icon><Bell /></el-icon>
              <span>订阅与警报</span>
            </template>
            <el-menu-item index="/user/subscriptions">订阅管理</el-menu-item>
            <el-menu-item index="/user/alerts">警报查看</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-container class="main-container">
        <el-header height="60px" class="app-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/user/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="$route.meta && $route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <div class="avatar-container">
                <span class="username">{{ username }}</span>
                <el-avatar :size="30" :src="userAvatar" class="user-avatar">
                  {{ username ? username.charAt(0).toUpperCase() : 'U' }}
                </el-avatar>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$router.push('/user/info')">个人信息</el-dropdown-item>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'

// 导入Element Plus图标
import { Menu, Odometer, DataAnalysis, Bell, MapLocation } from '@element-plus/icons-vue'

export default {
  name: 'UserLayout',
  components: {
    Menu,
    Odometer,
    DataAnalysis,
    Bell,
    MapLocation
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    // 获取用户名
    const username = computed(() => store.state.user.username)

    // 获取用户头像
    const userAvatar = computed(() => store.state.user.avatar)

    // 退出登录
    const handleLogout = () => {
      ElMessageBox.confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        store.commit('logout')
        router.push('/login')
      }).catch(() => {})
    }

    return {
      username,
      userAvatar,
      handleLogout
    }
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

.sidebar-container {
  background-color: #304156;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #304156;
}

.logo-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.sidebar-menu {
  border-right: none;
}

.main-container {
  margin-left: 240px;
  min-height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin-right: 8px;
  color: #606266;
}

.user-avatar {
  background-color: #409EFF;
  color: #fff;
}

.app-main {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}
</style>
