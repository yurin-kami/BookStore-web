<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { API_CONFIG } from '../config.js'
import { useRouter } from 'vue-router'
import { 
  Search, 
  User, 
  HomeFilled, 
  ShoppingBag, 
  Setting, 
  Document, 
  Download, 
  List, 
  Service 
} from '@element-plus/icons-vue'

const router = useRouter()
const username = ref('')
const scale = ref(1)
const books = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 9 // 每页显示9本书
const searchQuery = ref('')
const searchType = ref('title') // 默认按书名搜索
const allTags = ref([]) // 所有可用标签
const selectedTags = ref([]) // 已选择的标签
const jumpToPage = ref(1) // 跳转页码输入
const activeMenu = ref('home') // 当前激活的菜单项

// 处理窗口大小变化，调整缩放比例
const handleResize = () => {
  const width = window.innerWidth
  const height = window.innerHeight
  const baseWidth = 1920 // 基准宽度
  const baseHeight = 1080 // 基准高度
  
  // 计算宽高比例
  const widthScale = width / baseWidth
  const heightScale = height / baseHeight
  
  // 取较小的缩放比例，确保内容完全显示
  scale.value = Math.min(widthScale, heightScale)
}

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/book/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('userToken')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      allTags.value = data.tags || []
      console.log('获取标签成功:', allTags.value)
    } else {
      console.error('获取标签失败:', await response.text())
    }
  } catch (error) {
    console.error('获取标签请求出错:', error)
  }
}

// 获取书籍列表
const fetchBooks = async () => {
  try {
    loading.value = true
    console.log('开始获取第', currentPage.value, '页的书籍')
    
    // 如果有搜索条件，使用对应的搜索接口
    if (searchQuery.value) {
      await searchBooksByCondition()
    }
    // 如果有选择标签，则使用标签筛选接口
    else if (selectedTags.value.length > 0) {
      await fetchBooksByTags()
    } else {
      // 使用后端分页接口获取书籍
      const url = `${API_CONFIG.baseURL}/all_books/${currentPage.value}`
      console.log('请求URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('userToken')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        books.value = data.books || []
        
        // 固定总页数
        totalPages.value = 425
        
        console.log('获取书籍成功:', books.value, '当前页码:', currentPage.value)
      } else {
        console.error('获取书籍失败:', await response.text())
        books.value = []
        totalPages.value = 1
      }
    }
  } catch (error) {
    console.error('获取书籍请求出错:', error)
    books.value = []
    totalPages.value = 1
  } finally {
    loading.value = false  // 确保无论如何都会重置 loading 状态
  }
}

