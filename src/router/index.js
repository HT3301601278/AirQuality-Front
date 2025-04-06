import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import store from '../store'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  {
    path: '/user',
    name: 'userLayout',
    component: () => import('../views/user/UserLayout.vue'),
    meta: { requiresAuth: true, userType: 0 },
    children: [
      {
        path: 'dashboard',
        name: 'userDashboard',
        component: () => import('../views/user/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'realtime',
        name: 'realtime',
        component: () => import('../views/user/Realtime.vue'),
        meta: { title: '实时空气质量' }
      },
      {
        path: 'forecast',
        name: 'forecast',
        component: () => import('../views/user/Forecast.vue'),
        meta: { title: '空气质量预报' }
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('../views/user/History.vue'),
        meta: { title: '历史数据查询' }
      },
      {
        path: 'trends',
        name: 'trends',
        component: () => import('../views/user/Trends.vue'),
        meta: { title: '近期趋势分析' }
      },
      {
        path: 'compare',
        name: 'compare',
        component: () => import('../views/user/Compare.vue'),
        meta: { title: '城市数据对比' }
      },
      {
        path: 'subscriptions',
        name: 'subscriptions',
        component: () => import('../views/user/Subscriptions.vue'),
        meta: { title: '订阅管理' }
      },
      {
        path: 'alerts',
        name: 'alerts',
        component: () => import('../views/user/Alerts.vue'),
        meta: { title: '警报查看' }
      },
      {
        path: 'map',
        name: 'map',
        component: () => import('../views/user/Map.vue'),
        meta: { title: '空气质量地图' }
      }
    ]
  },
  {
    path: '/admin',
    name: 'adminLayout',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, userType: 1 },
    children: [
      {
        path: 'dashboard',
        name: 'adminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '管理员仪表盘' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/admin/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'locations',
        name: 'locations',
        component: () => import('../views/admin/Locations.vue'),
        meta: { title: '位置管理' }
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('../views/admin/Notifications.vue'),
        meta: { title: '通知管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  const userType = store.state.user.userType

  // 检查是否需要认证的路由
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      // 未登录，跳转到登录页
      next({ name: 'login' })
    } else {
      // 检查用户类型
      const requiredUserType = to.matched.find(record => record.meta.userType !== undefined)?.meta.userType

      if (requiredUserType !== undefined && requiredUserType !== userType) {
        // 用户类型不匹配，重定向到相应的仪表盘
        next(userType === 1 ? '/admin/dashboard' : '/user/dashboard')
      } else {
        next() // 继续访问
      }
    }
  } else {
    // 不需要认证的路由
    if (isAuthenticated && to.path === '/login') {
      // 已登录用户访问登录页，重定向到对应的仪表盘
      next(userType === 1 ? '/admin/dashboard' : '/user/dashboard')
    } else {
      next() // 继续访问
    }
  }
})

export default router
