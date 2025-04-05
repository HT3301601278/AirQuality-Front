<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">空气质量监测系统</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">登录</el-button>
        </el-form-item>
        <div class="register-link">
          没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'LoginView',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const loginFormRef = ref(null)
    const loading = ref(false)
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const loginRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    }
    
    const handleLogin = () => {
      loginFormRef.value.validate(async (valid) => {
        if (!valid) return
        
        loading.value = true
        try {
          const response = await axios.post('/api/auth/login', {
            username: loginForm.username,
            password: loginForm.password
          })
          
          if (response.data.code === 200) {
            const { token, user } = response.data.data
            
            // 保存token和用户信息到vuex
            store.commit('setToken', token)
            store.commit('setUser', user)
            
            ElMessage.success('登录成功')
            
            // 根据用户角色跳转到不同页面
            if (user.userType === 1) {
              router.push('/admin/dashboard')
            } else {
              router.push('/user/dashboard')
            }
          } else {
            ElMessage.error(response.data.message || '登录失败')
          }
        } catch (error) {
          console.error('登录错误', error)
          if (error.response && error.response.data) {
            // 处理后端返回的具体错误信息
            const errorData = error.response.data
            ElMessage.error(errorData.message || '登录失败')
          } else {
            ElMessage.error('登录失败，请检查网络连接或联系管理员')
          }
        } finally {
          loading.value = false
        }
      })
    }
    
    return {
      loginForm,
      loginRules,
      loginFormRef,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.title {
  margin-bottom: 30px;
  text-align: center;
  color: #409eff;
  font-size: 24px;
}

.login-form {
  margin-top: 30px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.register-link {
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
}

.register-link a {
  color: #409eff;
  text-decoration: none;
}
</style> 