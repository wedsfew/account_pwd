import { APIHandler, ResponseUtil } from './utils.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 设置CORS头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API路由
      if (path.startsWith('/api/')) {
        return await APIHandler.handleAPI(request, env, corsHeaders);
      }

      // 静态文件服务
      return await serveStaticFiles(request, corsHeaders);
    } catch (error) {
      console.error('Error:', error);
      return ResponseUtil.error('Internal Server Error', 500, corsHeaders);
    }
  }
};

// 静态文件服务
async function serveStaticFiles(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 登录页面
  if (path === '/login') {
    return new Response(getLoginContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html' 
      }
    });
  }
  
  // 默认返回HTML内容
  if (path === '/' || path === '/index.html') {
    return new Response(getHTMLContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html' 
      }
    });
  }
  
  // 返回CSS内容
  if (path === '/styles.css') {
    return new Response(getCSSContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/css' 
      }
    });
  }
  
  // 返回JS内容
  if (path === '/script.js') {
    return new Response(getJSContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/javascript' 
      }
    });
  }
  
  // 默认返回HTML
  return new Response(getHTMLContent(), {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/html' 
    }
  });
}

function getLoginContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 账户密码管理工具</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }

        .login-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 400px;
            text-align: center;
        }

        .login-header {
            margin-bottom: 30px;
        }

        .login-header h1 {
            color: #4a5568;
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .login-header p {
            color: #718096;
            font-size: 14px;
        }

        .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .form-group {
            text-align: left;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #4a5568;
            font-weight: 600;
            font-size: 14px;
        }

        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }

        .login-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s ease;
            margin-top: 10px;
        }

        .login-btn:hover {
            transform: translateY(-2px);
        }

        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .error-message {
            color: #e53e3e;
            font-size: 14px;
            margin-top: 10px;
            display: none;
        }

        .success-message {
            color: #38a169;
            font-size: 14px;
            margin-top: 10px;
            display: none;
        }

        .demo-info {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #4a5568;
        }

        .demo-info h3 {
            margin-bottom: 10px;
            color: #2d3748;
        }

        .demo-info ul {
            list-style: none;
            padding-left: 0;
        }

        .demo-info li {
            margin-bottom: 5px;
            padding-left: 15px;
            position: relative;
        }

        .demo-info li:before {
            content: "•";
            color: #667eea;
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>🔐 账户密码管理工具</h1>
            <p>请登录以访问您的账户数据</p>
        </div>
        
        <form class="login-form" id="loginForm">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" name="username" required placeholder="请输入用户名">
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required placeholder="请输入密码">
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
                登录
            </button>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
        </form>
        
        <div class="demo-info">
            <h3>演示账户</h3>
            <ul>
                <li>用户名: admin</li>
                <li>密码: 123456</li>
            </ul>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            // 隐藏之前的消息
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // 验证输入
            if (!username || !password) {
                showError('请填写用户名和密码');
                return;
            }
            
            // 禁用登录按钮
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';
            
            try {
                // 验证用户凭据
                if (username === 'admin' && password === '123456') {
                    // 登录成功
                    showSuccess('登录成功，正在跳转...');
                    
                    // 存储登录状态
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    localStorage.setItem('loginTime', Date.now().toString());
                    
                    // 延迟跳转到主页面
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showError('用户名或密码错误');
                }
            } catch (error) {
                showError('登录失败，请重试');
                console.error('登录错误:', error);
            } finally {
                // 恢复登录按钮
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        });
        
        function showError(message) {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        function showSuccess(message) {
            const successMessage = document.getElementById('successMessage');
            successMessage.textContent = message;
            successMessage.style.display = 'block';
        }
        
        // 检查是否已经登录
        window.addEventListener('load', function() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn === 'true') {
                // 检查登录是否过期（24小时）
                const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
                const now = Date.now();
                const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
                
                if (hoursSinceLogin < 24) {
                    // 登录未过期，直接跳转到主页面
                    window.location.href = '/';
                } else {
                    // 登录已过期，清除登录状态
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('username');
                    localStorage.removeItem('loginTime');
                }
            }
        });
    </script>
