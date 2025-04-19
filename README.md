# 书籍在线阅读系统

这是一个基于 Vue 3 和 Element Plus 开发的在线书籍阅读系统，提供用户注册登录、书籍浏览、搜索、阅读等功能。

## 功能特点

- **用户认证**：支持用户注册和登录功能，包括记住登录状态
- **书籍浏览**：提供书籍列表展示，支持分页浏览
- **搜索功能**：支持按书名、作者和标签搜索书籍
- **书籍详情**：展示书籍详细信息，包括封面、简介、作者等
- **在线阅读**：提供舒适的阅读界面，支持以下功能：
  - 页面/滚动阅读模式切换
  - 字体大小调整
  - 明/暗主题切换
  - 键盘左右箭头翻页
  - 分页导航
  - 每页行数自定义
  - 内容下载为 TXT 文件

## 技术栈

- **前端框架**：Vue 3
- **UI 组件库**：Element Plus
- **路由管理**：Vue Router
- **构建工具**：Vite
- **图标库**：Element Plus Icons

## 项目结构

```
book_store_web/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── assets/          # 资源文件（图片等）
│   ├── components/      # 组件
│   │   ├── LoginPage.vue       # 登录页面
│   │   ├── RegisterPage.vue    # 注册页面
│   │   ├── BookStorePage.vue   # 书店主页
│   │   ├── BookDetailPage.vue  # 书籍详情页
│   │   └── ReadPage.vue        # 阅读页面
│   ├── router/          # 路由配置
│   ├── App.vue          # 根组件
│   ├── config.js        # API配置
│   └── main.js          # 入口文件
└── vite.config.js       # Vite配置
```

## 安装与运行

### 环境要求

- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装步骤

1. 克隆仓库到本地

```bash
git clone https://github.com/yourusername/book_store_web.git
cd book_store_web
```

2. 安装依赖

```bash
npm install
```

### 配置后端 API

在 `src/config.js` 文件中配置后端 API 地址：

```javascript
export const API_CONFIG = {
  baseURL: 'http://your-backend-api-url',
  endpoints: {
    login: '/login',
    register: '/register',
    books: '/books'
  }
}
```
3. 开发环境运行

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

5. 预览生产版本

```bash
npm run preview
```

## 许可证

MIT