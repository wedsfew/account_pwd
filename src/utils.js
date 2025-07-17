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

  static async handleAPI(request, env, corsHeaders) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/accounts') {
      return await this.handleAccounts(request, env, corsHeaders);
    } else if (path === '/api/categories') {
      return await this.handleCategories(request, env, corsHeaders);
    }

    return ResponseUtil.error('Not Found', 404, corsHeaders);
  }
} 