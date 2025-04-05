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
            
            // 检查是否有待上传的头像
            const pendingAvatar = localStorage.getItem('pendingAvatar')
            const pendingUsername = localStorage.getItem('pendingAvatarUsername')
            
            if (pendingAvatar && pendingUsername === user.username) {
              try {
                // 从Base64字符串转回文件对象
                const dataURLtoFile = (dataurl, filename) => {
                  const arr = dataurl.split(',')
                  const mime = arr[0].match(/:(.*?);/)[1]
                  const bstr = atob(arr[1])
                  let n = bstr.length
                  const u8arr = new Uint8Array(n)
                  while (n--) {
                    u8arr[n] = bstr.charCodeAt(n)
                  }
                  return new File([u8arr], filename, { type: mime })
                }
                
                // 创建文件对象并上传
                const avatarFile = dataURLtoFile(pendingAvatar, 'avatar.jpg')
                const formData = new FormData()
                formData.append('file', avatarFile)
                
                const uploadResponse = await axios.post('/api/user/avatar', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                if (uploadResponse.data.code === 200) {
                  // 更新用户信息中的头像
                  store.commit('setUser', uploadResponse.data.data)
                  ElMessage.success('登录成功并上传了头像')
                } else {
                  ElMessage.warning('登录成功，但头像上传失败：' + uploadResponse.data.message)
                }
                
                // 清除localStorage中的临时头像数据
                localStorage.removeItem('pendingAvatar')
                localStorage.removeItem('pendingAvatarUsername')
              } catch (uploadError) {
                console.error('头像上传错误', uploadError)
                ElMessage.warning('登录成功，但头像上传失败')
                localStorage.removeItem('pendingAvatar')
                localStorage.removeItem('pendingAvatarUsername')
              }
            } else {
              ElMessage.success('登录成功')
            }
            
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