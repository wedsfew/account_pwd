# 账号密码管理系统

一个基于Web的账号密码管理应用，支持用户添加、修改账号密码，管理账户分类，数据存储在Cloudflare KV空间中。

## 功能特性

1. **账号密码管理**
   - 添加新账号密码
   - 修改现有账号密码
   - 删除账号密码
   - 搜索账号密码

2. **账户分类管理**
   - 添加账户分类（信用卡、QQ、迅雷、百度等）
   - 删除账户分类
   - 按分类筛选账号

3. **数据存储**
   - 使用Cloudflare KV空间存储数据
   - 数据加密存储
   - 用户数据隔离

## 技术栈

- 前端：HTML5, CSS3, JavaScript (ES6+)
- 后端：Cloudflare Workers
- 数据存储：Cloudflare KV
- 部署：Cloudflare Pages

## 项目结构

```
account_pwd/
├── src/
│   ├── index.html          # 主页面
│   ├── styles.css          # 样式文件
│   ├── script.js           # 前端逻辑
│   └── worker.js           # Cloudflare Worker
├── wrangler.toml           # Cloudflare配置
├── package.json            # 项目依赖
└── README.md              # 项目说明
```

## 部署说明

1. 项目已配置为使用Cloudflare Workers和KV存储
2. 通过GitHub Actions自动部署到Cloudflare
3. 支持CDN加速和全球访问

## 使用说明

1. 访问应用主页
2. 添加账户分类（如：信用卡、QQ等）
3. 在对应分类下添加账号密码信息
4. 使用搜索功能快速查找账号
5. 支持编辑和删除操作

## 安全特性

- 数据在客户端加密后传输
- 使用Cloudflare KV安全存储
- 支持数据备份和恢复 