</body>
</html>`;
}

function getHTMLContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>账户密码管理工具</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <h1>🔐 账户密码管理工具</h1>
                <div class="user-info">
                    <span id="userDisplay">欢迎，admin</span>
                    <button onclick="logout()" class="logout-btn">登出</button>
                </div>
            </div>
        </header>
        
        <div class="main-content">
            <!-- 分类管理 -->
            <div class="section">
                <h2>📁 分类管理</h2>
                <div class="category-form">
                    <input type="text" id="categoryName" placeholder="输入分类名称" maxlength="20">
                    <button onclick="addCategory()">添加分类</button>
                </div>
                <div id="categoriesList" class="categories-list"></div>
            </div>
            
            <!-- 账户管理 -->
            <div class="section">
                <h2>👤 账户管理</h2>
                <div class="account-form">
                    <select id="accountCategory" required>
                        <option value="">选择分类</option>
                    </select>
                    <input type="text" id="accountName" placeholder="账户名称" required maxlength="50">
                    <input type="text" id="accountUsername" placeholder="用户名" required maxlength="100">
                    <input type="password" id="accountPassword" placeholder="密码" required maxlength="100">
                    <input type="text" id="accountUrl" placeholder="网址 (可选)" maxlength="200">
                    <textarea id="accountNotes" placeholder="备注 (可选)" maxlength="500"></textarea>
                    <button onclick="addAccount()">添加账户</button>
                </div>
                <div id="accountsList" class="accounts-list"></div>
            </div>
        </div>
    </div>
    
    <!-- 编辑模态框 -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>编辑账户</h3>
            <form id="editForm">
                <select id="editCategory" required>
                    <option value="">选择分类</option>
                </select>
                <input type="text" id="editName" placeholder="账户名称" required maxlength="50">
                <input type="text" id="editUsername" placeholder="用户名" required maxlength="100">
                <input type="password" id="editPassword" placeholder="密码" required maxlength="100">
                <input type="text" id="editUrl" placeholder="网址 (可选)" maxlength="200">
                <textarea id="editNotes" placeholder="备注 (可选)" maxlength="500"></textarea>
                <button type="submit">保存</button>
            </form>
        </div>
    </div>
    
    <script src="/script.js"></script>
</body>
</html>`;
}

function getCSSContent() {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

header h1 {
    color: white;
    font-size: 2.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    margin: 0;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    color: white;
    font-size: 16px;
}

#userDisplay {
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.logout-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.logout-btn:hover {
    background: rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-1px);
}

.main-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 30px;
}

.section {
    background: white;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.section h2 {
    color: #4a5568;
    margin-bottom: 20px;
    font-size: 1.5rem;
}

/* 表单样式 */
.category-form, .account-form {
    margin-bottom: 25px;
}

input, select, textarea {
    width: 100%;
    padding: 12px;
    margin-bottom: 15px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
}

button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: transform 0.2s ease;
}

button:hover {
    transform: translateY(-2px);
}

/* 列表样式 */
.categories-list, .accounts-list {
    max-height: 400px;
    overflow-y: auto;
}

.category-item, .account-item {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.category-item:hover, .account-item:hover {
    background: #edf2f7;
}

.category-name {
    font-weight: 600;
    color: #4a5568;
}

.account-info {
    flex: 1;
}

.account-name {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 5px;
}

.account-username {
    color: #718096;
    font-size: 14px;
}

.account-category {
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-left: 10px;
}

.delete-btn {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 10px;
}

.edit-btn {
    background: #3182ce;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 5px;
}

/* 模态框样式 */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 30px;
    border-radius: 15px;
    width: 90%;
    max-width: 500px;
    position: relative;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    position: absolute;
    right: 20px;
    top: 15px;
}

.close:hover {
    color: #000;
}

.modal-content h3 {
    margin-bottom: 20px;
    color: #4a5568;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        text-align: center;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .main-content {
        grid-template-columns: 1fr;
    }
    
    .container {
        padding: 15px;
    }
    
    .section {
        padding: 20px;
    }
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}`;
}

function getJSContent() {
  return `// 全局变量
let accounts = [];
let categories = [];
let editingAccountId = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (!checkLoginStatus()) {
        window.location.href = '/login';
        return;
    }
    
    // 更新用户显示
    updateUserDisplay();
    
    // 初始化功能
    loadCategories();
    loadAccounts();
    
    // 模态框事件
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    // 编辑表单提交
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedAccount();
    });
});

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        return false;
    }
    
    // 检查登录是否过期（24小时）
    const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
    const now = Date.now();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin >= 24) {
        // 登录已过期，清除登录状态
        logout();
        return false;
    }
    
    return true;
}

