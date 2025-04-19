<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { API_CONFIG } from '../config.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const scale = ref(1)
const registerError = ref('')

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

const handleRegister = async () => {
  // 清除之前的错误信息
  registerError.value = ''
  
  // 验证密码是否一致
  if (password.value !== confirmPassword.value) {
    registerError.value = '两次输入的密码不一致'
    return
  }
  
  // 验证邮箱格式
  if (!emailRegex.test(email.value)) {
    registerError.value = '邮箱格式不正确'
    return
  }
  
  // 构建注册数据对象
  const registerData = {
    name: username.value,
    password: password.value,
    email: email.value
  }
  
  console.log('注册数据:', registerData)
  
  try {
    // 发送注册请求
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.register || '/register'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('注册成功:', data)
      
      // 保存用户token到cookie
      const userToken = data.userToken || data.token || btoa(username.value)
      document.cookie = `userToken=${userToken}; path=/`
      
      // 跳转到书店主页
      router.push('/bookstore')
    } else {
      const errorText = await response.text()
      console.error('注册失败:', errorText)
      registerError.value = '注册失败，请稍后再试'
    }
  } catch (error) {
    console.error('注册请求出错:', error)
    registerError.value = '网络错误，请稍后再试'
  }
}

// 添加跳转到登录页的函数
const goToLogin = () => {
  // 跳转到登录页面
  router.push('/')
}

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
  <div class="register-container">
    <div class="register-box" :style="{ transform: `scale(${scale})` }">
      <!-- Logo 使用图片 -->
      <div class="logo">
        <img src="../assets/logo.jpg" alt="Logo" class="logo-img">
      </div>
      
      <!-- 标语 -->
      <div class="slogan">一草一木，一花一世界。</div>
      
      <!-- 引用 -->
      <div class="quote">《目送》</div>
      
      <!-- 分隔线 -->
      <div class="divider"></div>
      
      <!-- 注册表单 -->
      <h2>注册</h2>
      <form @submit.prevent="handleRegister">
        <!-- 显示错误信息 -->
        <div v-if="registerError" class="error-message">
          {{ registerError }}
        </div>
        
        <div class="input-group">
          <label>用户名</label>
          <input type="text" v-model="username" required>
        </div>
        
        <div class="input-group">
          <label>邮箱</label>
          <input type="email" v-model="email" required>
        </div>
        
        <div class="input-group">
          <label>密码</label>
          <input type="password" v-model="password" required>
        </div>
        
        <div class="input-group">
          <label>确认密码</label>
          <input type="password" v-model="confirmPassword" required>
        </div>
        
        <button type="submit" class="register-btn">注册</button>
      </form>
      
      <!-- 登录链接 -->
      <div class="login-link">
        已有账号? <a href="#" @click.prevent="goToLogin">返回登录 🔙</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  width: auto;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.register-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  box-shadow: 0 15px 25px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.logo {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 20px;
  overflow: hidden;
  background-color: white;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

.slogan {
  font-size: 18px;
  color: #222;
  margin-bottom: 5px;
  font-weight: 500;
}

.quote {
  font-size: 14px;
  color: #444;
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 30px;
  color: #222;
  text-align: center;
  font-weight: 600;
}

label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #3541ee;
  font-weight: 500;
}

.divider {
  height: 1px;
  background-color: #eee;
  margin: 20px 0;
}

.input-group {
  position: relative;
  margin-bottom: 25px;
  text-align: left;
}

input[type="text"],
input[type="email"],
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
input[type="email"]:focus,
input[type="password"]:focus {
  border-color: #3541ee;
}

.register-btn {
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

.register-btn:hover {
  background: #5a68e0;
}

.login-link {
  margin-top: 30px;
  font-size: 14px;
  color: #3541ee;
}

.login-link a {
  color: #3541ee;
  text-decoration: none;
  font-weight: 500;
}

@media (max-width: 768px) {
  .register-box {
    width: 90%;
    max-width: 400px;
    padding: 30px;
  }
}
.error-message {
  color: #f44336;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  font-size: 14px;
  text-align: center;
}
</style>