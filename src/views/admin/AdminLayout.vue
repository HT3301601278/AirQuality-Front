<template>
  <div class="app-container">
    <el-container class="layout-container">
      <el-aside width="240px" class="sidebar-container">
        <div class="logo-container">
          <h1 class="logo-title">管理员控制台</h1>
        </div>
        <el-menu
          class="sidebar-menu"
          :default-active="$route.path"
          router
          background-color="#001529"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/locations">
            <el-icon><Location /></el-icon>
            <template #title>位置管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/alerts">
            <el-icon><Warning /></el-icon>
            <template #title>警报管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/notifications">
            <el-icon><Bell /></el-icon>
            <template #title>通知管理</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container class="main-container">
        <el-header height="60px" class="app-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="$route.meta && $route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <div class="avatar-container">
                <span class="username">{{ username }} (管理员)</span>
                <el-avatar :size="30" :src="userAvatar" class="user-avatar">
                  {{ username ? username.charAt(0).toUpperCase() : 'A' }}
                </el-avatar>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
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
import { Odometer, User, Location, Warning, Bell } from '@element-plus/icons-vue'

export default {
  name: 'AdminLayout',
  components: {
    Odometer,
    User,
    Location,
    Warning,
    Bell
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
  background-color: #001529;
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
  background-color: #001529;
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
  background-color: #f56c6c;
  color: #fff;
}

.app-main {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}
</style> 