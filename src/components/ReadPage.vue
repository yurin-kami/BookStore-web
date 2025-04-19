<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_CONFIG } from '../config.js'
import { 
  Download, 
  Back, 
  Moon, 
  Sunny, 
  Plus, 
  Minus, 
  Document, 
  Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const bookId = computed(() => route.params.id)
const book = ref(null)
const loading = ref(true)
const content = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = ref(20) // 修改为每页显示20行
const contentLines = ref([]) // 新增：存储分行后的内容
const darkMode = ref(false)
const fontSize = ref(16)
const viewMode = ref('page') // 'page' 或 'scroll'

// 获取书籍内容
const fetchBookContent = async () => {
  try {
    loading.value = true
    
    // 构建请求数据，符合后端 Book 模型要求
    const requestData = {
      title: "",
      author: "",
      bookname: "",
      book_id: bookId.value,
      tags: []
    }
    
    console.log('请求书籍内容，ID:', bookId.value)
    
    const response = await fetch(`${API_CONFIG.baseURL}/book/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('userToken')}`
      },
      body: JSON.stringify(requestData)
    })
    
    if (response.ok) {
      const data = await response.json()
      book.value = {
        book_id: data.book_id,
        book_name: data.book_name
      }
      content.value = data.book_txt || '暂无内容'
      
      // 将内容按行分割
      contentLines.value = content.value.split('\n')
      
      // 计算总页数 (按行数计算)
      totalPages.value = Math.ceil(contentLines.value.length / pageSize.value) || 1
      
      console.log('获取书籍内容成功，总行数:', contentLines.value.length)
    } else {
      console.error('获取书籍内容失败:', await response.text())
      content.value = '获取内容失败，请稍后再试'
      contentLines.value = ['获取内容失败，请稍后再试']
      totalPages.value = 1
    }
  } catch (error) {
    console.error('获取书籍内容请求出错:', error)
    content.value = '获取内容失败，请稍后再试'
    contentLines.value = ['获取内容失败，请稍后再试']
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

// 获取cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// 切换页面
const changePage = (direction) => {
  if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value--
  } else if (direction === 'next' && currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 切换主题
const toggleTheme = () => {
  darkMode.value = !darkMode.value
}

// 调整字体大小
const adjustFontSize = (action) => {
  if (action === 'increase' && fontSize.value < 24) {
    fontSize.value += 2
  } else if (action === 'decrease' && fontSize.value > 12) {
    fontSize.value -= 2
  }
}

// 切换阅读模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'page' ? 'scroll' : 'page'
}

// 下载内容为TXT
const downloadContent = () => {
  if (!book.value || !content.value) return
  
  const bookName = book.value.book_name || book.value.title || '未知书籍'
  const fileName = `${bookName}.txt`
  const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' })
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  
  // 释放URL对象
  URL.revokeObjectURL(link.href)
}

// 返回书籍详情页
const goBack = () => {
  router.push(`/book/${bookId.value}`)
}

// 计算当前页内容 - 修改为按行分页
const currentContent = computed(() => {
  if (viewMode.value === 'scroll') {
    return content.value
  } else {
    const start = (currentPage.value - 1) * pageSize.value
    const end = Math.min(start + pageSize.value, contentLines.value.length)
    return contentLines.value.slice(start, end).join('\n')
  }
})

// 添加键盘事件处理
const handleKeyDown = (event) => {
  // 只在分页模式下启用键盘翻页
  if (viewMode.value !== 'page') return
  
  if (event.key === 'ArrowLeft') {
    // 左箭头键 - 上一页
    if (currentPage.value > 1) {
      currentPage.value--
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else if (event.key === 'ArrowRight') {
    // 右箭头键 - 下一页
    if (currentPage.value < totalPages.value) {
      currentPage.value++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

onMounted(() => {
  // 验证用户登录状态
  const userToken = getCookie('userToken')
  if (!userToken) {
    router.push('/')
    return
  }
  
  // 获取书籍内容
  fetchBookContent()
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown)
})
// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  // 如果内容很长，可以考虑滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
// 处理每页行数变化
const handlePageSizeChange = (size) => {
  pageSize.value = size
  // 重新计算总页数
  totalPages.value = Math.ceil(contentLines.value.length / pageSize.value) || 1
  // 确保当前页码有效
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}
</script>

<template>
  <div class="read-page" :class="{ 'dark-mode': darkMode }">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <el-button @click="goBack" icon="Back" circle></el-button>
        <h2 v-if="book" class="book-title">{{ book.book_name || book.title }}</h2>
      </div>
      
      <div class="right-tools">
        <el-button @click="toggleViewMode" :icon="viewMode === 'page' ? 'Document' : 'List'" circle></el-button>
        <el-button @click="adjustFontSize('decrease')" icon="Minus" circle></el-button>
        <el-button @click="adjustFontSize('increase')" icon="Plus" circle></el-button>
        <el-button @click="toggleTheme" :icon="darkMode ? 'Sunny' : 'Moon'" circle></el-button>
        <el-dropdown @command="handlePageSizeChange" trigger="click">
          <el-button circle>
            <el-icon><Setting /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="10">每页10行</el-dropdown-item>
              <el-dropdown-item :command="20">每页20行</el-dropdown-item>
              <el-dropdown-item :command="30">每页30行</el-dropdown-item>
              <el-dropdown-item :command="50">每页50行</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button @click="downloadContent" icon="Download" type="primary" circle></el-button>
      </div>
    </div>
    
    <!-- 阅读区域 -->
    <div class="reading-container">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="15" animated />
      </div>
      
      <div v-else class="content-wrapper" :class="{ 'scroll-mode': viewMode === 'scroll' }">
        <div class="glass-panel">
          <div class="content" :style="{ fontSize: `${fontSize}px` }">
            <p>{{ currentContent }}</p>
          </div>
        </div>
        
        <!-- 分页控制 (仅在分页模式下显示) -->
        <div v-if="viewMode === 'page'" class="pagination-controls">
          <el-pagination
            background
            layout="prev, pager, next, jumper, total"
            :total="contentLines.length"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
            :pager-count="5"
            hide-on-single-page
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  transition: background-color 0.3s;
  padding: 20px;
}

.read-page.dark-mode {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.dark-mode .toolbar {
  background: rgba(40, 40, 40, 0.7);
}

.left-tools, .right-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.book-title {
  margin: 0 0 0 15px;
  font-size: 18px;
  font-weight: 600;
}

.dark-mode .book-title {
  color: #e0e0e0;
}

.reading-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  padding: 40px;
}

.content-wrapper {
  position: relative;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-height: 70vh;
}

.dark-mode .glass-panel {
  background: rgba(40, 40, 40, 0.7);
  border: 1px solid rgba(80, 80, 80, 0.3);
}

.content {
  line-height: 1.8;
  text-align: justify;
  white-space: pre-wrap;
}

.dark-mode .content {
  color: #e0e0e0;
}

.scroll-mode .content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 15px;
}

.dark-mode .pagination-controls {
  background: rgba(40, 40, 40, 0.7);
}

.page-info {
  font-size: 16px;
  font-weight: 500;
}

.dark-mode .page-info {
  color: #e0e0e0;
}

/* 自定义滚动条 */
.content::-webkit-scrollbar {
  width: 8px;
}

.content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.dark-mode .content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dark-mode .content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
    padding: 15px;
  }
  
  .left-tools, .right-tools {
    width: 100%;
    justify-content: space-between;
  }
  
  .glass-panel {
    padding: 20px;
  }
  
  .book-title {
    font-size: 16px;
  }
}
</style>