<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { API_CONFIG } from '../config.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const emailOrUsername = ref('')
const password = ref('')
const rememberMe = ref(false)
const scale = ref(1)
const loginError = ref('')

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

// 邮箱验证正则表达式
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const handleLogin = async () => {
  // 清除之前的错误信息
  loginError.value = ''
  
  // 判断输入是邮箱还是用户名
  const isEmail = emailRegex.test(emailOrUsername.value)
  
  // 构建登录数据对象
  const loginData = {
    name: isEmail ? '' : emailOrUsername.value, // 如果是邮箱，用户名为空；否则直接使用输入值作为用户名
    password: password.value,
    email: isEmail ? emailOrUsername.value : '' // 如果是邮箱，填入邮箱；否则为空
  }
  
  console.log('登录数据:', loginData)
  console.log('是否为邮箱:', isEmail)
  
  try {
    // 发送登录请求
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('登录成功:', data)
      
      // 保存用户token到cookie
      const userToken = data.userToken || data.token || btoa(data.name || emailOrUsername.value)
      const expiryDate = rememberMe.value ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null // 如果"记住我"，设置30天过期
      
      document.cookie = `userToken=${userToken}${expiryDate ? `; expires=${expiryDate.toUTCString()}` : ''}; path=/`
      
      // 跳转到书店主页
      router.push('/bookstore')
    } else {
      const errorText = await response.text()
      console.error('登录失败:', errorText)
      loginError.value = '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录请求出错:', error)
    loginError.value = '网络错误，请稍后再试'
  }
}

const handleTelegramLogin = () => {
  // 处理Telegram登录逻辑
  console.log('使用Telegram登录')
}

const goToRegister = () => {
  // 跳转到注册页面
  router.push('/register')
}

// 检查是否已登录
onMounted(() => {
  handleResize() // 初始化缩放
  window.addEventListener('resize', handleResize)
  
  // 检查cookie中是否有token
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }
  
  const userToken = getCookie('userToken')
  if (userToken) {
    // 已登录，直接跳转到书店主页
    router.push('/bookstore')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="login-container">
    <div class="login-box" :style="{ transform: `scale(${scale})` }">
      <!-- Logo 修改为使用图片 -->
      <div class="logo">
        <img src="../assets/logo.jpg" alt="Logo" class="logo-img">
      </div>
      
      <!-- 标语 -->
      <div class="slogan">一草一木，一花一世界。</div>
      
      <!-- 引用 -->
      <div class="quote">《目送》</div>
      
      <!-- 分隔线 -->
      <div class="divider"></div>
      
      <!-- 登录表单 -->
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <!-- 显示错误信息 -->
        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>
        
        <div class="input-group">
          <label>邮箱或用户名</label>
          <input type="text" v-model="emailOrUsername" required>
        </div>
        <div class="input-group">
          <label>密码</label>
          <input type="password" v-model="password" required>
          <div class="forgot-password">
            <a href="#">忘记密码?</a>
          </div>
        </div>
        
        <div class="remember-me">
          <input type="checkbox" id="remember" v-model="rememberMe">
          <label for="remember">记住我</label>
        </div>
        
        <button type="submit" class="login-btn">登录</button>
        
        <div class="or-divider">或</div>
        
        <button type="button" class="telegram-btn" @click="handleTelegramLogin">
          <i class="telegram-icon">✈️</i> 使用 Telegram 登录
        </button>
      </form>
      
      <!-- 注册链接 -->
      <div class="register-link">
        还没有账号? <a href="#" @click.prevent="goToRegister">马上注册 🚀</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: auto;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.2); /* 降低不透明度，增强透明效果 */
  backdrop-filter: blur(12px); /* 增强模糊效果 */
  -webkit-backdrop-filter: blur(12px); /* Safari 兼容 */
  border-radius: 20px;
  box-shadow: 0 15px 25px rgba(0,0,0,0.15); /* 调整阴影 */
  transition: transform 0.3s ease;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3); /* 添加半透明边框 */
}

.logo {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 20px;
  overflow: hidden; /* 确保图片不会溢出圆形区域 */
  background-color: white; /* 为logo提供背景 */
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为contain确保图片完整显示 */
  max-width: 100%; /* 确保不超过容器宽度 */
  max-height: 100%; /* 确保不超过容器高度 */
}

/* 移除不再需要的 logo-text 样式 */
/* .logo-text {
  font-size: 40px;
  font-weight: bold;
  color: white;
} */

.slogan {
  font-size: 18px;
  color: #222; /* 加深颜色 */
  margin-bottom: 5px;
  font-weight: 500; /* 加粗 */
}

.quote {
  font-size: 14px;
  color: #444; /* 加深颜色 */
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 30px;
  color: #222; /* 加深颜色 */
  text-align: center;
  font-weight: 600; /* 加粗 */
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #3541ee; /* 修改为指定颜色 */
  font-weight: 500; /* 加粗 */
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 20px 0;
}

/* 删除重复的 h2 样式 */

.input-group {
  position: relative;
  margin-bottom: 25px;
  text-align: left;
}

/* 删除重复的 label 样式 */

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  color: #3541ee;
  border: 1px solid #ddd;
  border-radius: 5px;
  outline: none;
  background: white;
  box-sizing: border-box;
}

input[type="text"]:focus,
input[type="password"]:focus {
  border-color: #3541ee;
}

.forgot-password {
  text-align: right;
  margin-top: 5px;
}

.forgot-password a {
  font-size: 12px;
  color: #3541ee; /* 修改为指定颜色 */
  text-decoration: none;
}

.remember-me {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  text-align: left;
}

.remember-me input {
  margin-right: 8px;
}

.remember-me label {
  margin-bottom: 0;
  font-size: 14px;
  color: #3541ee; /* 修改为指定颜色 */
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #6c7bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #5a68e0;
}

.or-divider {
  position: relative;
  margin: 20px 0;
  text-align: center;
  color: #3541ee;
}

.or-divider::before,
.or-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #eee;
}

.or-divider::before {
  left: 0;
}

.or-divider::after {
  right: 0;
}

.telegram-btn {
  width: 100%;
  padding: 12px;
  background: #38a5e0;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.telegram-btn:hover {
  background: #2d8bc0;
}

.telegram-icon {
  margin-right: 8px;
}

.register-link {
  margin-top: 30px;
  font-size: 14px;
  color: #3541ee;
}

.register-link a {
  color: #3541ee;
  text-decoration: none;
  font-weight: 500;
}

@media (max-width: 768px) {
  .login-box {
    width: 90%;
    max-width: 400px;
    padding: 30px;
  }
}
</style>