<template>
  <div class="register-container">
    <div class="register-box">
      <h2 class="title">空气质量监测系统</h2>
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" class="register-form">
        <div class="form-header">
          <div class="avatar-container">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" />
            <div v-else class="avatar-placeholder">
              <el-icon><Avatar /></el-icon>
            </div>
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/jpeg,image/png,image/gif,image/jpg">
              <div class="upload-icon">
                <el-icon><Plus /></el-icon>
              </div>
            </el-upload>
          </div>
        </div>
        
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入电子邮箱">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="register-button" @click="handleRegister">注册</el-button>
        </el-form-item>
        <div class="login-link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Avatar, Upload, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'RegisterView',
  components: {
    User,
    Lock,
    Message,
    Avatar,
    Upload,
    Plus
  },
  setup() {
    const router = useRouter()
    const registerFormRef = ref(null)
    const loading = ref(false)
    const avatarFile = ref(null)
    const avatarUrl = ref('')
    
    const registerForm = reactive({
      username: '',
      password: '',
      confirmPassword: '',
      email: ''
    })
    
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== registerForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }
    
    const registerRules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 100, message: '密码长度必须在6-100个字符之间', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validatePass2, trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入电子邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的电子邮箱格式', trigger: 'blur' }
      ]
    }
    
    const handleAvatarChange = (file) => {
      avatarFile.value = file.raw
      avatarUrl.value = URL.createObjectURL(file.raw)
    }
    
    const handleRegister = () => {
      registerFormRef.value.validate(async (valid) => {
        if (!valid) return
        
        loading.value = true
        try {
          // 创建FormData对象用于提交表单数据
          const formData = new FormData()
          formData.append('username', registerForm.username)
          formData.append('password', registerForm.password)
          formData.append('email', registerForm.email)
          
          // 如果有头像，添加到表单数据中
          if (avatarFile.value) {
            formData.append('avatar', avatarFile.value)
          }
          
          // 使用register-form接口直接上传表单和头像
          const response = await axios.post('/api/auth/register-form', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          
          if (response.data.code === 200) {
            ElMessage.success('注册成功，请登录')
            router.push('/login')
          } else {
            ElMessage.error(response.data.message || '注册失败')
          }
        } catch (error) {
          console.error('注册错误', error)
          if (error.response && error.response.data) {
            const errorData = error.response.data
            if (errorData.data && typeof errorData.data === 'object') {
              const validationErrors = Object.values(errorData.data).join(', ')
              ElMessage.error(validationErrors)
            } else {
              ElMessage.error(errorData.message || '注册失败')
            }
          } else {
            ElMessage.error('注册失败，请检查网络连接或联系管理员')
          }
        } finally {
          loading.value = false
        }
      })
    }
    
    return {
      registerForm,
      registerRules,
      registerFormRef,
      loading,
      handleRegister,
      avatarUrl,
      handleAvatarChange
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
}

.register-box {
  width: 450px;
  padding: 40px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.title {
  margin-bottom: 25px;
  text-align: center;
  color: #409eff;
  font-size: 26px;
  font-weight: 600;
}

.register-form {
  margin-top: 20px;
}

.form-header {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 10px;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e1f3ff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 3px dashed #d9d9d9;
}

.avatar-placeholder .el-icon {
  font-size: 50px;
  color: #909399;
}

.avatar-uploader {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #409eff;
  background-color: #fff;
  border: 1px solid #d9ecff;
  border-radius: 50%;
}

.upload-icon:hover {
  background-color: #ecf5ff;
}

.register-button {
  width: 100%;
  margin-top: 15px;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.login-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input :deep(.el-input__wrapper) {
  padding: 0 15px;
  height: 44px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  border-radius: 8px;
}

.el-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.el-input :deep(.el-input__prefix) {
  padding: 0 8px 0 0;
}
</style> 