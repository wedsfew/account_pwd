var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-tYCJvG/checked-fetch.js
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

// .wrangler/tmp/bundle-tYCJvG/strip-cf-connecting-ip-header.js
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
            padding: 14px 18px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8fafc;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: translateY(-1px);
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
            border-radius: 25px;
            padding: 45px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            width: 90%;
            max-width: 400px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from { 
                opacity: 0; 
                transform: translateY(30px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        .login-header {
            margin-bottom: 30px;
        }

        .login-header h1 {
            color: #4a5568;
            font-size: 2.2rem;
            margin-bottom: 12px;
            font-weight: 700;
            letter-spacing: -0.5px;
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
            padding: 14px 18px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8fafc;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: translateY(-1px);
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
    <div class="container">
        <header>
            <div class="header-content">
                <h1>\u{1F510} \u8D26\u6237\u5BC6\u7801\u7BA1\u7406\u5DE5\u5177</h1>
                <div class="user-info">
                    <span id="userDisplay">\u6B22\u8FCE\uFF0Cadmin</span>
                    <button onclick="showChangePassword()" class="change-pwd-btn">\u4FEE\u6539\u5BC6\u7801</button>
                    <button onclick="logout()" class="logout-btn">\u767B\u51FA</button>
                </div>
            </div>
        </header>
        
        <div class="main-content">
            <!-- \u5206\u7C7B\u7BA1\u7406 -->
            <div class="section">
                <h2>\u{1F4C1} \u5206\u7C7B\u7BA1\u7406</h2>
                <div class="category-form">
                    <input type="text" id="categoryName" placeholder="\u8F93\u5165\u5206\u7C7B\u540D\u79F0" maxlength="20">
                    <button onclick="addCategory()">\u6DFB\u52A0\u5206\u7C7B</button>
                </div>
                <div id="categoriesList" class="categories-list"></div>
            </div>
            
            <!-- \u8D26\u6237\u7BA1\u7406 -->
            <div class="section">
                <h2>\u{1F464} \u8D26\u6237\u7BA1\u7406</h2>
                <div class="account-form">
                    <select id="accountCategory" required>
                        <option value="">\u9009\u62E9\u5206\u7C7B</option>
                    </select>
                    <input type="text" id="accountName" placeholder="\u8D26\u6237\u540D\u79F0" required maxlength="50">
                    <input type="text" id="accountUsername" placeholder="\u7528\u6237\u540D" required maxlength="100">
                    <input type="password" id="accountPassword" placeholder="\u5BC6\u7801" required maxlength="100">
                    <input type="text" id="accountUrl" placeholder="\u7F51\u5740 (\u53EF\u9009)" maxlength="200">
                    <textarea id="accountNotes" placeholder="\u5907\u6CE8 (\u53EF\u9009)" maxlength="500"></textarea>
                    <button onclick="addAccount()">\u6DFB\u52A0\u8D26\u6237</button>
                </div>
                <div id="accountsList" class="accounts-list"></div>
            </div>
        </div>
    </div>
    
    <!-- \u7F16\u8F91\u6A21\u6001\u6846 -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>\u7F16\u8F91\u8D26\u6237</h3>
            <form id="editForm">
                <select id="editCategory" required>
                    <option value="">\u9009\u62E9\u5206\u7C7B</option>
                </select>
                <input type="text" id="editName" placeholder="\u8D26\u6237\u540D\u79F0" required maxlength="50">
                <input type="text" id="editUsername" placeholder="\u7528\u6237\u540D" required maxlength="100">
                <input type="password" id="editPassword" placeholder="\u5BC6\u7801" required maxlength="100">
                <input type="text" id="editUrl" placeholder="\u7F51\u5740 (\u53EF\u9009)" maxlength="200">
                <textarea id="editNotes" placeholder="\u5907\u6CE8 (\u53EF\u9009)" maxlength="500"></textarea>
                <button type="submit">\u4FDD\u5B58</button>
            </form>
        </div>
    </div>
    
    <!-- \u4FEE\u6539\u5BC6\u7801\u6A21\u6001\u6846 -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>\u4FEE\u6539\u5BC6\u7801</h3>
            <form id="changePasswordForm">
                <input type="password" id="currentPassword" placeholder="\u5F53\u524D\u5BC6\u7801" required>
                <input type="password" id="newPassword" placeholder="\u65B0\u5BC6\u7801" required minlength="6">
                <input type="password" id="confirmNewPassword" placeholder="\u786E\u8BA4\u65B0\u5BC6\u7801" required minlength="6">
                <button type="submit">\u4FEE\u6539\u5BC6\u7801</button>
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

header {
    text-align: center;
    margin-bottom: 40px;
    position: relative;
}

header::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 2px;
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
    font-weight: 700;
    letter-spacing: -0.5px;
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

.change-pwd-btn {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 2px solid rgba(255,255,255,0.25);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-right: 10px;
}

.change-pwd-btn:hover {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.4);
    transform: translateY(-1px);
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
    animation: slideUp 0.6s ease-out 0.2s both;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}

.section {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.section:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

.section h2 {
    color: #4a5568;
    margin-bottom: 25px;
    font-size: 1.6rem;
    font-weight: 600;
    position: relative;
    padding-bottom: 10px;
}

.section h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 1px;
}

/* \u8868\u5355\u6837\u5F0F */
.category-form, .account-form {
    margin-bottom: 25px;
}

input, select, textarea {
    width: 100%;
    padding: 14px 16px;
    margin-bottom: 18px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: #f8fafc;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
}

button:hover::before {
    left: 100%;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

/* \u5217\u8868\u6837\u5F0F */
.categories-list, .accounts-list {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;
}

.categories-list::-webkit-scrollbar, .accounts-list::-webkit-scrollbar {
    width: 6px;
}

.categories-list::-webkit-scrollbar-track, .accounts-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.categories-list::-webkit-scrollbar-thumb, .accounts-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.categories-list::-webkit-scrollbar-thumb:hover, .accounts-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.category-item, .account-item {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.category-item::before, .account-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #667eea, #764ba2);
    transform: scaleY(0);
    transition: transform 0.3s ease;
}

.category-item:hover::before, .account-item:hover::before {
    transform: scaleY(1);
}

.category-item:hover, .account-item:hover {
    background: #edf2f7;
    transform: translateX(5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.category-name {
    font-weight: 600;
    color: #4a5568;
    font-size: 15px;
    transition: color 0.3s ease;
}

.category-item:hover .category-name {
    color: #2d3748;
}

.account-info {
    flex: 1;
    padding-left: 8px;
}

.account-name {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 6px;
    font-size: 16px;
    transition: color 0.3s ease;
}

.account-item:hover .account-name {
    color: #1a202c;
}

.account-username {
    color: #718096;
    font-size: 14px;
    transition: color 0.3s ease;
}

.account-item:hover .account-username {
    color: #4a5568;
}

.account-category {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    margin-left: 10px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
    transition: all 0.3s ease;
}

.account-item:hover .account-category {
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    transform: scale(1.05);
}

.delete-btn {
    background: #e53e3e;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    margin-left: 10px;
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
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
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

.edit-btn {
    background: linear-gradient(135deg, #3182ce, #4299e1);
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(49, 130, 206, 0.2);
}

.edit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(49, 130, 206, 0.3);
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
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 35px;
    border-radius: 20px;
    width: 90%;
    max-width: 500px;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from { 
        opacity: 0; 
        transform: translateY(-50px) scale(0.9); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
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
    margin-bottom: 25px;
    color: #4a5568;
    font-size: 1.4rem;
    font-weight: 600;
    text-align: center;
    position: relative;
}

.modal-content h3::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 1px;
}

/* \u54CD\u5E94\u5F0F\u8BBE\u8BA1 */
@media (max-width: 768px) {
    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 15px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .main-content {
        grid-template-columns: 1fr;
        gap: 20px;
    }
    
    .container {
        padding: 15px;
    }
    
    .section {
        padding: 25px;
    }
    
    .modal-content {
        padding: 25px;
        margin: 10% auto;
    }
    
    .user-info {
        flex-direction: column;
        gap: 10px;
    }
    
    .change-pwd-btn, .logout-btn {
        margin: 0;
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

// \u663E\u793A\u4FEE\u6539\u5BC6\u7801\u6A21\u6001\u6846
function showChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'block';
    // \u6E05\u7A7A\u8868\u5355
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
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
        
        updateCategoriesList();
        updateCategorySelects();
        updateAccountsList();
        alert('\u5206\u7C7B\u5220\u9664\u6210\u529F');
    } catch (error) {
        console.error('\u5220\u9664\u5206\u7C7B\u5931\u8D25:', error);
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
            <button class="delete-btn" onclick="deleteCategory('\${category.id}')" title="\u5220\u9664"></button>
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
        updateAccountsList();
        clearAccountForm();
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
        
        updateAccountsList();
        document.getElementById('editModal').style.display = 'none';
        editingAccountId = null;
        alert('\u8D26\u6237\u66F4\u65B0\u6210\u529F');
    } catch (error) {
        console.error('\u66F4\u65B0\u8D26\u6237\u5931\u8D25:', error);
    }
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

// .wrangler/tmp/bundle-tYCJvG/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-tYCJvG/middleware-loader.entry.ts
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
