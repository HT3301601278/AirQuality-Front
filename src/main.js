import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import axios from 'axios'

// 配置axios默认设置
axios.defaults.baseURL = 'http://localhost:8080'  // 设置API请求的基础URL
axios.defaults.timeout = 10000  // 设置请求超时时间
axios.defaults.headers.common['Content-Type'] = 'application/json'

// 全局请求拦截器
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 全局响应拦截器
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(store)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 将axios挂载到全局
app.config.globalProperties.$axios = axios

app.mount('#app')
