# 部署指南

## 前置要求

1. 安装 Node.js (版本 16 或更高)
2. 安装 Wrangler CLI
3. 拥有 Cloudflare 账户

## 安装 Wrangler CLI

```bash
npm install -g wrangler
```

## 登录 Cloudflare

```bash
wrangler login
```

## 创建 KV 命名空间

### 方法一：使用 Wrangler CLI

```bash
# 创建生产环境 KV 命名空间
wrangler kv:namespace create "ACCOUNT_DATA"

# 创建预览环境 KV 命名空间
wrangler kv:namespace create "ACCOUNT_DATA" --preview
```

### 方法二：使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages
3. 点击 "KV" 标签
4. 点击 "Create a namespace"
5. 输入名称 "ACCOUNT_DATA"
6. 复制生成的 ID

## 配置项目

### 1. 更新 wrangler.toml

将生成的 KV 命名空间 ID 更新到 `wrangler.toml` 文件中：

```toml
name = "account-pwd-manager"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "ACCOUNT_DATA"
id = "your-production-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 2. 安装项目依赖

```bash
npm install
```

## 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看应用。

## 部署到 Cloudflare

### 部署到生产环境

```bash
npm run deploy
```

### 部署到预览环境

```bash
wrangler deploy --env preview
```

## 验证部署

1. 访问你的 Worker URL (例如: `https://account-pwd-manager.your-subdomain.workers.dev`)
2. 测试添加分类功能
3. 测试添加账户功能
4. 测试编辑和删除功能

## 故障排除

### 常见问题

1. **KV 绑定错误**
   - 确保 KV 命名空间 ID 正确
   - 确保已正确绑定 KV 命名空间

2. **CORS 错误**
   - 检查 CORS 头设置
   - 确保前端请求包含正确的 Content-Type

3. **部署失败**
   - 检查 wrangler.toml 配置
   - 确保已登录 Cloudflare
   - 检查网络连接

### 调试技巧

1. 使用 `wrangler tail` 查看实时日志
2. 在 Cloudflare Dashboard 中查看 Worker 日志
3. 使用浏览器开发者工具检查网络请求

## 自定义域名

1. 在 Cloudflare Dashboard 中添加自定义域名
2. 配置 DNS 记录指向你的 Worker
3. 更新 wrangler.toml 中的路由配置

## 环境变量

如果需要添加环境变量，可以在 wrangler.toml 中配置：

```toml
[vars]
ENVIRONMENT = "production"
```

## 备份和恢复

### 备份 KV 数据

```bash
wrangler kv:key list --binding=ACCOUNT_DATA
wrangler kv:key get --binding=ACCOUNT_DATA "accounts"
wrangler kv:key get --binding=ACCOUNT_DATA "categories"
```

### 恢复 KV 数据

```bash
wrangler kv:key put --binding=ACCOUNT_DATA "accounts" "your-accounts-data"
wrangler kv:key put --binding=ACCOUNT_DATA "categories" "your-categories-data"
```

## 性能优化

1. 启用 Cloudflare 缓存
2. 使用 CDN 加速静态资源
3. 优化 Worker 代码减少执行时间

## 安全建议

1. 添加用户认证
2. 实现密码加密存储
3. 添加请求频率限制
4. 使用 HTTPS 强制重定向
5. 定期更新依赖包

## 监控和维护

1. 设置 Cloudflare Analytics
2. 监控 Worker 执行时间
3. 定期检查 KV 存储使用情况
4. 备份重要数据 