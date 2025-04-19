// 全项目通用服务器地址配置
export const API_CONFIG = {
  // 服务器基础地址，可在构建项目时修改
  baseURL: 'http://localhost:8082',
  
  // API 端点
  endpoints: {
    login: '/login',
    register: '/register',
    books: '/books'
    // 可以在此处添加其他 API 端点
  }
}