// 更新用户显示
function updateUserDisplay() {
    const username = localStorage.getItem('username') || 'admin';
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = \`欢迎，\${username}\`;
    }
}

// 登出功能
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    window.location.href = '/login';
}

// API工具函数
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API调用错误:', error);
        alert('操作失败，请重试');
        throw error;
    }
}

// 分类管理
async function loadCategories() {
    try {
        categories = await apiCall('/api/categories');
        updateCategoriesList();
        updateCategorySelects();
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

async function addCategory() {
    const nameInput = document.getElementById('categoryName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('请输入分类名称');
        return;
    }
    
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        alert('分类名称已存在');
        return;
    }
    
    try {
        const newCategory = await apiCall('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        categories.push(newCategory);
        updateCategoriesList();
        updateCategorySelects();
        nameInput.value = '';
        alert('分类添加成功');
    } catch (error) {
        console.error('添加分类失败:', error);
    }
}

async function deleteCategory(id) {
    if (!confirm('确定要删除这个分类吗？相关的账户也会被删除。')) {
        return;
    }
    
    try {
        await apiCall(\`/api/categories?id=\${id}\`, {
            method: 'DELETE'
        });
        
        // 删除相关账户
        accounts = accounts.filter(acc => acc.categoryId !== id);
        categories = categories.filter(cat => cat.id !== id);
        
        updateCategoriesList();
        updateCategorySelects();
        updateAccountsList();
        alert('分类删除成功');
    } catch (error) {
        console.error('删除分类失败:', error);
    }
}

function updateCategoriesList() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = \`
            <span class="category-name">\${category.name}</span>
            <button class="delete-btn" onclick="deleteCategory('\${category.id}')">删除</button>
        \`;
        container.appendChild(item);
    });
}

function updateCategorySelects() {
    const selects = [
        document.getElementById('accountCategory'),
        document.getElementById('editCategory')
    ];
    
    selects.forEach(select => {
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">选择分类</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

// 账户管理
async function loadAccounts() {
    try {
        accounts = await apiCall('/api/accounts');
        updateAccountsList();
    } catch (error) {
        console.error('加载账户失败:', error);
    }
}

async function addAccount() {
    const formData = {
        categoryId: document.getElementById('accountCategory').value,
        name: document.getElementById('accountName').value.trim(),
        username: document.getElementById('accountUsername').value.trim(),
        password: document.getElementById('accountPassword').value,
        url: document.getElementById('accountUrl').value.trim(),
        notes: document.getElementById('accountNotes').value.trim()
    };
    
    // 验证必填字段
    if (!formData.categoryId || !formData.name || !formData.username || !formData.password) {
        alert('请填写所有必填字段');
        return;
    }
    
    try {
        const newAccount = await apiCall('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        accounts.push(newAccount);
        updateAccountsList();
        clearAccountForm();
        alert('账户添加成功');
    } catch (error) {
        console.error('添加账户失败:', error);
    }
}

function clearAccountForm() {
    document.getElementById('accountCategory').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('accountUsername').value = '';
    document.getElementById('accountPassword').value = '';
    document.getElementById('accountUrl').value = '';
    document.getElementById('accountNotes').value = '';
}

function updateAccountsList() {
    const container = document.getElementById('accountsList');
    container.innerHTML = '';
    
    accounts.forEach(account => {
        const category = categories.find(cat => cat.id === account.categoryId);
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = \`
            <div class="account-info">
                <div class="account-name">\${account.name}</div>
                <div class="account-username">\${account.username}</div>
                \${category ? \`<span class="account-category">\${category.name}</span>\` : ''}
            </div>
            <div>
                <button class="edit-btn" onclick="editAccount('\${account.id}')">编辑</button>
                <button class="delete-btn" onclick="deleteAccount('\${account.id}')">删除</button>
            </div>
        \`;
        container.appendChild(item);
    });
}

async function deleteAccount(id) {
    if (!confirm('确定要删除这个账户吗？')) {
        return;
    }
    
    try {
        await apiCall(\`/api/accounts?id=\${id}\`, {
            method: 'DELETE'
        });
        
        accounts = accounts.filter(acc => acc.id !== id);
        updateAccountsList();
        alert('账户删除成功');
    } catch (error) {
        console.error('删除账户失败:', error);
    }
}

function editAccount(id) {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;
    
    editingAccountId = id;
    
    // 填充编辑表单
    document.getElementById('editCategory').value = account.categoryId || '';
    document.getElementById('editName').value = account.name;
    document.getElementById('editUsername').value = account.username;
    document.getElementById('editPassword').value = account.password;
    document.getElementById('editUrl').value = account.url || '';
    document.getElementById('editNotes').value = account.notes || '';
    
    // 显示模态框
    document.getElementById('editModal').style.display = 'block';
}

async function saveEditedAccount() {
    if (!editingAccountId) return;
    
    const formData = {
        id: editingAccountId,
        categoryId: document.getElementById('editCategory').value,
        name: document.getElementById('editName').value.trim(),
        username: document.getElementById('editUsername').value.trim(),
        password: document.getElementById('editPassword').value,
        url: document.getElementById('editUrl').value.trim(),
        notes: document.getElementById('editNotes').value.trim()
    };
    
    // 验证必填字段
    if (!formData.categoryId || !formData.name || !formData.username || !formData.password) {
        alert('请填写所有必填字段');
        return;
    }
    
    try {
        const updatedAccount = await apiCall('/api/accounts', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        const index = accounts.findIndex(acc => acc.id === editingAccountId);
        if (index !== -1) {
            accounts[index] = updatedAccount;
        }
        
        updateAccountsList();
        document.getElementById('editModal').style.display = 'none';
        editingAccountId = null;
        alert('账户更新成功');
    } catch (error) {
        console.error('更新账户失败:', error);
    }
}`;
} 