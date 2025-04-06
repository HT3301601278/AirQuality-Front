<template>
  <div class="notifications-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>通知管理</span>
          <el-button type="primary" size="small" @click="openAddDialog">添加通知</el-button>
        </div>
      </template>
      
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索通知标题"
          class="search-input"
          clearable
          @clear="getNotifications"
        >
          <template #append>
            <el-button icon="el-icon-search" @click="getNotifications"></el-button>
          </template>
        </el-input>
        
        <el-select v-model="statusFilter" placeholder="通知状态" @change="getNotifications" clearable>
          <el-option label="已发布" :value="1"></el-option>
          <el-option label="草稿" :value="0"></el-option>
        </el-select>
      </div>

      <!-- 通知列表 -->
      <el-table :data="notificationList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
        <el-table-column prop="content" label="内容" show-overflow-tooltip></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalItems">
        </el-pagination>
      </div>
    </el-card>
    
    <!-- 添加/编辑通知对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加通知' : '编辑通知'"
      v-model="dialogVisible"
      width="50%"
    >
      <el-form :model="notificationForm" :rules="rules" ref="notificationFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="notificationForm.title" placeholder="请输入通知标题"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input 
            type="textarea" 
            v-model="notificationForm.content" 
            placeholder="请输入通知内容"
            :rows="4"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="notificationForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="发布"
            inactive-text="草稿"
          ></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Notifications',
  setup() {
    // 数据列表和加载状态
    const notificationList = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add') // add 或 edit
    const searchKeyword = ref('')
    const statusFilter = ref('')
    
    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalItems = ref(0)
    
    // 表单相关
    const notificationFormRef = ref(null)
    const notificationForm = reactive({
      id: null,
      title: '',
      content: '',
      status: 1
    })
    
    const rules = {
      title: [
        { required: true, message: '请输入通知标题', trigger: 'blur' },
        { min: 2, max: 50, message: '标题长度在2到50个字符之间', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入通知内容', trigger: 'blur' }
      ]
    }
    
    // 获取通知列表
    const getNotifications = async () => {
      loading.value = true
      
      try {
        // 假设API为 /api/admin/notifications
        // const { data } = await fetch(`/api/admin/notifications?page=${currentPage.value}&size=${pageSize.value}&keyword=${searchKeyword.value}&status=${statusFilter.value}`)
        
        // 模拟数据，实际项目中替换为真实API调用
        setTimeout(() => {
          notificationList.value = Array(10).fill(null).map((_, index) => ({
            id: index + 1,
            title: `通知标题 ${index + 1}`,
            content: `这是通知内容示例，实际中将从API获取数据。这是通知 ${index + 1} 的详细内容。`,
            createTime: new Date(Date.now() - index * 86400000).toISOString(),
            status: index % 3 ? 1 : 0
          }))
          
          totalItems.value = 100
          loading.value = false
        }, 500)
      } catch (error) {
        console.error('获取通知列表失败:', error)
        ElMessage.error('获取通知列表失败')
        loading.value = false
      }
    }
    
    // 打开添加对话框
    const openAddDialog = () => {
      dialogType.value = 'add'
      resetForm()
      dialogVisible.value = true
    }
    
    // 编辑通知
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      notificationForm.id = row.id
      notificationForm.title = row.title
      notificationForm.content = row.content
      notificationForm.status = row.status
      dialogVisible.value = true
    }
    
    // 删除通知
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除通知 "${row.title}" 吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 假设API为 /api/admin/notifications/{id}
          // await fetch(`/api/admin/notifications/${row.id}`, { method: 'DELETE' })
          
          // 模拟删除成功
          ElMessage.success('删除成功')
          getNotifications()
        } catch (error) {
          console.error('删除通知失败:', error)
          ElMessage.error('删除通知失败')
        }
      }).catch(() => {
        // 用户取消删除
      })
    }
    
    // 提交表单
    const submitForm = async () => {
      if (!notificationFormRef.value) return
      
      notificationFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const isAdd = dialogType.value === 'add'
            // const url = isAdd ? '/api/admin/notifications' : `/api/admin/notifications/${notificationForm.id}`
            // const method = isAdd ? 'POST' : 'PUT'
            
            // await fetch(url, {
            //   method,
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(notificationForm)
            // })
            
            // 模拟添加/编辑成功
            ElMessage.success(isAdd ? '添加成功' : '更新成功')
            dialogVisible.value = false
            getNotifications()
          } catch (error) {
            console.error('保存通知失败:', error)
            ElMessage.error('保存失败')
          }
        }
      })
    }
    
    // 重置表单
    const resetForm = () => {
      if (notificationFormRef.value) {
        notificationFormRef.value.resetFields()
      }
      notificationForm.id = null
      notificationForm.title = ''
      notificationForm.content = ''
      notificationForm.status = 1
    }
    
    // 分页相关
    const handleSizeChange = (size) => {
      pageSize.value = size
      getNotifications()
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
      getNotifications()
    }
    
    // 日期格式化
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
    
    onMounted(() => {
      getNotifications()
    })

    return {
      notificationList,
      loading,
      dialogVisible,
      dialogType,
      searchKeyword,
      statusFilter,
      currentPage,
      pageSize,
      totalItems,
      notificationFormRef,
      notificationForm,
      rules,
      getNotifications,
      openAddDialog,
      handleEdit,
      handleDelete,
      submitForm,
      handleSizeChange,
      handleCurrentChange,
      formatDate
    }
  }
}
</script>

<style scoped>
.notifications-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-input {
  max-width: 300px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.content {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}
</style> 