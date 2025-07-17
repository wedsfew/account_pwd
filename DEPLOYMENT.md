# 部署说明

本文档详细说明如何将账号密码管理系统部署到Cloudflare Workers。

## 前置要求

1. **Cloudflare账户**
   - 注册Cloudflare账户
   - 获取Account ID
   - 创建API Token

2. **GitHub账户**
   - 创建GitHub仓库
   - 配置GitHub Secrets

3. **Node.js环境**
   - 安装Node.js 18+
   - 安装Wrangler CLI

## 步骤1：配置Cloudflare

### 1.1 创建KV命名空间

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 创建KV命名空间
wrangler kv:namespace create "ACCOUNT_DATA"
wrangler kv:namespace create "ACCOUNT_DATA" --preview
```

### 1.2 获取Account ID

在Cloudflare仪表板中：
1. 进入Workers & Pages
2. 查看右侧的Account ID

### 1.3 创建API Token

1. 进入Cloudflare仪表板
2. 点击右上角头像 → My Profile
3. 选择API Tokens
4. 创建Custom Token：
   - Permissions: Account → Workers Scripts → Edit
   - Permissions: Account → Workers Routes → Edit
   - Permissions: Account → Workers KV Storage → Edit
   - Zone Resources: Include → All zones

## 步骤2：配置项目

### 2.1 更新wrangler.toml

将生成的KV命名空间ID更新到`wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "ACCOUNT_DATA"
id = "你的KV命名空间ID"
preview_id = "你的预览KV命名空间ID"
```

### 2.2 配置GitHub Secrets

在GitHub仓库设置中添加以下Secrets：

- `CLOUDFLARE_API_TOKEN`: 你的Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: 你的Cloudflare Account ID

## 步骤3：本地测试

### 3.1 安装依赖

```bash
npm install
```

### 3.2 本地开发

```bash
# 启动本地开发服务器
npm run dev
```

### 3.3 本地部署测试

```bash
# 部署到Cloudflare
npm run deploy
```

## 步骤4：GitHub部署

### 4.1 推送代码

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 4.2 自动部署

GitHub Actions将自动：
1. 检测到main分支的推送
2. 运行部署工作流
3. 部署到Cloudflare Workers

## 步骤5：配置自定义域名（可选）

1. 在Cloudflare仪表板中
2. 进入Workers & Pages
3. 选择你的Worker
4. 点击Settings → Triggers
5. 添加自定义域名

## 故障排除

### 常见问题

1. **KV命名空间错误**
   - 确保KV命名空间ID正确
   - 检查权限设置

2. **API Token权限不足**
   - 确保Token有足够的权限
   - 重新生成Token

3. **部署失败**
   - 检查GitHub Secrets配置
   - 查看GitHub Actions日志

### 调试命令

```bash
# 查看Worker日志
wrangler tail

# 测试API
curl https://your-worker.your-subdomain.workers.dev/api/health

# 查看KV数据
wrangler kv:key list --binding=ACCOUNT_DATA
```

## 安全注意事项

1. **API Token安全**
   - 不要在代码中硬编码Token
   - 定期轮换Token

2. **数据加密**
   - 考虑在客户端加密敏感数据
   - 使用HTTPS传输

3. **访问控制**
   - 考虑添加身份验证
   - 限制API访问频率

## 监控和维护

1. **性能监控**
   - 使用Cloudflare Analytics
   - 监控Worker执行时间

2. **错误监控**
   - 设置错误告警
   - 定期检查日志

3. **数据备份**
   - 定期导出KV数据
   - 设置数据备份策略

## 更新部署

### 自动更新

推送代码到main分支将自动触发部署。

### 手动更新

```bash
# 手动部署
npm run deploy

# 或使用wrangler
wrangler deploy
```

## 联系支持

如果遇到问题：
1. 查看Cloudflare文档
2. 检查GitHub Actions日志
3. 查看Worker错误日志 