// 工具类 - 账户和分类管理

// 通用响应工具
export class ResponseUtil {
  static success(data, corsHeaders) {
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  static error(message, status = 500, corsHeaders) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  static created(data, corsHeaders) {
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 用户凭据管理工具类
export class UserManager {
  // 简单的密码哈希函数（生产环境应使用更安全的哈希算法）
  static hashPassword(password) {
    // 这里使用简单的哈希，实际项目中应使用bcrypt等
    return btoa(password + 'salt_' + Date.now());
  }

  // 验证密码
  static verifyPassword(password, hashedPassword) {
    // 简单的验证逻辑，实际项目中应使用proper哈希验证
    return password === atob(hashedPassword).replace('salt_' + Date.now(), '');
  }

  // 检查是否已设置用户
  static async isUserSet(env) {
    try {
      const userData = await env.ACCOUNT_DATA.get('user_credentials');
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
        return ResponseUtil.error('Username and password are required', 400, corsHeaders);
      }

      if (username.length < 3) {
        return ResponseUtil.error('Username must be at least 3 characters', 400, corsHeaders);
      }

      if (password.length < 6) {
        return ResponseUtil.error('Password must be at least 6 characters', 400, corsHeaders);
      }

      // 检查是否已存在用户
      const existingUser = await env.ACCOUNT_DATA.get('user_credentials');
      if (existingUser) {
        return ResponseUtil.error('User already exists', 409, corsHeaders);
      }

      // 创建用户凭据
      const userData = {
        username: username.trim(),
        passwordHash: this.hashPassword(password),
        createdAt: new Date().toISOString()
      };

      await env.ACCOUNT_DATA.put('user_credentials', JSON.stringify(userData));
      
      return ResponseUtil.created({ 
        success: true, 
        message: 'Initial user created successfully' 
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to create user', 500, corsHeaders);
    }
  }

  // 验证用户登录
  static async verifyUser(request, env, corsHeaders) {
    try {
      const { username, password } = await request.json();
      
      if (!username || !password) {
        return ResponseUtil.error('Username and password are required', 400, corsHeaders);
      }

      const userData = await env.ACCOUNT_DATA.get('user_credentials', { type: 'json' });
      
      if (!userData) {
        return ResponseUtil.error('No user found', 404, corsHeaders);
      }

      if (userData.username !== username.trim()) {
        return ResponseUtil.error('Invalid credentials', 401, corsHeaders);
      }

      // 验证密码（简化版本）
      const isValidPassword = password === atob(userData.passwordHash).split('salt_')[0];
      
      if (!isValidPassword) {
        return ResponseUtil.error('Invalid credentials', 401, corsHeaders);
      }

      return ResponseUtil.success({ 
        success: true, 
        username: userData.username,
        message: 'Login successful' 
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to verify user', 500, corsHeaders);
    }
  }

  // 更新用户密码
  static async updatePassword(request, env, corsHeaders) {
    try {
      const { currentPassword, newPassword } = await request.json();
      
      if (!currentPassword || !newPassword) {
        return ResponseUtil.error('Current password and new password are required', 400, corsHeaders);
      }

      if (newPassword.length < 6) {
        return ResponseUtil.error('New password must be at least 6 characters', 400, corsHeaders);
      }

      const userData = await env.ACCOUNT_DATA.get('user_credentials', { type: 'json' });
      
      if (!userData) {
        return ResponseUtil.error('No user found', 404, corsHeaders);
      }

      // 验证当前密码
      const isValidCurrentPassword = currentPassword === atob(userData.passwordHash).split('salt_')[0];
      
      if (!isValidCurrentPassword) {
        return ResponseUtil.error('Current password is incorrect', 401, corsHeaders);
      }

      // 更新密码
      userData.passwordHash = this.hashPassword(newPassword);
      userData.updatedAt = new Date().toISOString();

      await env.ACCOUNT_DATA.put('user_credentials', JSON.stringify(userData));
      
      return ResponseUtil.success({ 
        success: true, 
        message: 'Password updated successfully' 
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to update password', 500, corsHeaders);
    }
  }

  // 获取用户信息
  static async getUserInfo(env, corsHeaders) {
    try {
      const userData = await env.ACCOUNT_DATA.get('user_credentials', { type: 'json' });
      
      if (!userData) {
        return ResponseUtil.error('No user found', 404, corsHeaders);
      }

      return ResponseUtil.success({ 
        username: userData.username,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to get user info', 500, corsHeaders);
    }
  }
}

// 账户管理工具类
export class AccountManager {
  static async getAll(env, corsHeaders) {
    try {
      const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
      return ResponseUtil.success(accounts, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to get accounts', 500, corsHeaders);
    }
  }

  static async create(request, env, corsHeaders) {
    try {
      const account = await request.json();
      const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
      
      account.id = Date.now().toString();
      account.createdAt = new Date().toISOString();
      accounts.push(account);
      
      await env.ACCOUNT_DATA.put('accounts', JSON.stringify(accounts));
      
      return ResponseUtil.created(account, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to create account', 500, corsHeaders);
    }
  }

  static async update(request, env, corsHeaders) {
    try {
      const updatedAccount = await request.json();
      const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
      
      const index = accounts.findIndex(acc => acc.id === updatedAccount.id);
      if (index === -1) {
        return ResponseUtil.error('Account not found', 404, corsHeaders);
      }
      
      updatedAccount.updatedAt = new Date().toISOString();
      accounts[index] = updatedAccount;
      
      await env.ACCOUNT_DATA.put('accounts', JSON.stringify(accounts));
      
      return ResponseUtil.success(updatedAccount, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to update account', 500, corsHeaders);
    }
  }

  static async delete(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return ResponseUtil.error('Account ID required', 400, corsHeaders);
      }
      
      const accounts = await env.ACCOUNT_DATA.get('accounts', { type: 'json' }) || [];
      const filteredAccounts = accounts.filter(acc => acc.id !== id);
      
      await env.ACCOUNT_DATA.put('accounts', JSON.stringify(filteredAccounts));
      
      return ResponseUtil.success({ success: true }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to delete account', 500, corsHeaders);
    }
  }
}

// 分类管理工具类
export class CategoryManager {
  static async getAll(env, corsHeaders) {
    try {
      const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
      return ResponseUtil.success(categories, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to get categories', 500, corsHeaders);
    }
  }

  static async create(request, env, corsHeaders) {
    try {
      const category = await request.json();
      const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
      
      category.id = Date.now().toString();
      category.createdAt = new Date().toISOString();
      categories.push(category);
      
      await env.ACCOUNT_DATA.put('categories', JSON.stringify(categories));
      
      return ResponseUtil.created(category, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to create category', 500, corsHeaders);
    }
  }

  static async delete(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return ResponseUtil.error('Category ID required', 400, corsHeaders);
      }
      
      const categories = await env.ACCOUNT_DATA.get('categories', { type: 'json' }) || [];
      const filteredCategories = categories.filter(cat => cat.id !== id);
      
      await env.ACCOUNT_DATA.put('categories', JSON.stringify(filteredCategories));
      
      return ResponseUtil.success({ success: true }, corsHeaders);
    } catch (error) {
      return ResponseUtil.error('Failed to delete category', 500, corsHeaders);
    }
  }
}

// API路由处理器
export class APIHandler {
  static async handleAccounts(request, env, corsHeaders) {
    const { method } = request;

    switch (method) {
      case 'GET':
        return await AccountManager.getAll(env, corsHeaders);
      case 'POST':
        return await AccountManager.create(request, env, corsHeaders);
      case 'PUT':
        return await AccountManager.update(request, env, corsHeaders);
      case 'DELETE':
        return await AccountManager.delete(request, env, corsHeaders);
      default:
        return ResponseUtil.error('Method not allowed', 405, corsHeaders);
    }
  }

  static async handleCategories(request, env, corsHeaders) {
    const { method } = request;

    switch (method) {
      case 'GET':
        return await CategoryManager.getAll(env, corsHeaders);
      case 'POST':
        return await CategoryManager.create(request, env, corsHeaders);
      case 'DELETE':
        return await CategoryManager.delete(request, env, corsHeaders);
      default:
        return ResponseUtil.error('Method not allowed', 405, corsHeaders);
    }
  }

  static async handleUsers(request, env, corsHeaders) {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;

    switch (method) {
      case 'POST':
        if (path === '/api/users/setup') {
          return await UserManager.createInitialUser(request, env, corsHeaders);
        } else if (path === '/api/users/login') {
          return await UserManager.verifyUser(request, env, corsHeaders);
        } else if (path === '/api/users/password') {
          return await UserManager.updatePassword(request, env, corsHeaders);
        }
        break;
      case 'GET':
        if (path === '/api/users/info') {
          return await UserManager.getUserInfo(env, corsHeaders);
        } else if (path === '/api/users/check') {
          const isUserSet = await UserManager.isUserSet(env);
          return ResponseUtil.success({ isUserSet }, corsHeaders);
        }
        break;
      default:
        return ResponseUtil.error('Method not allowed', 405, corsHeaders);
    }

    return ResponseUtil.error('Not Found', 404, corsHeaders);
  }

  static async handleAPI(request, env, corsHeaders) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/accounts') {
      return await this.handleAccounts(request, env, corsHeaders);
    } else if (path === '/api/categories') {
      return await this.handleCategories(request, env, corsHeaders);
    } else if (path.startsWith('/api/users')) {
      return await this.handleUsers(request, env, corsHeaders);
    }

    return ResponseUtil.error('Not Found', 404, corsHeaders);
  }
} 