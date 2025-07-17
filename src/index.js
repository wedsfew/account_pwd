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
        return await handleAPI(request, env, corsHeaders);
      }

      // 静态文件服务
      return await serveStaticFiles(request, corsHeaders);
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/accounts') {
    return await handleAccounts(request, env, corsHeaders);
  } else if (path === '/api/categories') {
    return await handleCategories(request, env, corsHeaders);
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAccounts(request, env, corsHeaders) {
  const { method } = request;

  switch (method) {
    case 'GET':
      return await getAccounts(env, corsHeaders);
    case 'POST':
      return await createAccount(request, env, corsHeaders);
    case 'PUT':
      return await updateAccount(request, env, corsHeaders);
    case 'DELETE':
      return await deleteAccount(request, env, corsHeaders);
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

async function handleCategories(request, env, corsHeaders) {
  const { method } = request;

  switch (method) {
    case 'GET':
      return await getCategories(env, corsHeaders);
    case 'POST':
      return await createCategory(request, env, corsHeaders);
    case 'DELETE':
      return await deleteCategory(request, env, corsHeaders);
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// 账户相关操作
async function getAccounts(env, corsHeaders) {
  try {
    const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
    return new Response(JSON.stringify(accounts), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get accounts' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function createAccount(request, env, corsHeaders) {
  try {
    const account = await request.json();
    const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
    
    account.id = Date.now().toString();
    account.createdAt = new Date().toISOString();
    accounts.push(account);
    
    await env.ACCOUNT_DATA.put('accounts', JSON.stringify(accounts));
    
    return new Response(JSON.stringify(account), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function updateAccount(request, env, corsHeaders) {
  try {
    const updatedAccount = await request.json();
    const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
    
    const index = accounts.findIndex(acc => acc.id === updatedAccount.id);
    if (index === -1) {
      return new Response(JSON.stringify({ error: 'Account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    updatedAccount.updatedAt = new Date().toISOString();
    accounts[index] = updatedAccount;
    
    await env.ACCOUNT_DATA.put('accounts', JSON.stringify(accounts));
    
    return new Response(JSON.stringify(updatedAccount), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteAccount(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Account ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
    const filteredAccounts = accounts.filter(acc => acc.id !== id);
    
    await env.ACCOUNT_DATA.put('accounts', JSON.stringify(filteredAccounts));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 分类相关操作
async function getCategories(env, corsHeaders) {
  try {
    const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
    return new Response(JSON.stringify(categories), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get categories' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function createCategory(request, env, corsHeaders) {
  try {
    const category = await request.json();
    const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
    
    category.id = Date.now().toString();
    category.createdAt = new Date().toISOString();
    categories.push(category);
    
    await env.ACCOUNT_DATA.put('categories', JSON.stringify(categories));
    
    return new Response(JSON.stringify(category), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create category' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteCategory(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Category ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
    const filteredCategories = categories.filter(cat => cat.id !== id);
    
    await env.ACCOUNT_DATA.put('categories', JSON.stringify(filteredCategories));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 静态文件服务
async function serveStaticFiles(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  
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
            <h1>🔐 账户密码管理工具</h1>
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

header h1 {
    color: white;
    font-size: 2.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
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
    .main-content {
        grid-template-columns: 1fr;
    }
    
    header h1 {
        font-size: 2rem;
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