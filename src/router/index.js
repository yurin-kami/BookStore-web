import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import BookStorePage from '../components/BookStorePage.vue'
import BookDetailPage from '../components/BookDetailPage.vue'
import ReadPage from '../components/ReadPage.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/bookstore',
    name: 'BookStore',
    component: BookStorePage
  },
  {
    path: '/book/:id',
    name: 'BookDetail',
    component: BookDetailPage
  },
  {
    path: '/read/:id',
    name: 'ReadBook',
    component: ReadPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 获取cookie中的token
  const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  }
  
  const userToken = getCookie('userToken')
  
  // 如果访问的是书店页面且没有token，则重定向到登录页
  if (to.path === '/bookstore' && !userToken) {
    next('/')
  } else {
    next()
  }
})

export default router