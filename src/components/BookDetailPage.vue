<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_CONFIG } from '../config.js'
import { ArrowLeft, Star, StarFilled, ShoppingCart, Share } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const bookId = computed(() => route.params.id)
const book = ref(null)
const loading = ref(true)
const recommendedBooks = ref([])
const scale = ref(1)

// 支付相关变量
const paymentLoading = ref(false)
const paymentProgress = ref(0)
const paymentStatus = ref('')
const paymentText = ref('支付中...')

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

// 处理立即购买
const handleBuyNow = () => {
  paymentLoading.value = true
  paymentProgress.value = 0
  paymentStatus.value = ''
  paymentText.value = '支付中...'
  
  // 模拟支付进度
  const interval = setInterval(() => {
    paymentProgress.value += 10
    
    if (paymentProgress.value >= 100) {
      clearInterval(interval)
      paymentStatus.value = 'success'
      paymentText.value = '支付成功！即将跳转到阅读页面...'
      
      // 延迟跳转到阅读页面
      setTimeout(() => {
        paymentLoading.value = false
        router.push(`/read/${bookId.value}`)
      }, 1500)
    }
  }, 300)
}

// 获取cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

// 生成随机价格 (150-200元)
const generateRandomPrice = () => {
  return (Math.random() * 50 + 150).toFixed(2)
}

// 获取书籍详情
const fetchBookDetail = async () => {
  try {
    loading.value = true
    console.log('获取书籍详情，ID:', bookId.value)
    
    // 构建符合Book模型的请求体
    const requestData = {
      title: "",
      author: "",
      bookname: "",
      book_id: bookId.value,
      tags: []
    }
    
    const response = await fetch(`${API_CONFIG.baseURL}/book/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCookie('userToken')}`
      },
      body: JSON.stringify(requestData)
    })
    
    if (response.ok) {
      const data = await response.json()
      // 检查返回数据结构
      console.log('书籍详情原始数据:', data)
      
      // 根据实际返回的数据结构调整
      if (data.book) {
        book.value = data.book
      } else if (data.books && data.books.length > 0) {
        book.value = data.books[0]
      } else {
        book.value = data // 如果直接返回书籍对象
      }
      
      // 添加随机价格用于测试
      book.value.price = generateRandomPrice()
      
      console.log('处理后的书籍详情:', book.value)
      
      // 获取推荐书籍
      await fetchRecommendedBooks()
    } else {
      console.error('获取书籍详情失败:', await response.text())
      book.value = null
    }
  } catch (error) {
    console.error('获取书籍详情请求出错:', error)
    book.value = null
  } finally {
    loading.value = false
  }
}

// 获取推荐书籍（根据标签相似度）
const fetchRecommendedBooks = async () => {
  try {
    if (!book.value) {
      console.log('没有书籍数据，无法获取推荐')
      return
    }
    
    // 获取当前书籍的标签
    let tags = []
    if (book.value.book_tags) {
      if (Array.isArray(book.value.book_tags)) {
        tags = book.value.book_tags
      } else if (typeof book.value.book_tags === 'string') {
        tags = book.value.book_tags.split(',').map(t => t.trim())
      }
    }
    
    if (tags.length === 0) {
      console.log('没有标签数据，无法获取相似推荐')
      return
    }
    
    console.log('使用标签获取推荐书籍:', tags)
    
    // 使用标签获取相似书籍
    const requestData = {
      title: "",
      author: "",
      bookname: "",
      book_id: "",
      tags: tags
    }
    
    // 修正API路径，使用 all_book/tags 而不是 all_books/tags
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
      console.log('推荐书籍原始数据:', data)
      
      // 过滤掉当前书籍
      recommendedBooks.value = (data.books || [])
        .filter(b => b.book_id !== book.value.book_id)
        .slice(0, 6) // 最多显示6本推荐书籍
      
      // 为推荐书籍添加随机价格
      recommendedBooks.value.forEach(book => {
        book.price = generateRandomPrice()
      })
      
      console.log('处理后的推荐书籍:', recommendedBooks.value)
    } else {
      console.error('获取推荐书籍失败:', await response.text())
      recommendedBooks.value = []
    }
  } catch (error) {
    console.error('获取推荐书籍请求出错:', error)
    recommendedBooks.value = []
  }
}

// 返回书店页面
const goBack = () => {
  // 使用 history.back() 返回上一页，保留之前的筛选条件和页码
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // 如果没有历史记录，则直接跳转到书店页面
    router.push('/bookstore')
  }
}

// 安全地获取书籍标签
const getBookTags = (book) => {
  if (!book) return []
  
  let tags = book.book_tags || book.tags || []
  
  // 检查是否为数组
  if (!Array.isArray(tags)) {
    // 如果是字符串，尝试拆分
    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim())
    } else {
      // 如果既不是数组也不是字符串，返回空数组
      tags = []
    }
  }
  
  // 确保每个标签都是字符串并去除空格
  return tags.map(t => typeof t === 'string' ? t.trim() : String(t))
}

// 查看推荐书籍详情
const viewBookDetail = (bookId) => {
  router.push(`/book/${bookId}`)
}


