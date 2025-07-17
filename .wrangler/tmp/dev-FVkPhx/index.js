var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-REs1Xv/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-REs1Xv/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/utils.js
var ResponseUtil = class {
  static success(data, corsHeaders) {
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  static error(message, status = 500, corsHeaders) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  static created(data, corsHeaders) {
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
__name(ResponseUtil, "ResponseUtil");
var UserManager = class {
  // 简单的密码哈希函数（生产环境应使用更安全的哈希算法）
  static hashPassword(password) {
    return btoa(password + "salt_" + Date.now());
  }
  // 验证密码
  static verifyPassword(password, hashedPassword) {
    return password === atob(hashedPassword).replace("salt_" + Date.now(), "");
  }
  // 检查是否已设置用户
  static async isUserSet(env) {
    try {
      const userData = await env.ACCOUNT_DATA.get("user_credentials");
      return !!userData;
    } catch (error) {
      return false;
    }
  }
  // 创建初始用户
  static async createInitialUser(request, env, corsHeaders) {
    try {
      const { username, password } = await request.json();
      if (!username || !password) {
        return ResponseUtil.error("Username and password are required", 400, corsHeaders);
      }
      if (username.length < 3) {
        return ResponseUtil.error("Username must be at least 3 characters", 400, corsHeaders);
      }
      if (password.length < 6) {
        return ResponseUtil.error("Password must be at least 6 characters", 400, corsHeaders);
      }
      const existingUser = await env.ACCOUNT_DATA.get("user_credentials");
      if (existingUser) {
        return ResponseUtil.error("User already exists", 409, corsHeaders);
      }
      const userData = {
        username: username.trim(),
        passwordHash: this.hashPassword(password),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.ACCOUNT_DATA.put("user_credentials", JSON.stringify(userData));
      return ResponseUtil.created({
        success: true,
        message: "Initial user created successfully"
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to create user", 500, corsHeaders);
    }
  }
  // 验证用户登录
  static async verifyUser(request, env, corsHeaders) {
    try {
      const { username, password } = await request.json();
      if (!username || !password) {
        return ResponseUtil.error("Username and password are required", 400, corsHeaders);
      }
      const userData = await env.ACCOUNT_DATA.get("user_credentials", { type: "json" });
      if (!userData) {
        return ResponseUtil.error("No user found", 404, corsHeaders);
      }
      if (userData.username !== username.trim()) {
        return ResponseUtil.error("Invalid credentials", 401, corsHeaders);
      }
      const isValidPassword = password === atob(userData.passwordHash).split("salt_")[0];
      if (!isValidPassword) {
        return ResponseUtil.error("Invalid credentials", 401, corsHeaders);
      }
      return ResponseUtil.success({
        success: true,
        username: userData.username,
        message: "Login successful"
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to verify user", 500, corsHeaders);
    }
  }
  // 更新用户密码
  static async updatePassword(request, env, corsHeaders) {
    try {
      const { currentPassword, newPassword } = await request.json();
      if (!currentPassword || !newPassword) {
        return ResponseUtil.error("Current password and new password are required", 400, corsHeaders);
      }
      if (newPassword.length < 6) {
        return ResponseUtil.error("New password must be at least 6 characters", 400, corsHeaders);
      }
      const userData = await env.ACCOUNT_DATA.get("user_credentials", { type: "json" });
      if (!userData) {
        return ResponseUtil.error("No user found", 404, corsHeaders);
      }
      const isValidCurrentPassword = currentPassword === atob(userData.passwordHash).split("salt_")[0];
      if (!isValidCurrentPassword) {
        return ResponseUtil.error("Current password is incorrect", 401, corsHeaders);
      }
      userData.passwordHash = this.hashPassword(newPassword);
      userData.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await env.ACCOUNT_DATA.put("user_credentials", JSON.stringify(userData));
      return ResponseUtil.success({
        success: true,
        message: "Password updated successfully"
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to update password", 500, corsHeaders);
    }
  }
  // 获取用户信息
  static async getUserInfo(env, corsHeaders) {
    try {
      const userData = await env.ACCOUNT_DATA.get("user_credentials", { type: "json" });
      if (!userData) {
        return ResponseUtil.error("No user found", 404, corsHeaders);
      }
      return ResponseUtil.success({
        username: userData.username,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to get user info", 500, corsHeaders);
    }
  }
};
__name(UserManager, "UserManager");
var AccountManager = class {
  static async getAll(env, corsHeaders) {
    try {
      const accounts = await env.ACCOUNT_DATA.get("accounts", { type: "json" }) || [];
      return ResponseUtil.success(accounts, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to get accounts", 500, corsHeaders);
    }
  }
  static async create(request, env, corsHeaders) {
    try {
      const account = await request.json();
      const accounts = await env.ACCOUNT_DATA.get("accounts", { type: "json" }) || [];
      account.id = Date.now().toString();
      account.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      accounts.push(account);
      await env.ACCOUNT_DATA.put("accounts", JSON.stringify(accounts));
      return ResponseUtil.created(account, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to create account", 500, corsHeaders);
    }
  }
  static async update(request, env, corsHeaders) {
    try {
      const updatedAccount = await request.json();
      const accounts = await env.ACCOUNT_DATA.get("accounts", { type: "json" }) || [];
      const index = accounts.findIndex((acc) => acc.id === updatedAccount.id);
      if (index === -1) {
        return ResponseUtil.error("Account not found", 404, corsHeaders);
      }
      updatedAccount.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      accounts[index] = updatedAccount;
      await env.ACCOUNT_DATA.put("accounts", JSON.stringify(accounts));
      return ResponseUtil.success(updatedAccount, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to update account", 500, corsHeaders);
    }
  }
  static async delete(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return ResponseUtil.error("Account ID required", 400, corsHeaders);
      }
      const accounts = await env.ACCOUNT_DATA.get("accounts", { type: "json" }) || [];
      const filteredAccounts = accounts.filter((acc) => acc.id !== id);
      await env.ACCOUNT_DATA.put("accounts", JSON.stringify(filteredAccounts));
      return ResponseUtil.success({ success: true }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to delete account", 500, corsHeaders);
    }
  }
};
__name(AccountManager, "AccountManager");
var CategoryManager = class {
  static async getAll(env, corsHeaders) {
    try {
      const categories = await env.ACCOUNT_DATA.get("categories", { type: "json" }) || [];
      return ResponseUtil.success(categories, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to get categories", 500, corsHeaders);
    }
  }
  static async create(request, env, corsHeaders) {
    try {
      const category = await request.json();
      const categories = await env.ACCOUNT_DATA.get("categories", { type: "json" }) || [];
      category.id = Date.now().toString();
      category.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      categories.push(category);
      await env.ACCOUNT_DATA.put("categories", JSON.stringify(categories));
      return ResponseUtil.created(category, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to create category", 500, corsHeaders);
    }
  }
  static async delete(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return ResponseUtil.error("Category ID required", 400, corsHeaders);
      }
      const categories = await env.ACCOUNT_DATA.get("categories", { type: "json" }) || [];
      const filteredCategories = categories.filter((cat) => cat.id !== id);
      await env.ACCOUNT_DATA.put("categories", JSON.stringify(filteredCategories));
      return ResponseUtil.success({ success: true }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error("Failed to delete category", 500, corsHeaders);
    }
  }
};
__name(CategoryManager, "CategoryManager");
var APIHandler = class {
  static async handleAccounts(request, env, corsHeaders) {
    const { method } = request;
    switch (method) {
      case "GET":
        return await AccountManager.getAll(env, corsHeaders);
      case "POST":
        return await AccountManager.create(request, env, corsHeaders);
      case "PUT":
        return await AccountManager.update(request, env, corsHeaders);
      case "DELETE":
        return await AccountManager.delete(request, env, corsHeaders);
      default:
        return ResponseUtil.error("Method not allowed", 405, corsHeaders);
    }
  }
  static async handleCategories(request, env, corsHeaders) {
    const { method } = request;
    switch (method) {
      case "GET":
        return await CategoryManager.getAll(env, corsHeaders);
      case "POST":
        return await CategoryManager.create(request, env, corsHeaders);
      case "DELETE":
        return await CategoryManager.delete(request, env, corsHeaders);
      default:
        return ResponseUtil.error("Method not allowed", 405, corsHeaders);
    }
  }
  static async handleUsers(request, env, corsHeaders) {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;
    switch (method) {
      case "POST":
        if (path === "/api/users/setup") {
          return await UserManager.createInitialUser(request, env, corsHeaders);
        } else if (path === "/api/users/login") {
          return await UserManager.verifyUser(request, env, corsHeaders);
        } else if (path === "/api/users/password") {
          return await UserManager.updatePassword(request, env, corsHeaders);
        }
        break;
      case "GET":
        if (path === "/api/users/info") {
          return await UserManager.getUserInfo(env, corsHeaders);
        } else if (path === "/api/users/check") {
          const isUserSet = await UserManager.isUserSet(env);
          return ResponseUtil.success({ isUserSet }, corsHeaders);
        }
        break;
      default:
        return ResponseUtil.error("Method not allowed", 405, corsHeaders);
    }
    return ResponseUtil.error("Not Found", 404, corsHeaders);
  }
  static async handleAPI(request, env, corsHeaders) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/api/accounts") {
      return await this.handleAccounts(request, env, corsHeaders);
    } else if (path === "/api/categories") {
      return await this.handleCategories(request, env, corsHeaders);
    } else if (path.startsWith("/api/users")) {
      return await this.handleUsers(request, env, corsHeaders);
    }
    return ResponseUtil.error("Not Found", 404, corsHeaders);
  }
};
__name(APIHandler, "APIHandler");

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path.startsWith("/api/")) {
        return await APIHandler.handleAPI(request, env, corsHeaders);
      }
      return await serveStaticFiles(request, corsHeaders);
    } catch (error) {
      console.error("Error:", error);
      return ResponseUtil.error("Internal Server Error", 500, corsHeaders);
    }
  }
};
async function serveStaticFiles(request, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/setup") {
    return new Response(getSetupContent(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html"
      }
    });
  }
  if (path === "/login") {
    return new Response(getLoginContent(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html"
      }
    });
  }
  if (path === "/" || path === "/index.html") {
    const cookies = request.headers.get("cookie") || "";
    const isLoggedIn = cookies.includes("isLoggedIn=true");
    if (!isLoggedIn) {
      return new Response("", {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": "/login"
        }
      });
    }
    return new Response(getHTMLContent(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html"
      }
    });
  }
  if (path === "/styles.css") {
    return new Response(getCSSContent(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/css"
      }
    });
  }
  if (path === "/script.js") {
    return new Response(getJSContent(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript"
      }
    });
  }
  return new Response("", {
    status: 302,
    headers: {
      ...corsHeaders,
      "Location": "/login"
    }
  });
}
__name(serveStaticFiles, "serveStaticFiles");
function getSetupContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\u521D\u59CB\u8BBE\u7F6E - \u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177</title>
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
            content: "\u2022";
            color: #667eea;
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="setup-container">
        <div class="setup-header">
            <h1>\u{1F527} \u521D\u59CB\u8BBE\u7F6E</h1>
            <p>\u6B22\u8FCE\u4F7F\u7528\u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177\uFF01<br>\u8BF7\u521B\u5EFA\u60A8\u7684\u7BA1\u7406\u5458\u8D26\u6237\u4EE5\u5F00\u59CB\u4F7F\u7528\u3002</p>
        </div>
        
        <form class="setup-form" id="setupForm">
            <div class="form-group">
                <label for="username">\u7528\u6237\u540D</label>
                <input type="text" id="username" name="username" required placeholder="\u8BF7\u8F93\u5165\u7528\u6237\u540D\uFF08\u81F3\u5C113\u4E2A\u5B57\u7B26\uFF09" minlength="3">
            </div>
            
            <div class="form-group">
                <label for="password">\u5BC6\u7801</label>
                <input type="password" id="password" name="password" required placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801\uFF08\u81F3\u5C116\u4E2A\u5B57\u7B26\uFF09" minlength="6">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">\u786E\u8BA4\u5BC6\u7801</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="\u8BF7\u518D\u6B21\u8F93\u5165\u5BC6\u7801" minlength="6">
            </div>
            
            <button type="submit" class="setup-btn" id="setupBtn">
                \u521B\u5EFA\u8D26\u6237
            </button>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
        </form>
        
        <div class="info-box">
            <h3>\u5B89\u5168\u63D0\u793A</h3>
            <ul>
                <li>\u7528\u6237\u540D\u81F3\u5C11\u9700\u89813\u4E2A\u5B57\u7B26</li>
                <li>\u5BC6\u7801\u81F3\u5C11\u9700\u89816\u4E2A\u5B57\u7B26</li>
                <li>\u8BF7\u4F7F\u7528\u5F3A\u5BC6\u7801\u4FDD\u62A4\u60A8\u7684\u6570\u636E</li>
                <li>\u8BBE\u7F6E\u5B8C\u6210\u540E\u5C06\u65E0\u6CD5\u66F4\u6539\u7528\u6237\u540D</li>
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
            
            // \u9690\u85CF\u4E4B\u524D\u7684\u6D88\u606F
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // \u9A8C\u8BC1\u8F93\u5165
            if (!username || !password || !confirmPassword) {
                showError('\u8BF7\u586B\u5199\u6240\u6709\u5B57\u6BB5');
                return;
            }
            
            if (username.length < 3) {
                showError('\u7528\u6237\u540D\u81F3\u5C11\u9700\u89813\u4E2A\u5B57\u7B26');
                return;
            }
            
            if (password.length < 6) {
                showError('\u5BC6\u7801\u81F3\u5C11\u9700\u89816\u4E2A\u5B57\u7B26');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('\u4E24\u6B21\u8F93\u5165\u7684\u5BC6\u7801\u4E0D\u4E00\u81F4');
                return;
            }
            
            // \u7981\u7528\u8BBE\u7F6E\u6309\u94AE
            setupBtn.disabled = true;
            setupBtn.textContent = '\u521B\u5EFA\u4E2D...';
            
            try {
                // \u521B\u5EFA\u521D\u59CB\u7528\u6237
                const response = await fetch('/api/users/setup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showSuccess('\u8D26\u6237\u521B\u5EFA\u6210\u529F\uFF01\u6B63\u5728\u8DF3\u8F6C\u5230\u767B\u5F55\u9875\u9762...');
                    
                    // \u5EF6\u8FDF\u8DF3\u8F6C\u5230\u767B\u5F55\u9875\u9762
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showError(result.error || '\u521B\u5EFA\u8D26\u6237\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
                }
            } catch (error) {
                showError('\u521B\u5EFA\u8D26\u6237\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
                console.error('\u8BBE\u7F6E\u9519\u8BEF:', error);
            } finally {
                // \u6062\u590D\u8BBE\u7F6E\u6309\u94AE
                setupBtn.disabled = false;
                setupBtn.textContent = '\u521B\u5EFA\u8D26\u6237';
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
    <\/script>
</body>
</html>`;
}
__name(getSetupContent, "getSetupContent");
function getLoginContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\u767B\u5F55 - \u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177</title>
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
            content: "\u2022";
            color: #667eea;
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>\u{1F510} \u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177</h1>
            <p>\u8BF7\u767B\u5F55\u4EE5\u8BBF\u95EE\u60A8\u7684\u8D26\u6237\u6570\u636E</p>
        </div>
        
        <form class="login-form" id="loginForm">
            <div class="form-group">
                <label for="username">\u7528\u6237\u540D</label>
                <input type="text" id="username" name="username" required placeholder="\u8BF7\u8F93\u5165\u7528\u6237\u540D">
            </div>
            
            <div class="form-group">
                <label for="password">\u5BC6\u7801</label>
                <input type="password" id="password" name="password" required placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801">
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
                \u767B\u5F55
            </button>
            
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
        </form>
        
        <div class="demo-info">
            <h3>\u6F14\u793A\u8D26\u6237</h3>
            <ul>
                <li>\u7528\u6237\u540D: admin</li>
                <li>\u5BC6\u7801: 123456</li>
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
            
            // \u9690\u85CF\u4E4B\u524D\u7684\u6D88\u606F
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            
            // \u9A8C\u8BC1\u8F93\u5165
            if (!username || !password) {
                showError('\u8BF7\u586B\u5199\u7528\u6237\u540D\u548C\u5BC6\u7801');
                return;
            }
            
            // \u7981\u7528\u767B\u5F55\u6309\u94AE
            loginBtn.disabled = true;
            loginBtn.textContent = '\u767B\u5F55\u4E2D...';
            
            try {
                // \u9A8C\u8BC1\u7528\u6237\u51ED\u636E
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // \u767B\u5F55\u6210\u529F
                    showSuccess('\u767B\u5F55\u6210\u529F\uFF0C\u6B63\u5728\u8DF3\u8F6C...');
                    
                    // \u5B58\u50A8\u767B\u5F55\u72B6\u6001\u5230localStorage\u548Ccookie
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    localStorage.setItem('loginTime', Date.now().toString());
                    
                    // \u8BBE\u7F6Ecookie\uFF0824\u5C0F\u65F6\u8FC7\u671F\uFF09
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
                    document.cookie = \`isLoggedIn=true; expires=\${expires.toUTCString()}; path=/\`;
                    document.cookie = \`username=\${username}; expires=\${expires.toUTCString()}; path=/\`;
                    
                    // \u5EF6\u8FDF\u8DF3\u8F6C\u5230\u4E3B\u9875\u9762
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showError(result.error || '\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF');
                }
            } catch (error) {
                showError('\u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
                console.error('\u767B\u5F55\u9519\u8BEF:', error);
            } finally {
                // \u6062\u590D\u767B\u5F55\u6309\u94AE
                loginBtn.disabled = false;
                loginBtn.textContent = '\u767B\u5F55';
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
        
        // \u68C0\u67E5\u662F\u5426\u5DF2\u7ECF\u767B\u5F55\u6216\u9700\u8981\u521D\u59CB\u8BBE\u7F6E
        window.addEventListener('load', async function() {
            try {
                // \u9996\u5148\u68C0\u67E5\u662F\u5426\u9700\u8981\u521D\u59CB\u8BBE\u7F6E
                const setupResponse = await fetch('/api/users/check');
                const setupResult = await setupResponse.json();
                
                if (!setupResult.isUserSet) {
                    // \u9700\u8981\u521D\u59CB\u8BBE\u7F6E\uFF0C\u8DF3\u8F6C\u5230\u8BBE\u7F6E\u9875\u9762
                    window.location.href = '/setup';
                    return;
                }
                
                // \u68C0\u67E5\u662F\u5426\u5DF2\u7ECF\u767B\u5F55
                const isLoggedIn = localStorage.getItem('isLoggedIn');
                if (isLoggedIn === 'true') {
                    // \u68C0\u67E5\u767B\u5F55\u662F\u5426\u8FC7\u671F\uFF0824\u5C0F\u65F6\uFF09
                    const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
                    const now = Date.now();
                    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
                    
                    if (hoursSinceLogin < 24) {
                        // \u767B\u5F55\u672A\u8FC7\u671F\uFF0C\u8BBE\u7F6Ecookie\u5E76\u8DF3\u8F6C\u5230\u4E3B\u9875\u9762
                        const expires = new Date();
                        expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
                        document.cookie = \`isLoggedIn=true; expires=\${expires.toUTCString()}; path=/\`;
                        document.cookie = \`username=\${localStorage.getItem('username') || 'admin'}; expires=\${expires.toUTCString()}; path=/\`;
                        
                        window.location.href = '/';
                    } else {
                        // \u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u6E05\u9664\u767B\u5F55\u72B6\u6001
                        localStorage.removeItem('isLoggedIn');
                        localStorage.removeItem('username');
                        localStorage.removeItem('loginTime');
                        
                        // \u6E05\u9664cookie
                        document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                }
            } catch (error) {
                console.error('\u68C0\u67E5\u767B\u5F55\u72B6\u6001\u65F6\u51FA\u9519:', error);
            }
        });
    <\/script>
</body>
</html>`;
}
__name(getLoginContent, "getLoginContent");
function getHTMLContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="app-container">
        <!-- \u4FA7\u8FB9\u680F -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>\u{1F510} \u5BC6\u7801\u7BA1\u7406</h1>
                <div class="user-info">
                    <span id="userDisplay">\u6B22\u8FCE\uFF0Cadmin</span>
                    <div class="user-actions">
                        <button onclick="showChangePassword()" class="change-pwd-btn" title="\u4FEE\u6539\u5BC6\u7801">
                            <span>\u{1F511}</span>
                        </button>
                        <button onclick="logout()" class="logout-btn" title="\u767B\u51FA">
                            <span>\u{1F6AA}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- \u5206\u7C7B\u7BA1\u7406 -->
            <div class="sidebar-section">
                <h3>\u{1F4C1} \u5206\u7C7B\u7BA1\u7406</h3>
                <div class="category-form">
                    <div class="input-group">
                        <input type="text" id="categoryName" placeholder="\u8F93\u5165\u5206\u7C7B\u540D\u79F0" maxlength="20">
                        <button onclick="addCategory()" class="add-btn">+</button>
                    </div>
                </div>
                <div id="categoriesList" class="categories-list"></div>
            </div>
        </aside>
        
        <!-- \u4E3B\u5185\u5BB9\u533A -->
        <main class="main-content">
            <div class="content-header">
                <h2>\u{1F464} \u8D26\u6237\u7BA1\u7406</h2>
                <button onclick="showAddAccountForm()" class="add-account-btn">+ \u6DFB\u52A0\u8D26\u6237</button>
            </div>
            
            <!-- \u6DFB\u52A0\u8D26\u6237\u8868\u5355 -->
            <div id="addAccountForm" class="add-account-form" style="display: none;">
                <h3>\u6DFB\u52A0\u65B0\u8D26\u6237</h3>
                <form id="accountForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountCategory">\u5206\u7C7B</label>
                            <select id="accountCategory" required>
                                <option value="">\u9009\u62E9\u5206\u7C7B</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="accountName">\u8D26\u6237\u540D\u79F0</label>
                            <input type="text" id="accountName" placeholder="\u8D26\u6237\u540D\u79F0" required maxlength="50">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountUsername">\u7528\u6237\u540D</label>
                            <input type="text" id="accountUsername" placeholder="\u7528\u6237\u540D" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="accountPassword">\u5BC6\u7801</label>
                            <input type="password" id="accountPassword" placeholder="\u5BC6\u7801" required maxlength="100">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="accountUrl">\u7F51\u5740 (\u53EF\u9009)</label>
                            <input type="text" id="accountUrl" placeholder="\u7F51\u5740" maxlength="200">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="accountNotes">\u5907\u6CE8 (\u53EF\u9009)</label>
                        <textarea id="accountNotes" placeholder="\u5907\u6CE8\u4FE1\u606F" maxlength="500"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="save-btn">\u4FDD\u5B58\u8D26\u6237</button>
                        <button type="button" onclick="hideAddAccountForm()" class="cancel-btn">\u53D6\u6D88</button>
                    </div>
                </form>
            </div>
            
            <!-- \u8D26\u6237\u5217\u8868 -->
            <div id="accountsList" class="accounts-grid"></div>
        </main>
    </div>
    
    <!-- \u7F16\u8F91\u6A21\u6001\u6846 -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>\u7F16\u8F91\u8D26\u6237</h3>
                <span class="close">&times;</span>
            </div>
            <form id="editForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editCategory">\u5206\u7C7B</label>
                        <select id="editCategory" required>
                            <option value="">\u9009\u62E9\u5206\u7C7B</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editName">\u8D26\u6237\u540D\u79F0</label>
                        <input type="text" id="editName" placeholder="\u8D26\u6237\u540D\u79F0" required maxlength="50">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUsername">\u7528\u6237\u540D</label>
                        <input type="text" id="editUsername" placeholder="\u7528\u6237\u540D" required maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="editPassword">\u5BC6\u7801</label>
                        <input type="password" id="editPassword" placeholder="\u5BC6\u7801" required maxlength="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editUrl">\u7F51\u5740 (\u53EF\u9009)</label>
                        <input type="text" id="editUrl" placeholder="\u7F51\u5740" maxlength="200">
                    </div>
                </div>
                <div class="form-group">
                    <label for="editNotes">\u5907\u6CE8 (\u53EF\u9009)</label>
                    <textarea id="editNotes" placeholder="\u5907\u6CE8\u4FE1\u606F" maxlength="500"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">\u4FDD\u5B58\u66F4\u6539</button>
                    <button type="button" onclick="closeEditModal()" class="cancel-btn">\u53D6\u6D88</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- \u4FEE\u6539\u5BC6\u7801\u6A21\u6001\u6846 -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>\u4FEE\u6539\u5BC6\u7801</h3>
                <span class="close">&times;</span>
            </div>
            <form id="changePasswordForm">
                <div class="form-group">
                    <label for="currentPassword">\u5F53\u524D\u5BC6\u7801</label>
                    <input type="password" id="currentPassword" placeholder="\u5F53\u524D\u5BC6\u7801" required>
                </div>
                <div class="form-group">
                    <label for="newPassword">\u65B0\u5BC6\u7801</label>
                    <input type="password" id="newPassword" placeholder="\u65B0\u5BC6\u7801" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmNewPassword">\u786E\u8BA4\u65B0\u5BC6\u7801</label>
                    <input type="password" id="confirmNewPassword" placeholder="\u786E\u8BA4\u65B0\u5BC6\u7801" required minlength="6">
                </div>
                <div class="form-actions">
                    <button type="submit" class="save-btn">\u4FEE\u6539\u5BC6\u7801</button>
                    <button type="button" onclick="closeChangePasswordModal()" class="cancel-btn">\u53D6\u6D88</button>
                </div>
            </form>
        </div>
    </div>
    
    <script src="/script.js"><\/script>
</body>
</html>`;
}
__name(getHTMLContent, "getHTMLContent");
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

/* \u4FA7\u8FB9\u680F\u6837\u5F0F */
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

/* \u4E3B\u5185\u5BB9\u533A\u6837\u5F0F */
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

/* \u6DFB\u52A0\u8D26\u6237\u8868\u5355 */
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

/* \u8D26\u6237\u7F51\u683C */
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

/* \u590D\u5236\u6210\u529F\u63D0\u793A */
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
    content: "\xD7";
    line-height: 1;
}

.delete-btn::after {
    content: "\u5220\u9664";
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

/* \u6A21\u6001\u6846\u6837\u5F0F */
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

/* \u54CD\u5E94\u5F0F\u8BBE\u8BA1 */
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

/* \u6EDA\u52A8\u6761\u6837\u5F0F */
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

/* \u4FA7\u8FB9\u680F\u6EDA\u52A8\u6761 */
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
__name(getCSSContent, "getCSSContent");
function getJSContent() {
  return `// \u5168\u5C40\u53D8\u91CF
let accounts = [];
let categories = [];
let editingAccountId = null;

// \u9875\u9762\u52A0\u8F7D\u65F6\u521D\u59CB\u5316
document.addEventListener('DOMContentLoaded', function() {
    // \u68C0\u67E5\u767B\u5F55\u72B6\u6001
    if (!checkLoginStatus()) {
        window.location.href = '/login';
        return;
    }
    
    // \u521D\u59CB\u5316\u529F\u80FD
    loadCategories();
    loadAccounts();
    
    // \u66F4\u65B0\u7528\u6237\u663E\u793A
    updateUserDisplay();
    
    // \u521D\u59CB\u5316\u7B5B\u9009\u72B6\u6001
    setTimeout(() => {
        updateContentHeader();
    }, 100);
    
    // \u6A21\u6001\u6846\u4E8B\u4EF6
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
    
    // \u7F16\u8F91\u8868\u5355\u63D0\u4EA4
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedAccount();
    });
    
    // \u6DFB\u52A0\u8D26\u6237\u8868\u5355\u63D0\u4EA4
    document.getElementById('accountForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addAccount();
    });
    
    // \u4FEE\u6539\u5BC6\u7801\u8868\u5355\u63D0\u4EA4
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
});

// \u68C0\u67E5\u767B\u5F55\u72B6\u6001
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        return false;
    }
    
    // \u68C0\u67E5\u767B\u5F55\u662F\u5426\u8FC7\u671F\uFF0824\u5C0F\u65F6\uFF09
    const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
    const now = Date.now();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursSinceLogin >= 24) {
        // \u767B\u5F55\u5DF2\u8FC7\u671F\uFF0C\u6E05\u9664\u767B\u5F55\u72B6\u6001
        logout();
        return false;
    }
    
    return true;
}

