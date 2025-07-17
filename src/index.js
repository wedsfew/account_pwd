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
  
  // 设置页面 - 首次访问时创建用户
  if (path === '/setup') {
    return new Response(getSetupContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html' 
      }
    });
  }
  
  // 登录页面
  if (path === '/login') {
    return new Response(getLoginContent(), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html' 
      }
    });
  }
  
  // 主页面 - 需要登录验证
  if (path === '/' || path === '/index.html') {
    // 检查登录状态
    const cookies = request.headers.get('cookie') || '';
    const isLoggedIn = cookies.includes('isLoggedIn=true');
    
    if (!isLoggedIn) {
      // 未登录，重定向到登录页面
      return new Response('', {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': '/login'
        }
      });
    }
    
    // 已登录，返回主页面
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
  
  // 默认重定向到登录页面
  return new Response('', {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': '/login'
    }
  });
}

function getSetupContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>初始设置 - 账户密码管理工具</title>
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

        .setup-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 450px;
            text-align: center;
        }

        .setup-header {
            margin-bottom: 30px;
        }

        .setup-header h1 {
            color: #4a5568;
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .setup-header p {
            color: #718096;
            font-size: 14px;
            line-height: 1.5;
        }

        .setup-form {
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

        .setup-btn {
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

        .setup-btn:hover {
            transform: translateY(-2px);
        }

        .setup-btn:disabled {
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

        .info-box {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #4a5568;
        }

        .info-box h3 {
            margin-bottom: 10px;
            color: #2d3748;
        }

        .info-box ul {
            list-style: none;
            padding-left: 0;
            text-align: left;
        }

        .info-box li {
            margin-bottom: 5px;
            padding-left: 15px;
            position: relative;
        }

        .info-box li:before {
            content: "•";
            color: #667eea;
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <div class="setup-header">
            <h1>🔧 初始设置</h1>
            <p>欢迎使用账户密码管理工具！<br>请创建您的管理员账户以开始使用。</p>
        </div>
        
        <form class="setup-form" id="setupForm">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" name="username" required placeholder="请输入用户名（至少3个字符）" minlength="3">
            </div>
            
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" name="password" required placeholder="请输入密码（至少6个字符）" minlength="6">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">确认密码</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="请再次输入密码" minlength="6">
            </div>
            
            <button type="submit" class="setup-btn" id="setupBtn">
                创建账户
            </button>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
        </form>
        
        <div class="info-box">
            <h3>安全提示</h3>
            <ul>
                <li>用户名至少需要3个字符</li>
                <li>密码至少需要6个字符</li>
                <li>请使用强密码保护您的数据</li>
                <li>设置完成后将无法更改用户名</li>
            </ul>
        </div>
    </div>

    <script>
        document.getElementById('setupForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const setupBtn = document.getElementById('setupBtn');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            // 隐藏之前的消息
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // 验证输入
            if (!username || !password || !confirmPassword) {
                showError('请填写所有字段');
                return;
            }
            
            if (username.length < 3) {
                showError('用户名至少需要3个字符');
                return;
            }
            
            if (password.length < 6) {
                showError('密码至少需要6个字符');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('两次输入的密码不一致');
                return;
            }
            
            // 禁用设置按钮
            setupBtn.disabled = true;
            setupBtn.textContent = '创建中...';
            
            try {
                // 创建初始用户
                const response = await fetch('/api/users/setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showSuccess('账户创建成功！正在跳转到登录页面...');
                    
                    // 延迟跳转到登录页面
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showError(result.error || '创建账户失败，请重试');
                }
            } catch (error) {
                showError('创建账户失败，请重试');
                console.error('设置错误:', error);
            } finally {
                // 恢复设置按钮
                setupBtn.disabled = false;
                setupBtn.textContent = '创建账户';
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
    </script>
</body>
</html>`;
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
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // 登录成功
                    showSuccess('登录成功，正在跳转...');
                    
                    // 存储登录状态到localStorage和cookie
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    localStorage.setItem('loginTime', Date.now().toString());
                    
                    // 设置cookie（24小时过期）
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
                    document.cookie = \`isLoggedIn=true; expires=\${expires.toUTCString()}; path=/\`;
                    document.cookie = \`username=\${username}; expires=\${expires.toUTCString()}; path=/\`;
                    
                    // 延迟跳转到主页面
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showError(result.error || '用户名或密码错误');
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
        
        // 检查是否已经登录或需要初始设置
        window.addEventListener('load', async function() {
            try {
                // 首先检查是否需要初始设置
                const setupResponse = await fetch('/api/users/check');
                const setupResult = await setupResponse.json();
                
                if (!setupResult.isUserSet) {
                    // 需要初始设置，跳转到设置页面
                    window.location.href = '/setup';
                    return;
                }
                
                // 检查是否已经登录
                const isLoggedIn = localStorage.getItem('isLoggedIn');
                if (isLoggedIn === 'true') {
                    // 检查登录是否过期（24小时）
                    const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
                    const now = Date.now();
                    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
                    
                    if (hoursSinceLogin < 24) {
                        // 登录未过期，设置cookie并跳转到主页面
                        const expires = new Date();
                        expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
                        document.cookie = \`isLoggedIn=true; expires=\${expires.toUTCString()}; path=/\`;
                        document.cookie = \`username=\${localStorage.getItem('username') || 'admin'}; expires=\${expires.toUTCString()}; path=/\`;
                        
                        window.location.href = '/';
                    } else {
                        // 登录已过期，清除登录状态
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('username');
                        localStorage.removeItem('loginTime');
                        
                        // 清除cookie
                        document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                }
            } catch (error) {
                console.error('检查登录状态时出错:', error);
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
    <div class="app-container">
        <!-- 侧边栏 -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>🔐 密码管理</h1>
                <div class="user-info">
                    <span id="userDisplay">欢迎，admin</span>
                    <div class="user-actions">
                        <button onclick="showChangePassword()" class="change-pwd-btn" title="修改密码">
                            <span>🔑</span>
                        </button>
                        <button onclick="logout()" class="logout-btn" title="登出">
                            <span>🚪</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 分类管理 -->
            <div class="sidebar-section">
                <h3>📁 分类管理</h3>
                <div class="category-form">
                    <div class="input-group">
                        <input type="text" id="categoryName" placeholder="输入分类名称" maxlength="20">
                        <button onclick="addCategory()" class="add-btn">+</button>
                    </div>
                </div>
                <div id="categoriesList" class="categories-list"></div>
            </div>
        </aside>
        
        <!-- 主内容区 -->
        <main class="main-content">
            <div class="content-header">
                <h2>👤 账户管理</h2>
                <button onclick="showAddAccountForm()" class="add-account-btn">+ 添加账户</button>
            </div>
            
            <!-- 添加账户表单 -->
            <div id="addAccountForm" class="add-account-form" style="display: none;">
                <h3>添加新账户</h3>
                <form id="accountForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountCategory">分类</label>
                            <select id="accountCategory" required>
                                <option value="">选择分类</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="accountName">账户名称</label>
                            <input type="text" id="accountName" placeholder="账户名称" required maxlength="50">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountUsername">用户名</label>
                            <input type="text" id="accountUsername" placeholder="用户名" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="accountPassword">密码</label>
                            <input type="password" id="accountPassword" placeholder="密码" required maxlength="100">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountUrl">网址 (可选)</label>
                            <input type="text" id="accountUrl" placeholder="网址" maxlength="200">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="accountNotes">备注 (可选)</label>
                        <textarea id="accountNotes" placeholder="备注信息" maxlength="500"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="save-btn">保存账户</button>
                        <button type="button" onclick="hideAddAccountForm()" class="cancel-btn">取消</button>
                    </div>
                </form>
            </div>
            
            <!-- 账户列表 -->
            <div id="accountsList" class="accounts-grid"></div>
        </main>
    </div>
    
    <!-- 编辑模态框 -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>编辑账户</h3>
                <span class="close">&times;</span>
            </div>
            <form id="editForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editCategory">分类</label>
                        <select id="editCategory" required>
                            <option value="">选择分类</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editName">账户名称</label>
                        <input type="text" id="editName" placeholder="账户名称" required maxlength="50">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUsername">用户名</label>
                        <input type="text" id="editUsername" placeholder="用户名" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="editPassword">密码</label>
                        <input type="password" id="editPassword" placeholder="密码" required maxlength="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUrl">网址 (可选)</label>
                        <input type="text" id="editUrl" placeholder="网址" maxlength="200">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editNotes">备注 (可选)</label>
                    <textarea id="editNotes" placeholder="备注信息" maxlength="500"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">保存更改</button>
                    <button type="button" onclick="closeEditModal()" class="cancel-btn">取消</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- 修改密码模态框 -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>修改密码</h3>
                <span class="close">&times;</span>
            </div>
            <form id="changePasswordForm">
                <div class="form-group">
                    <label for="currentPassword">当前密码</label>
                    <input type="password" id="currentPassword" placeholder="当前密码" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">新密码</label>
                    <input type="password" id="newPassword" placeholder="新密码" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmNewPassword">确认新密码</label>
                    <input type="password" id="confirmNewPassword" placeholder="确认新密码" required minlength="6">
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">修改密码</button>
                    <button type="button" onclick="closeChangePasswordModal()" class="cancel-btn">取消</button>
                </div>
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
    background: #f8fafc;
    min-height: 100vh;
    color: #333;
}

.app-container {
    display: flex;
    min-height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
    width: 300px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    position: fixed;
    height: 100vh;
    overflow-y: auto;
}

.sidebar-header {
    padding: 30px 25px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header h1 {
    font-size: 1.8rem;
    margin-bottom: 20px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.user-info {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

#userDisplay {
    font-weight: 600;
    font-size: 16px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.user-actions {
    display: flex;
    gap: 10px;
}

.change-pwd-btn, .logout-btn {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 2px solid rgba(255,255,255,0.25);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.change-pwd-btn:hover, .logout-btn:hover {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.4);
    transform: translateY(-2px);
}

.sidebar-section {
    padding: 25px;
}

.sidebar-section h3 {
    font-size: 1.2rem;
    margin-bottom: 20px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.category-form {
    margin-bottom: 25px;
}

.input-group {
    display: flex;
    gap: 10px;
}

.input-group input {
    flex: 1;
    padding: 12px;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: white;
    font-size: 14px;
    transition: all 0.3s ease;
}

.input-group input::placeholder {
    color: rgba(255,255,255,0.7);
}

.input-group input:focus {
    outline: none;
    border-color: rgba(255,255,255,0.5);
    background: rgba(255,255,255,0.15);
}

.add-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-btn:hover {
    background: rgba(255,255,255,0.3);
    transform: scale(1.1);
}

.categories-list {
    max-height: 300px;
    overflow-y: auto;
}

.category-item {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
}

.category-item:hover {
    background: rgba(255,255,255,0.15);
    transform: translateX(5px);
}

.category-filter {
    cursor: pointer;
    transition: all 0.3s ease;
}

.category-filter.active {
    background: rgba(255,255,255,0.25);
    border-left: 4px solid #fff;
    transform: translateX(5px);
}

.category-filter:hover {
    background: rgba(255,255,255,0.2);
}

.category-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.category-count {
    font-size: 12px;
    color: rgba(255,255,255,0.8);
    font-weight: 500;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #718096;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.5;
}

.empty-state h3 {
    color: #4a5568;
    margin-bottom: 10px;
    font-size: 1.2rem;
}

.empty-state p {
    margin-bottom: 25px;
    font-size: 14px;
}

.category-name {
    font-weight: 600;
    color: white;
}

/* 主内容区样式 */
.main-content {
    flex: 1;
    margin-left: 300px;
    padding: 30px;
    background: #f8fafc;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    background: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.content-header h2 {
    color: #4a5568;
    font-size: 1.8rem;
    margin: 0;
}

.add-account-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.add-account-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

/* 添加账户表单 */
.add-account-form {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.add-account-form h3 {
    color: #4a5568;
    margin-bottom: 25px;
    font-size: 1.3rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
    font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s ease;
    background: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 25px;
}

.save-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.cancel-btn {
    background: #e2e8f0;
    color: #4a5568;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cancel-btn:hover {
    background: #cbd5e0;
    transform: translateY(-2px);
}

/* 账户网格 */
.accounts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.account-card {
    background: white;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #e2e8f0;
    cursor: pointer;
}

.account-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    border-color: #667eea;
}

.account-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.account-name {
    font-weight: 600;
    color: #2d3748;
    font-size: 1rem;
    margin-bottom: 4px;
}

.account-category {
    background: #667eea;
    color: white;
    padding: 3px 10px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 600;
}

.account-details {
    margin-bottom: 15px;
}

.account-field {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #f7fafc;
}

.account-field:last-child {
    border-bottom: none;
}

.field-label {
    font-weight: 600;
    color: #718096;
    width: 70px;
    font-size: 12px;
}

.field-value {
    color: #2d3748;
    flex: 1;
    font-size: 13px;
}

.copy-btn {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
}

.copy-btn:hover {
    background: #f7fafc;
    color: #667eea;
    transform: scale(1.1);
}

.copy-btn:active {
    transform: scale(0.95);
}

.copy-btn svg {
    transition: all 0.2s ease;
}

.copy-btn:hover svg {
    stroke: #667eea;
}

/* 复制成功提示 */
.copy-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
}

.copy-notification.show {
    transform: translateX(0);
    opacity: 1;
}

.account-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.edit-btn {
    background: #3182ce;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.edit-btn:hover {
    background: #2c5aa0;
    transform: translateY(-1px);
}

.delete-btn {
    background: #e53e3e;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
}

.delete-btn:hover {
    background: #c53030;
    transform: scale(1.1);
}

.delete-btn::before {
    content: "×";
    line-height: 1;
}

.delete-btn::after {
    content: "删除";
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    z-index: 1000;
}

.delete-btn:hover::after {
    opacity: 1;
    visibility: visible;
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
    backdrop-filter: blur(5px);
}

.modal-content {
    background-color: white;
    margin: 3% auto;
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    position: relative;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    overflow: hidden;
}

.modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.3rem;
}

.close {
    color: white;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.close:hover {
    transform: scale(1.2);
}

.modal-content form {
    padding: 30px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .sidebar {
        width: 250px;
    }
    
    .main-content {
        margin-left: 250px;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .app-container {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        height: auto;
        position: relative;
    }
    
    .main-content {
        margin-left: 0;
        padding: 20px;
    }
    
    .content-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .accounts-grid {
        grid-template-columns: 1fr;
    }
    
    .modal-content {
        margin: 5% auto;
        width: 95%;
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
}

/* 侧边栏滚动条 */
.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
}

.sidebar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.5);
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
    
    // 初始化功能
    loadCategories();
    loadAccounts();
    
    // 更新用户显示
    updateUserDisplay();
    
    // 初始化筛选状态
    setTimeout(() => {
        updateContentHeader();
    }, 100);
    
    // 模态框事件
    const editModal = document.getElementById('editModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closeBtns = document.querySelectorAll('.close');
    
    closeBtns.forEach(btn => {
        btn.onclick = function() {
            editModal.style.display = 'none';
            changePasswordModal.style.display = 'none';
        }
    });
    
    window.onclick = function(event) {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
        if (event.target == changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    }
    
    // 编辑表单提交
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedAccount();
    });
    
    // 添加账户表单提交
    document.getElementById('accountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addAccount();
    });
    
    // 修改密码表单提交
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
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
async function updateUserDisplay() {
    try {
        const response = await fetch('/api/users/info');
        const result = await response.json();
        
        if (response.ok) {
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) {
                userDisplay.textContent = \`欢迎，\${result.username}\`;
            }
        } else {
            // 如果获取用户信息失败，使用localStorage中的用户名
            const username = localStorage.getItem('username') || 'admin';
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) {
                userDisplay.textContent = \`欢迎，\${username}\`;
            }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        // 使用localStorage中的用户名作为后备
        const username = localStorage.getItem('username') || 'admin';
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = \`欢迎，\${username}\`;
        }
    }
}

// 全局变量：当前选中的分类
let currentCategoryFilter = 'all';

// 筛选账户函数
function filterAccountsByCategory(categoryId) {
    currentCategoryFilter = categoryId;
    
    // 更新分类项的激活状态
    document.querySelectorAll('.category-filter').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(\`[data-category-id="\${categoryId}"]\`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // 更新账户列表
    updateAccountsList();
    
    // 更新内容标题
    updateContentHeader();
}

// 更新内容标题
function updateContentHeader() {
    const header = document.querySelector('.content-header h2');
    if (currentCategoryFilter === 'all') {
        header.textContent = '👤 账户管理';
    } else {
        const category = categories.find(cat => cat.id === currentCategoryFilter);
        if (category) {
            header.textContent = \`👤 \${category.name} 账户\`;
        }
    }
}

// 显示添加账户表单
function showAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'block';
    // 清空表单
    document.getElementById('accountCategory').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('accountUsername').value = '';
    document.getElementById('accountPassword').value = '';
    document.getElementById('accountUrl').value = '';
    document.getElementById('accountNotes').value = '';
}

// 隐藏添加账户表单
function hideAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'none';
}

// 显示修改密码模态框
function showChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'block';
    // 清空表单
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

// 关闭编辑模态框
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 关闭修改密码模态框
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

// 修改密码功能
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // 验证输入
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert('请填写所有字段');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('新密码至少需要6个字符');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        alert('两次输入的新密码不一致');
        return;
    }
    
    try {
        const response = await fetch('/api/users/password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('密码修改成功！');
            document.getElementById('changePasswordModal').style.display = 'none';
        } else {
            alert(result.error || '密码修改失败');
        }
    } catch (error) {
        alert('密码修改失败，请重试');
        console.error('修改密码错误:', error);
    }
}

// 登出功能
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    
    // 清除cookie
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
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
        
        // 如果删除的是当前选中的分类，重置为全部
        if (currentCategoryFilter === id) {
            currentCategoryFilter = 'all';
        }
        
        updateCategoriesList();
        updateCategorySelects();
        updateAccountsList();
        updateContentHeader();
        alert('分类删除成功');
    } catch (error) {
        console.error('删除分类失败:', error);
    }
}

function updateCategoriesList() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    // 添加"全部"选项
    const allItem = document.createElement('div');
    allItem.className = 'category-item category-filter active';
    allItem.setAttribute('data-category-id', 'all');
    allItem.innerHTML = \`
        <span class="category-name">📁 全部账户</span>
        <span class="category-count">(\${accounts.length})</span>
    \`;
    allItem.onclick = () => filterAccountsByCategory('all');
    container.appendChild(allItem);
    
    categories.forEach(category => {
        const categoryAccounts = accounts.filter(acc => acc.categoryId === category.id);
        const item = document.createElement('div');
        item.className = 'category-item category-filter';
        item.setAttribute('data-category-id', category.id);
        item.innerHTML = \`
            <span class="category-name">\${category.name}</span>
            <div class="category-actions">
                <span class="category-count">(\${categoryAccounts.length})</span>
                <button class="delete-btn" onclick="deleteCategory('\${category.id}')" title="删除"></button>
            </div>
        \`;
        item.onclick = (e) => {
            // 如果点击的是删除按钮，不触发筛选
            if (e.target.classList.contains('delete-btn')) {
                return;
            }
            filterAccountsByCategory(category.id);
        };
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
        updateCategoriesList();
        updateAccountsList();
        hideAddAccountForm();
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
    
    // 根据当前筛选条件过滤账户
    let filteredAccounts = accounts;
    if (currentCategoryFilter !== 'all') {
        filteredAccounts = accounts.filter(account => account.categoryId === currentCategoryFilter);
    }
    
    if (filteredAccounts.length === 0) {
        container.innerHTML = \`
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>暂无账户</h3>
                <p>\${currentCategoryFilter === 'all' ? '还没有添加任何账户' : '该分类下暂无账户'}</p>
                <button onclick="showAddAccountForm()" class="add-account-btn">+ 添加账户</button>
            </div>
        \`;
        return;
    }
    
    filteredAccounts.forEach(account => {
        const category = categories.find(cat => cat.id === account.categoryId);
        const item = document.createElement('div');
        item.className = 'account-card';
        item.innerHTML = \`
            <div class="account-header">
                <div class="account-name">\${account.name}</div>
                \${category ? \`<span class="account-category">\${category.name}</span>\` : ''}
            </div>
            <div class="account-details">
                <div class="account-field">
                    <span class="field-label">用户名:</span>
                    <span class="field-value">\${account.username}</span>
                    <button class="copy-btn" onclick="copyToClipboard('\${account.username}', '用户名', event)" title="复制用户名">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                <div class="account-field">
                    <span class="field-label">密码:</span>
                    <span class="field-value">••••••••</span>
                    <button class="copy-btn" onclick="copyToClipboard('\${account.password}', '密码', event)" title="复制密码">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                \${account.url ? \`
                <div class="account-field">
                    <span class="field-label">网址:</span>
                    <span class="field-value">\${account.url}</span>
                </div>\` : ''}
                \${account.notes ? \`
                <div class="account-field">
                    <span class="field-label">备注:</span>
                    <span class="field-value">\${account.notes}</span>
                </div>\` : ''}
            </div>
            <div class="account-actions">
                <button class="edit-btn" onclick="editAccount('\${account.id}')">编辑</button>
                <button class="delete-btn" onclick="deleteAccount('\${account.id}')" title="删除"></button>
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
        updateCategoriesList();
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
        
        updateCategoriesList();
        updateAccountsList();
        document.getElementById('editModal').style.display = 'none';
        editingAccountId = null;
        alert('账户更新成功');
    } catch (error) {
        console.error('更新账户失败:', error);
    }
}

// 复制到剪贴板功能
async function copyToClipboard(text, type, event) {
    try {
        await navigator.clipboard.writeText(text);
        
        // 显示成功提示
        showCopySuccess(type);
        
        // 添加按钮动画效果
        const button = event.target.closest('.copy-btn');
        if (button) {
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        }
    } catch (error) {
        console.error('复制失败:', error);
        alert('复制失败，请手动复制');
    }
}

// 显示复制成功提示
function showCopySuccess(type) {
    // 创建提示元素
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = \`\${type}已复制到剪贴板\`;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}`;
} 