onMounted(() => {
  console.log('书籍详情页组件挂载开始')
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
  
  // 获取书籍详情
  fetchBookDetail()
  console.log('书籍详情页组件挂载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="book-detail-container" :style="{ transform: `scale(${scale})` }">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button @click="goBack" icon="ArrowLeft" round>返回书店</el-button>
    </div>
    
    <!-- 加载中提示 -->
    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 书籍详情 -->
    <div v-else-if="book" class="book-detail">
      <!-- 主要信息区域 -->
      <div class="main-info">
        <!-- 左侧封面 -->
        <div class="book-cover">
          <img :src="book.book_cover || '../assets/default-book.jpg'" :alt="book.book_name">
        </div>
        
        <!-- 右侧信息 -->
        <div class="book-info">
          <h1 class="book-title">{{ book.book_name }}</h1>
          <div class="book-meta">
            <p class="book-author">作者: {{ book.book_author }}</p>
            <div class="book-tags">
              <el-tag 
                v-for="tag in getBookTags(book)" 
                :key="tag" 
                size="small" 
                effect="light"
                class="book-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <div class="book-price">
            <span class="price-label">价格:</span>
            <span class="price-value">¥{{ book.price }}</span>
          </div>
          
          <!-- 在书籍详情页的购买按钮部分添加点击事件 -->
          <div class="book-actions">
            <el-button type="primary" size="large" icon="ShoppingCart">加入购物车</el-button>
            <el-button type="success" size="large" @click="handleBuyNow">立即购买</el-button>
            <el-button icon="Star" circle></el-button>
            <el-button icon="Share" circle></el-button>
          </div>
          
          <!-- 添加支付加载对话框 -->
          <el-dialog
            v-model="paymentLoading"
            title="支付处理中"
            width="30%"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
          >
            <div class="payment-loading">
              <el-progress type="circle" :percentage="paymentProgress" :status="paymentStatus"></el-progress>
              <p class="payment-text">{{ paymentText }}</p>
            </div>
          </el-dialog>
        </div>
      </div>
      
      <!-- 书籍简介 -->
      <div class="book-synopsis">
        <h2>内容简介</h2>
        <div class="synopsis-content">
          <p>{{ book.book_synopsis || '暂无简介' }}</p>
        </div>
      </div>
      
      <!-- 推荐书籍 -->
      <div class="recommended-books" v-if="recommendedBooks.length > 0">
        <h2>相似推荐</h2>
        <div class="recommended-grid">
          <div 
            v-for="recBook in recommendedBooks" 
            :key="recBook.book_id" 
            class="recommended-book"
            @click="viewBookDetail(recBook.book_id)"
          >
            <div class="rec-book-cover">
              <img :src="recBook.book_cover || '../assets/default-book.jpg'" :alt="recBook.book_name">
            </div>
            <div class="rec-book-info">
              <h4 class="rec-book-title">{{ recBook.book_name }}</h4>
              <p class="rec-book-author">{{ recBook.book_author }}</p>
              <p class="rec-book-price">¥{{ recBook.price }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 书籍不存在 -->
    <div v-else class="book-not-found">
      <el-empty description="未找到该书籍">
        <el-button type="primary" @click="goBack">返回书店</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.book-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.7);
  min-height: 90vh;
  transform-origin: center;
  position: relative;
  
  /* 亚克力/毛玻璃效果 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  /* 圆角边框 */
  border-radius: 30px;
  
  /* 阴影效果增强立体感 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  /* 确保内容居中 */
  display: flex;
  flex-direction: column;
  
  /* 边框效果 */
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 添加背景图层，增强毛玻璃效果的视觉体验 */
.book-detail-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  z-index: -1;
}

.back-button {
  margin-bottom: 20px;
}

.loading {
  padding: 40px;
}

.book-not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

/* 主要信息区域样式 */
.main-info {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.5);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.book-cover {
  flex: 0 0 300px;
  height: 400px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.book-cover:hover {
  transform: translateY(-5px);
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.7);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.book-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.book-meta {
  margin-bottom: 20px;
}

.book-author {
  font-size: 18px;
  color: #666;
  margin-bottom: 10px;
}

.book-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.book-tag {
  margin-right: 5px;
}

.book-price {
  margin-bottom: 30px;
  padding: 15px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.price-label {
  font-size: 16px;
  color: #666;
}

.price-value {
  font-size: 28px;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 10px;
}

.book-actions {
  display: flex;
  gap: 15px;
  margin-top: auto;
}

/* 书籍简介样式 */
.book-synopsis {
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.5);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 推荐书籍样式 */
.recommended-books {
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.5);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.recommended-book {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.recommended-book:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.rec-book-cover {
  height: 180px;
  overflow: hidden;
}

.rec-book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-book-info {
  padding: 10px;
}

.rec-book-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-book-author {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-book-price {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
}

@media (max-width: 768px) {
  .main-info {
    flex-direction: column;
  }
  
  .book-cover {
    flex: 0 0 auto;
    height: 300px;
    margin-bottom: 20px;
  }
  
  .recommended-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