// 根据搜索条件查询书籍
const searchBooksByCondition = async () => {
  try {
    // 根据搜索类型确定API路径
    const endpoint = searchType.value === 'title' 
      ? '/book/search/name' 
      : '/book/search/author'
    
    // 构建请求数据 - 添加tags字段
    const requestData = {
      title: "",
      author: "",
      bookname: "",
      book_id: "",
      tags: [] // 添加tags字段，默认为空数组
    }
    
    // 根据搜索类型设置对应的字段
    if (searchType.value === 'title') {
      requestData.bookname = searchQuery.value
    } else {
      requestData.author = searchQuery.value
    }
    
    console.log(`使用${endpoint}搜索:`, requestData)
    
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('userToken')}`
      },
      body: JSON.stringify(requestData)
    })
    
    if (response.ok) {
      const data = await response.json()
      books.value = data.books || []
      
      // 固定总页数为1，因为搜索结果一次性返回
      totalPages.value = 1
      
      console.log('搜索书籍成功:', books.value)
    } else {
      console.error('搜索书籍失败:', await response.text())
      books.value = []
      totalPages.value = 1
    }
  } catch (error) {
    console.error('搜索书籍请求出错:', error)
    books.value = []
    totalPages.value = 1
  }
}

// 搜索书籍 - 修改此函数避免重复渲染
const searchBooks = () => {
  // 防止重复搜索相同内容
  if (searchQuery.value === '' && currentPage.value === 1) {
    return
  }
  
  // 重置到第一页
  currentPage.value = 1
  
  // 直接调用获取书籍的方法
  fetchBooks()
}

// 根据标签获取书籍
const fetchBooksByTags = async () => {
  try {
    const requestData = {
      title: "",
      author: "",
      bookname: "",
      book_id: "",
      tags: selectedTags.value
    }
    
    // 这里API路径错误，应该是 /all_book/tags 而不是 /all_book/tags
    const response = await fetch(`${API_CONFIG.baseURL}/all_book/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('userToken')}`
      },
      body: JSON.stringify(requestData)
    })
    
    if (response.ok) {
      const data = await response.json()
      const allTaggedBooks = data.books || []
      
      // 如果有搜索条件，在前端过滤
      const filteredBooks = searchQuery.value 
        ? filterBooksBySearch(allTaggedBooks) 
        : allTaggedBooks
      
      // 计算总页数
      totalPages.value = Math.ceil(filteredBooks.length / pageSize) || 1
      
      // 前端分页处理
      const startIndex = (currentPage.value - 1) * pageSize
      const endIndex = startIndex + pageSize
      books.value = filteredBooks.slice(startIndex, endIndex)
      
      console.log('根据标签获取书籍成功:', books.value, '总数:', filteredBooks.length, '当前页:', currentPage.value, '总页数:', totalPages.value)
    } else {
      console.error('根据标签获取书籍失败:', await response.text())
      // 如果没有找到书籍，清空列表
      books.value = []
      totalPages.value = 1
    }
  } catch (error) {
    console.error('根据标签获取书籍请求出错:', error)
    books.value = []
    totalPages.value = 1
  }
  // 注意：不在这里设置 loading.value = false，而是让调用方在 finally 块中处理
}

// 根据搜索条件过滤书籍
const filterBooksBySearch = (bookList) => {
  if (!searchQuery.value) return bookList
  
  return bookList.filter(book => {
    if (searchType.value === 'title') {
      // 按书名搜索
      return book.book_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
             book.title?.toLowerCase().includes(searchQuery.value.toLowerCase())
    } else {
      // 按作者搜索
      return book.book_author?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
             book.author?.toLowerCase().includes(searchQuery.value.toLowerCase())
    }
  })
}

// 安全地获取书籍标签
const getBookTags = (book) => {
  let tags = book.book_tags || book.tags || [];
  
  // 检查是否为数组
  if (!Array.isArray(tags)) {
    // 如果是字符串，尝试拆分
    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim());
    } else {
      // 如果既不是数组也不是字符串，返回空数组
      tags = [];
    }
  }
  
  // 确保每个标签都是字符串并去除空格
  return tags.map(t => typeof t === 'string' ? t.trim() : String(t));
}

// 切换页码
const changePage = (page) => {
  console.log('切换到页码:', page)
  // 确保页码在有效范围内
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  
  // 更新当前页码
  currentPage.value = page
  
  // 添加延迟确保页码更新后再获取数据
  setTimeout(() => {
    console.log('实际请求页码:', currentPage.value)
    fetchBooks()
  }, 0)
}

// 跳转到指定页
const handleJumpToPage = () => {
  // 确保输入的页码是有效的数字
  let page = parseInt(jumpToPage.value) || 1
  
  // 限制页码范围
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  
  // 更新当前页码并获取数据
  currentPage.value = page
  fetchBooks()
  
  // 清空输入框
  jumpToPage.value = ''
}

// 处理每页显示数量变化
const handleSizeChange = (size) => {
  pageSize = size
  currentPage.value = 1 // 切换每页数量时重置为第一页
  fetchBooks()
}

// 切换标签选择
const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    // 添加标签
    selectedTags.value.push(tag)
  } else {
    // 移除标签
    selectedTags.value.splice(index, 1)
  }
  
  // 重置到第一页并重新获取书籍
  currentPage.value = 1
  fetchBooks()
}

// 清空所有已选标签
const clearTags = () => {
  selectedTags.value = []
  currentPage.value = 1
  fetchBooks()
}

// 退出登录
const handleLogout = () => {
  // 清除cookie
  document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  // 跳转到登录页
  router.push('/')
}

// 获取cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// 解码base64获取用户名
const decodeUsername = (base64String) => {
  try {
    return atob(base64String)
  } catch (e) {
    console.error('解码用户名失败:', e)
    return '未知用户'
  }
}

// 计算分页显示
const paginationRange = computed(() => {
  const range = []
  const maxVisiblePages = 5
  
  let start = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  let end = Math.min(totalPages.value, start + maxVisiblePages - 1)
  
  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  
  return range
})

// 菜单项点击处理
const handleMenuClick = (menuName) => {
  activeMenu.value = menuName
  // 这里可以根据不同菜单项执行不同操作
}

// 查看书籍详情
const viewBookDetail = (bookId) => {
  router.push(`/book/${bookId}`)
}

onMounted(() => {
  console.log('组件挂载开始')
  handleResize() // 初始化缩放
  window.addEventListener('resize', handleResize)
  
  // 验证用户登录状态
  const userToken = getCookie('userToken')
  if (!userToken) {
    // 没有找到token，跳转到登录页
    console.log('未找到用户令牌，准备跳转到登录页')
    router.push('/')
    return
  }
  
  // 解码用户名
  username.value = decodeUsername(userToken)
  console.log('当前用户:', username.value)
  
  // 获取所有标签
  console.log('开始获取标签')
  fetchTags()
  
  // 获取书籍列表
  console.log('开始获取书籍列表')
  fetchBooks()
  console.log('组件挂载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="bookstore-container">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <!-- 用户信息 -->
      <div class="user-profile">
        <div class="avatar">
          <img src="../assets/logo.jpg" alt="Avatar">
        </div>
        <div class="user-details">
          <div class="username">{{ username }}</div>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </div>
      
      <!-- 搜索栏 -->
      <div class="search-section">
        <div class="search-container">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索图书..." 
            @keyup.enter="searchBooks"
          >
            <template #append>
              <el-button @click="searchBooks">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="search-type">
          <el-radio-group v-model="searchType" size="small">
            <el-radio-button value="title">书名</el-radio-button>
            <el-radio-button value="author">作者</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 标签筛选 -->
      <div class="tags-section">
        <div class="tags-header">
          <h3>标签筛选</h3>
          <el-button 
            v-if="selectedTags.length > 0" 
            type="info" 
            size="small" 
            @click="clearTags"
          >清空</el-button>
        </div>
        <div class="tags-container">
          <el-tag
            v-for="tag in allTags" 
            :key="tag" 
            :type="selectedTags.includes(tag) ? 'primary' : 'info'"
            effect="light"
            class="tag-item"
            :class="{ active: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 加载中提示 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>
      <!-- 书籍列表 -->
      <div v-else>
        <div v-if="books.length === 0" class="no-books">
          <el-empty description="暂无符合条件的图书">
            <el-button type="primary" @click="clearTags">重置筛选条件</el-button>
          </el-empty>
        </div>
        
        <div v-else class="book-grid">
          <!-- 在书籍卡片中添加点击事件，跳转到详情页 -->
          <div v-for="book in books" :key="book.book_id || book.id" class="book-card" @click="viewBookDetail(book.book_id || book.id)">
            <div class="book-cover">
              <img :src="book.book_cover || book.coverUrl || '../assets/default-book.jpg'" :alt="book.book_name || book.title">
              <div class="book-hover-info">
                <h4>{{ book.book_name || book.title }}</h4>
                <p class="hover-author">作者: {{ book.book_author || book.author }}</p>
                <div class="hover-tags">
                  <el-tag 
                    v-for="tag in getBookTags(book)" 
                    :key="tag" 
                    size="small" 
                    effect="plain"
                    class="hover-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <p class="hover-synopsis">{{ book.book_synopsis || '暂无简介' }}</p>
                <el-button type="primary" size="small" class="hover-detail-btn">查看详情</el-button>
              </div>
            </div>
          </div>
          
          <!-- 删除这里错误放置的JavaScript代码 -->
        </div>
        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, jumper"
            :total="totalPages * 10"
            :current-page="currentPage"
            :page-size="10"
            @current-change="changePage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookstore-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  padding: 0;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
  z-index: 10;
}

.sidebar-header {
  padding: 20px 15px;
  border-bottom: 1px solid #eaeaea;
  text-align: center;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.menu-section {
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
}

.menu-group {
  padding: 10px 0;
  border-bottom: 1px solid #eaeaea;
}

.group-title {
  padding: 0 20px;
  margin-bottom: 5px;
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.menu-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
  border-left: 3px solid #409EFF;
}

.menu-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

/* 搜索栏样式 */
.search-section {
  padding: 15px;
  border-bottom: 1px solid #eaeaea;
}

.search-container {
  margin-bottom: 10px;
}

.search-type {
  display: flex;
  justify-content: center;
}

/* 标签筛选样式 */
.tags-section {
  padding: 15px;
  border-bottom: 1px solid #eaeaea;
  flex: 1;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tags-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  margin-right: 5px;
  margin-bottom: 5px;
}

.tag-item.active {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}

/* 用户信息样式 */
.user-profile {
  display: flex;
  align-items: center;
  padding: 15px;
  border-top: 1px solid #eaeaea;
  margin-top: auto;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 300px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.loading {
  padding: 40px;
}

.no-books {
  text-align: center;
  padding: 40px;
}

/* 书籍网格样式 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px; /* 保留展示格之间的间距 */
  padding: 10px 0;
  margin-bottom: 20px;
}

.book-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  height: 260px;
  padding: 0; /* 移除内部填充 */
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.book-cover {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  margin: 0; /* 移除边距 */
  border-radius: 8px; /* 保持与卡片相同的圆角 */
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
  display: block; /* 移除图片底部可能的间隙 */
}

.book-hover-info {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  opacity: 0;
  transition: opacity 0.3s;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-radius: 8px; /* 保持与卡片相同的圆角 */
}

.book-card:hover .book-hover-info {
  opacity: 1;
}

.book-hover-info h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
}

.hover-author {
  font-size: 14px;
  margin-bottom: 10px;
}

.hover-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.hover-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.hover-synopsis {
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  flex: 1;
  margin-bottom: 10px;
}

.hover-detail-btn {
  align-self: center;
  margin-top: auto;
}

/* 响应式设计调整 */
@media (max-width: 1200px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .sidebar {
    width: 250px;
  }
  
  .main-content {
    margin-left: 270px;
  }
}

@media (max-width: 576px) {
  .sidebar {
    width: 100%;
    position: relative;
    height: auto;
  }
  
  .main-content {
    margin-left: 0;
  }
}
.book-info {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
}

.book-tag {
  margin-right: 5px;
}

.more-tags {
  font-size: 12px;
  color: #909399;
  padding: 0 5px;
}

.book-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
}

.book-actions .el-button {
  flex: 1;
}

/* 标签样式 */
.tag-item {
  cursor: pointer;
  margin-right: 5px;
  margin-bottom: 5px;
}

.tag-item.active {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}

/* 响应式设计调整 */
@media (max-width: 1200px) {
  .book-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .book-cover {
    height: 220px;
  }
}

@media (max-width: 768px) {
  .book-grid {
    grid-template-columns: 1fr;
  }
  
  .book-cover {
    height: 200px;
  }
  
  .book-actions {
    flex-direction: column;
  }
}
</style>