// \u66F4\u65B0\u7528\u6237\u663E\u793A
async function updateUserDisplay() {
    try {
        const response = await fetch('/api/users/info');
        const result = await response.json();
        
        if (response.ok) {
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) {
                userDisplay.textContent = \`\u6B22\u8FCE\uFF0C\${result.username}\`;
            }
        } else {
            // \u5982\u679C\u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25\uFF0C\u4F7F\u7528localStorage\u4E2D\u7684\u7528\u6237\u540D
            const username = localStorage.getItem('username') || 'admin';
            const userDisplay = document.getElementById('userDisplay');
            if (userDisplay) {
                userDisplay.textContent = \`\u6B22\u8FCE\uFF0C\${username}\`;
            }
        }
    } catch (error) {
        console.error('\u83B7\u53D6\u7528\u6237\u4FE1\u606F\u5931\u8D25:', error);
        // \u4F7F\u7528localStorage\u4E2D\u7684\u7528\u6237\u540D\u4F5C\u4E3A\u540E\u5907
        const username = localStorage.getItem('username') || 'admin';
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = \`\u6B22\u8FCE\uFF0C\${username}\`;
        }
    }
}

// \u5168\u5C40\u53D8\u91CF\uFF1A\u5F53\u524D\u9009\u4E2D\u7684\u5206\u7C7B
let currentCategoryFilter = 'all';

// \u7B5B\u9009\u8D26\u6237\u51FD\u6570
function filterAccountsByCategory(categoryId) {
    currentCategoryFilter = categoryId;
    
    // \u66F4\u65B0\u5206\u7C7B\u9879\u7684\u6FC0\u6D3B\u72B6\u6001
    document.querySelectorAll('.category-filter').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(\`[data-category-id="\${categoryId}"]\`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // \u66F4\u65B0\u8D26\u6237\u5217\u8868
    updateAccountsList();
    
    // \u66F4\u65B0\u5185\u5BB9\u6807\u9898
    updateContentHeader();
}

// \u66F4\u65B0\u5185\u5BB9\u6807\u9898
function updateContentHeader() {
    const header = document.querySelector('.content-header h2');
    if (currentCategoryFilter === 'all') {
        header.textContent = '\u{1F464} \u8D26\u6237\u7BA1\u7406';
    } else {
        const category = categories.find(cat => cat.id === currentCategoryFilter);
        if (category) {
            header.textContent = \`\u{1F464} \${category.name} \u8D26\u6237\`;
        }
    }
}

// \u663E\u793A\u6DFB\u52A0\u8D26\u6237\u8868\u5355
function showAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'block';
    // \u6E05\u7A7A\u8868\u5355
    document.getElementById('accountCategory').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('accountUsername').value = '';
    document.getElementById('accountPassword').value = '';
    document.getElementById('accountUrl').value = '';
    document.getElementById('accountNotes').value = '';
}

// \u9690\u85CF\u6DFB\u52A0\u8D26\u6237\u8868\u5355
function hideAddAccountForm() {
    document.getElementById('addAccountForm').style.display = 'none';
}

// \u663E\u793A\u4FEE\u6539\u5BC6\u7801\u6A21\u6001\u6846
function showChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'block';
    // \u6E05\u7A7A\u8868\u5355
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
}

// \u5173\u95ED\u7F16\u8F91\u6A21\u6001\u6846
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// \u5173\u95ED\u4FEE\u6539\u5BC6\u7801\u6A21\u6001\u6846
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

// \u4FEE\u6539\u5BC6\u7801\u529F\u80FD
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // \u9A8C\u8BC1\u8F93\u5165
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        alert('\u8BF7\u586B\u5199\u6240\u6709\u5B57\u6BB5');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('\u65B0\u5BC6\u7801\u81F3\u5C11\u9700\u89816\u4E2A\u5B57\u7B26');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        alert('\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4');
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
            alert('\u5BC6\u7801\u4FEE\u6539\u6210\u529F\uFF01');
            document.getElementById('changePasswordModal').style.display = 'none';
        } else {
            alert(result.error || '\u5BC6\u7801\u4FEE\u6539\u5931\u8D25');
        }
    } catch (error) {
        alert('\u5BC6\u7801\u4FEE\u6539\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
        console.error('\u4FEE\u6539\u5BC6\u7801\u9519\u8BEF:', error);
    }
}

// \u767B\u51FA\u529F\u80FD
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('loginTime');
    
    // \u6E05\u9664cookie
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    window.location.href = '/login';
}

// API\u5DE5\u5177\u51FD\u6570
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
        console.error('API\u8C03\u7528\u9519\u8BEF:', error);
        alert('\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
        throw error;
    }
}

// \u5206\u7C7B\u7BA1\u7406
async function loadCategories() {
    try {
        categories = await apiCall('/api/categories');
        updateCategoriesList();
        updateCategorySelects();
    } catch (error) {
        console.error('\u52A0\u8F7D\u5206\u7C7B\u5931\u8D25:', error);
    }
}

async function addCategory() {
    const nameInput = document.getElementById('categoryName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('\u8BF7\u8F93\u5165\u5206\u7C7B\u540D\u79F0');
        return;
    }
    
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        alert('\u5206\u7C7B\u540D\u79F0\u5DF2\u5B58\u5728');
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
        alert('\u5206\u7C7B\u6DFB\u52A0\u6210\u529F');
    } catch (error) {
        console.error('\u6DFB\u52A0\u5206\u7C7B\u5931\u8D25:', error);
    }
}

async function deleteCategory(id) {
    if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u5206\u7C7B\u5417\uFF1F\u76F8\u5173\u7684\u8D26\u6237\u4E5F\u4F1A\u88AB\u5220\u9664\u3002')) {
        return;
    }
    
    try {
        await apiCall(\`/api/categories?id=\${id}\`, {
            method: 'DELETE'
        });
        
        // \u5220\u9664\u76F8\u5173\u8D26\u6237
        accounts = accounts.filter(acc => acc.categoryId !== id);
        categories = categories.filter(cat => cat.id !== id);
        
        // \u5982\u679C\u5220\u9664\u7684\u662F\u5F53\u524D\u9009\u4E2D\u7684\u5206\u7C7B\uFF0C\u91CD\u7F6E\u4E3A\u5168\u90E8
        if (currentCategoryFilter === id) {
            currentCategoryFilter = 'all';
        }
        
        updateCategoriesList();
        updateCategorySelects();
        updateAccountsList();
        updateContentHeader();
        alert('\u5206\u7C7B\u5220\u9664\u6210\u529F');
    } catch (error) {
        console.error('\u5220\u9664\u5206\u7C7B\u5931\u8D25:', error);
    }
}

function updateCategoriesList() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    // \u6DFB\u52A0"\u5168\u90E8"\u9009\u9879
    const allItem = document.createElement('div');
    allItem.className = 'category-item category-filter active';
    allItem.setAttribute('data-category-id', 'all');
    allItem.innerHTML = \`
        <span class="category-name">\u{1F4C1} \u5168\u90E8\u8D26\u6237</span>
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
                <button class="delete-btn" onclick="deleteCategory('\${category.id}')" title="\u5220\u9664"></button>
            </div>
        \`;
        item.onclick = (e) => {
            // \u5982\u679C\u70B9\u51FB\u7684\u662F\u5220\u9664\u6309\u94AE\uFF0C\u4E0D\u89E6\u53D1\u7B5B\u9009
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
        select.innerHTML = '<option value="">\u9009\u62E9\u5206\u7C7B</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

// \u8D26\u6237\u7BA1\u7406
async function loadAccounts() {
    try {
        accounts = await apiCall('/api/accounts');
        updateAccountsList();
    } catch (error) {
        console.error('\u52A0\u8F7D\u8D26\u6237\u5931\u8D25:', error);
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
    
    // \u9A8C\u8BC1\u5FC5\u586B\u5B57\u6BB5
    if (!formData.categoryId || !formData.name || !formData.username || !formData.password) {
        alert('\u8BF7\u586B\u5199\u6240\u6709\u5FC5\u586B\u5B57\u6BB5');
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
        alert('\u8D26\u6237\u6DFB\u52A0\u6210\u529F');
    } catch (error) {
        console.error('\u6DFB\u52A0\u8D26\u6237\u5931\u8D25:', error);
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
    
    // \u6839\u636E\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u8FC7\u6EE4\u8D26\u6237
    let filteredAccounts = accounts;
    if (currentCategoryFilter !== 'all') {
        filteredAccounts = accounts.filter(account => account.categoryId === currentCategoryFilter);
    }
    
    if (filteredAccounts.length === 0) {
        container.innerHTML = \`
            <div class="empty-state">
                <div class="empty-icon">\u{1F4ED}</div>
                <h3>\u6682\u65E0\u8D26\u6237</h3>
                <p>\${currentCategoryFilter === 'all' ? '\u8FD8\u6CA1\u6709\u6DFB\u52A0\u4EFB\u4F55\u8D26\u6237' : '\u8BE5\u5206\u7C7B\u4E0B\u6682\u65E0\u8D26\u6237'}</p>
                <button onclick="showAddAccountForm()" class="add-account-btn">+ \u6DFB\u52A0\u8D26\u6237</button>
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
                    <span class="field-label">\u7528\u6237\u540D:</span>
                    <span class="field-value">\${account.username}</span>
                    <button class="copy-btn" onclick="copyToClipboard('\${account.username}', '\u7528\u6237\u540D')" title="\u590D\u5236\u7528\u6237\u540D">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                <div class="account-field">
                    <span class="field-label">\u5BC6\u7801:</span>
                    <span class="field-value">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span>
                    <button class="copy-btn" onclick="copyToClipboard('\${account.password}', '\u5BC6\u7801')" title="\u590D\u5236\u5BC6\u7801">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
                \${account.url ? \`
                <div class="account-field">
                    <span class="field-label">\u7F51\u5740:</span>
                    <span class="field-value">\${account.url}</span>
                </div>\` : ''}
                \${account.notes ? \`
                <div class="account-field">
                    <span class="field-label">\u5907\u6CE8:</span>
                    <span class="field-value">\${account.notes}</span>
                </div>\` : ''}
            </div>
            <div class="account-actions">
                <button class="edit-btn" onclick="editAccount('\${account.id}')">\u7F16\u8F91</button>
                <button class="delete-btn" onclick="deleteAccount('\${account.id}')" title="\u5220\u9664"></button>
            </div>
        \`;
        container.appendChild(item);
    });
}

async function deleteAccount(id) {
    if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u8D26\u6237\u5417\uFF1F')) {
        return;
    }
    
    try {
        await apiCall(\`/api/accounts?id=\${id}\`, {
            method: 'DELETE'
        });
        
        accounts = accounts.filter(acc => acc.id !== id);
        updateCategoriesList();
        updateAccountsList();
        alert('\u8D26\u6237\u5220\u9664\u6210\u529F');
    } catch (error) {
        console.error('\u5220\u9664\u8D26\u6237\u5931\u8D25:', error);
    }
}

function editAccount(id) {
    const account = accounts.find(acc => acc.id === id);
    if (!account) return;
    
    editingAccountId = id;
    
    // \u586B\u5145\u7F16\u8F91\u8868\u5355
    document.getElementById('editCategory').value = account.categoryId || '';
    document.getElementById('editName').value = account.name;
    document.getElementById('editUsername').value = account.username;
    document.getElementById('editPassword').value = account.password;
    document.getElementById('editUrl').value = account.url || '';
    document.getElementById('editNotes').value = account.notes || '';
    
    // \u663E\u793A\u6A21\u6001\u6846
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
    
    // \u9A8C\u8BC1\u5FC5\u586B\u5B57\u6BB5
    if (!formData.categoryId || !formData.name || !formData.username || !formData.password) {
        alert('\u8BF7\u586B\u5199\u6240\u6709\u5FC5\u586B\u5B57\u6BB5');
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
        alert('\u8D26\u6237\u66F4\u65B0\u6210\u529F');
    } catch (error) {
        console.error('\u66F4\u65B0\u8D26\u6237\u5931\u8D25:', error);
    }
}

// \u590D\u5236\u5230\u526A\u8D34\u677F\u529F\u80FD
async function copyToClipboard(text, type) {
    try {
        await navigator.clipboard.writeText(text);
        
        // \u663E\u793A\u6210\u529F\u63D0\u793A
        showCopySuccess(type);
        
        // \u6DFB\u52A0\u6309\u94AE\u52A8\u753B\u6548\u679C
        const button = event.target.closest('.copy-btn');
        if (button) {
            button.style.transform = 'scale(1.2)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        }
    } catch (error) {
        console.error('\u590D\u5236\u5931\u8D25:', error);
        alert('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236');
    }
}

// \u663E\u793A\u590D\u5236\u6210\u529F\u63D0\u793A
function showCopySuccess(type) {
    // \u521B\u5EFA\u63D0\u793A\u5143\u7D20
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = \`\${type}\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\`;
    
    // \u6DFB\u52A0\u5230\u9875\u9762
    document.body.appendChild(notification);
    
    // \u663E\u793A\u52A8\u753B
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // \u81EA\u52A8\u9690\u85CF
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}`;
}
__name(getJSContent, "getJSContent");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-REs1Xv/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-REs1Xv/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
