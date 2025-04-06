<template>
  <div class="user-info-container">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span class="title">个人信息</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="user-form"
      >
        <el-form-item label="头像">
          <div class="avatar-wrapper">
            <el-avatar :size="100" :src="avatarPreview || userAvatar" class="avatar">
              {{ username ? username.charAt(0).toUpperCase() : 'U' }}
            </el-avatar>
            <div class="upload-area">
              <input 
                type="file" 
                ref="fileInput" 
                accept="image/*" 
                style="display: none" 
                @change="handleFileSelected"
              />
              <el-button type="primary" size="small" @click="triggerFileInput">更换头像</el-button>
              <span v-if="selectedFileName" class="file-name">已选择: {{ selectedFileName }}</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="用户名">
          <el-input v-model="username" disabled />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入新的邮箱地址" />
        </el-form-item>
        
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input 
            v-model="form.currentPassword" 
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="form.newPassword" 
            type="password"
            placeholder="请输入新密码（可选）"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'UserInfo',
  setup() {
    const store = useStore()
    const formRef = ref(null)
    const fileInput = ref(null)
    const loading = ref(false)
    const avatarBase64 = ref('')
    const avatarPreview = ref('')
    const selectedFileName = ref('')
    
    // 从 Vuex store 获取用户信息
    const username = computed(() => store.state.user.username)
    const userEmail = computed(() => store.state.user.email)
    const userAvatar = computed(() => store.state.user.avatar)
    
    const form = ref({
      email: '',
      currentPassword: '',
      newPassword: ''
    })
    
    // 初始化表单数据
    onMounted(() => {
      form.value.email = userEmail.value
    })
    
    // 表单验证规则
    const rules = {
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
      ],
      newPassword: [
        { required: false },
        { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
      ]
    }
    
    // 触发文件选择
    const triggerFileInput = () => {
      fileInput.value.click()
    }
    
    // 处理文件选择
    const handleFileSelected = (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      const isImage = file.type.startsWith('image/')
      const isLt10M = file.size / 1024 / 1024 < 10
      
      if (!isImage) {
        ElMessage.error('只能上传图片文件！')
        return
      }
      
      if (!isLt10M) {
        ElMessage.error('图片大小不能超过 10MB！')
        return
      }
      
      selectedFileName.value = file.name
      
      // 读取文件并转为Base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        avatarBase64.value = e.target.result
        avatarPreview.value = e.target.result
        console.log('头像已读取为Base64格式')
      }
    }
    
    // 提交表单
    const handleSubmit = async () => {
      if (!form.value.currentPassword) {
        ElMessage.warning('请输入当前密码')
        return
      }
      
      try {
        await formRef.value.validate()
        loading.value = true
        
        // 构建请求数据
        const data = {
          currentPassword: form.value.currentPassword,
          email: form.value.email
        }
        
        if (form.value.newPassword) {
          data.newPassword = form.value.newPassword
        }
        
        if (avatarBase64.value) {
          data.avatarBase64 = avatarBase64.value
          console.log('包含头像数据，长度：', avatarBase64.value.length)
        }
        
        console.log('提交数据:', Object.keys(data))
        
        const response = await axios.put('/api/user/info', data)
        
        const result = response.data
        
        if (result.code === 200) {
          ElMessage.success('个人信息修改成功')
          // 更新 Vuex store 中的用户信息
          store.commit('updateUserInfo', result.data)
          // 清空密码字段
          form.value.currentPassword = ''
          form.value.newPassword = ''
          // 更新邮箱显示
          form.value.email = result.data.email
          // 清空暂存的头像数据
          avatarBase64.value = ''
          avatarPreview.value = result.data.avatar
          selectedFileName.value = ''
        } else {
          ElMessage.error(result.message || '修改失败')
        }
      } catch (error) {
        console.error('修改个人信息失败:', error)
        if (error.response && error.response.data) {
          ElMessage.error(error.response.data.message || '修改失败')
        } else {
          ElMessage.error('修改失败，请重试')
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      username,
      userAvatar,
      form,
      formRef,
      fileInput,
      rules,
      loading,
      avatarPreview,
      selectedFileName,
      triggerFileInput,
      handleFileSelected,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.user-info-container {
  padding: 20px;
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-card {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0 20px;
}

.avatar {
  margin-bottom: 15px;
  background-color: #409EFF;
  color: #fff;
  border: 2px solid #eaeaea;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.file-name {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.user-form {
  margin-top: 10px;
}

.user-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.user-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
}

.user-form :deep(.el-button) {
  padding: 12px 20px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .info-card {
    margin: 0 10px;
  }
  
  .user-info-container {
    padding: 10px;
  }
}
</style> 