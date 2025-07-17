# 账户密码管理工具

一个基于 Cloudflare Worker 的账户密码管理工具，支持分类管理和账户密码的增删改查。

## 功能特性

### 🔐 账户管理
- ✅ 添加、编辑、删除账户
- ✅ 支持账户名称、用户名、密码、网址、备注
- ✅ 密码字段安全显示
- ✅ 数据实时保存到 Cloudflare KV

### 📁 分类管理
- ✅ 添加、删除账户分类
- ✅ 支持自定义分类名称（如：信用卡、QQ、迅雷、百度等）
- ✅ 分类与账户关联管理
- ✅ 删除分类时自动清理相关账户

### 🎨 用户界面
- ✅ 现代化响应式设计
- ✅ 美观的渐变背景
- ✅ 直观的操作界面
- ✅ 移动端适配

### 🔒 数据安全
- ✅ 数据存储在 Cloudflare KV 中
- ✅ 支持 CORS 跨域访问
- ✅ 数据持久化存储

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Cloudflare Worker
- **存储**: Cloudflare KV
- **部署**: Cloudflare Workers

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd account_pwd
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 Cloudflare KV

在 Cloudflare Dashboard 中创建 KV 命名空间，然后更新 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "ACCOUNT_DATA"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 4. 本地开发
```bash
npm run dev
```

### 5. 部署到 Cloudflare
```bash
npm run deploy
```

## API 接口

### 账户管理

#### 获取所有账户
```
GET /api/accounts
```

#### 创建账户
```
POST /api/accounts
Content-Type: application/json

{
  "categoryId": "category_id",
  "name": "账户名称",
  "username": "用户名",
  "password": "密码",
  "url": "网址(可选)",
  "notes": "备注(可选)"
}
```

#### 更新账户
```
PUT /api/accounts
Content-Type: application/json

{
  "id": "account_id",
  "categoryId": "category_id",
  "name": "账户名称",
  "username": "用户名",
  "password": "密码",
  "url": "网址(可选)",
  "notes": "备注(可选)"
}
```

#### 删除账户
```
DELETE /api/accounts?id=account_id
```

### 分类管理

#### 获取所有分类
```
GET /api/categories
```

#### 创建分类
```
POST /api/categories
Content-Type: application/json

{
  "name": "分类名称"
}
```

#### 删除分类
```
DELETE /api/categories?id=category_id
```

## 项目结构

```
account_pwd/
├── src/
│   └── index.js          # Cloudflare Worker 主文件
├── package.json          # 项目配置
├── wrangler.toml        # Cloudflare Worker 配置
└── README.md           # 项目说明
```

## 部署说明

1. 在 Cloudflare Dashboard 创建 Worker
2. 创建 KV 命名空间并绑定
3. 更新 `wrangler.toml` 中的 KV 配置
4. 运行 `npm run deploy` 部署

## 使用说明

1. 首先添加账户分类（如：信用卡、QQ、迅雷、百度等）
2. 在对应分类下添加账户信息
3. 可以随时编辑或删除账户
4. 删除分类时会同时删除该分类下的所有账户

## 安全注意事项

- 密码以明文形式存储在 KV 中，建议在生产环境中添加加密
- 可以根据需要添加用户认证机制
- 建议定期备份重要数据

## 许可证

MIT License 