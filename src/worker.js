// Cloudflare Worker - 账号密码管理系统后端

// 环境变量
const ACCOUNT_DATA = ACCOUNT_DATA; // KV命名空间

// CORS 配置
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// 工具函数
const utils = {
    // 生成唯一ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 创建响应
    createResponse: (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    },

    // 创建错误响应
    createErrorResponse: (message, status = 400) => {
        return utils.createResponse({ error: message }, status);
    },

    // 验证数据
    validateCategory: (category) => {
        if (!category.name || typeof category.name !== 'string') {
            return '分类名称是必需的';
        }
        if (!category.icon || typeof category.icon !== 'string') {
            return '分类图标是必需的';
        }
        return null;
    },

    validateAccount: (account) => {
        if (!account.name || typeof account.name !== 'string') {
            return '账号名称是必需的';
        }
        if (!account.username || typeof account.username !== 'string') {
            return '用户名是必需的';
        }
        if (!account.password || typeof account.password !== 'string') {
            return '密码是必需的';
        }
        if (!account.categoryId || typeof account.categoryId !== 'string') {
            return '分类ID是必需的';
        }
        return null;
    }
};

// 数据存储服务
const storageService = {
    // 获取所有分类
    async getCategories() {
        try {
            const categoriesData = await ACCOUNT_DATA.get('categories');
            return categoriesData ? JSON.parse(categoriesData) : [];
        } catch (error) {
            console.error('获取分类失败:', error);
            return [];
        }
    },

    // 保存分类
    async saveCategories(categories) {
        try {
            await ACCOUNT_DATA.put('categories', JSON.stringify(categories));
            return true;
        } catch (error) {
            console.error('保存分类失败:', error);
            return false;
        }
    },

    // 添加分类
    async addCategory(category) {
        const categories = await this.getCategories();
        const newCategory = {
            id: utils.generateId(),
            name: category.name,
            icon: category.icon,
            createdAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        const success = await this.saveCategories(categories);
        
        if (success) {
            return newCategory;
        } else {
            throw new Error('保存分类失败');
        }
    },

    // 删除分类
    async deleteCategory(categoryId) {
        const categories = await this.getCategories();
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        
        if (filteredCategories.length === categories.length) {
            throw new Error('分类不存在');
        }
        
        const success = await this.saveCategories(filteredCategories);
        
        if (!success) {
            throw new Error('删除分类失败');
        }
        
        // 同时删除该分类下的所有账号
        await this.deleteAccountsByCategory(categoryId);
        
        return true;
    },

    // 获取所有账号
    async getAccounts() {
        try {
            const accountsData = await ACCOUNT_DATA.get('accounts');
            return accountsData ? JSON.parse(accountsData) : [];
        } catch (error) {
            console.error('获取账号失败:', error);
            return [];
        }
    },

    // 保存账号
    async saveAccounts(accounts) {
        try {
            await ACCOUNT_DATA.put('accounts', JSON.stringify(accounts));
            return true;
        } catch (error) {
            console.error('保存账号失败:', error);
            return false;
        }
    },

    // 添加账号
    async addAccount(account) {
        const accounts = await this.getAccounts();
        const newAccount = {
            id: utils.generateId(),
            categoryId: account.categoryId,
            name: account.name,
            username: account.username,
            password: account.password,
            url: account.url || null,
            notes: account.notes || null,
            createdAt: new Date().toISOString()
        };
        
        accounts.push(newAccount);
        const success = await this.saveAccounts(accounts);
        
        if (success) {
            return newAccount;
        } else {
            throw new Error('保存账号失败');
        }
    },

    // 更新账号
    async updateAccount(accountId, accountData) {
        const accounts = await this.getAccounts();
        const accountIndex = accounts.findIndex(a => a.id === accountId);
        
        if (accountIndex === -1) {
            throw new Error('账号不存在');
        }
        
        accounts[accountIndex] = {
            ...accounts[accountIndex],
            ...accountData,
            updatedAt: new Date().toISOString()
        };
        
        const success = await this.saveAccounts(accounts);
        
        if (success) {
            return accounts[accountIndex];
        } else {
            throw new Error('更新账号失败');
        }
    },

    // 删除账号
    async deleteAccount(accountId) {
        const accounts = await this.getAccounts();
        const filteredAccounts = accounts.filter(a => a.id !== accountId);
        
        if (filteredAccounts.length === accounts.length) {
            throw new Error('账号不存在');
        }
        
        const success = await this.saveAccounts(filteredAccounts);
        
        if (!success) {
            throw new Error('删除账号失败');
        }
        
        return true;
    },

    // 根据分类删除账号
    async deleteAccountsByCategory(categoryId) {
        const accounts = await this.getAccounts();
        const filteredAccounts = accounts.filter(a => a.categoryId !== categoryId);
        
        return await this.saveAccounts(filteredAccounts);
    }
};

// API 路由处理
const apiHandler = {
    // 处理分类相关请求
    async handleCategories(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        if (request.method === 'GET') {
            // 获取所有分类
            if (path === '/api/categories') {
                const categories = await storageService.getCategories();
                return utils.createResponse(categories);
            }
        } else if (request.method === 'POST') {
            // 添加分类
            if (path === '/api/categories') {
                try {
                    const category = await request.json();
                    const validationError = utils.validateCategory(category);
                    
                    if (validationError) {
                        return utils.createErrorResponse(validationError);
                    }
                    
                    const newCategory = await storageService.addCategory(category);
                    return utils.createResponse(newCategory, 201);
                } catch (error) {
                    return utils.createErrorResponse(error.message, 500);
                }
            }
        } else if (request.method === 'DELETE') {
            // 删除分类
            const categoryId = path.split('/').pop();
            if (path.startsWith('/api/categories/') && categoryId) {
                try {
                    await storageService.deleteCategory(categoryId);
                    return utils.createResponse({ message: '分类删除成功' });
                } catch (error) {
                    return utils.createErrorResponse(error.message, 500);
                }
            }
        }
        
        return utils.createErrorResponse('方法不允许', 405);
    },

    // 处理账号相关请求
    async handleAccounts(request) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        if (request.method === 'GET') {
            // 获取所有账号
            if (path === '/api/accounts') {
                const accounts = await storageService.getAccounts();
                return utils.createResponse(accounts);
            }
        } else if (request.method === 'POST') {
            // 添加账号
            if (path === '/api/accounts') {
                try {
                    const account = await request.json();
                    const validationError = utils.validateAccount(account);
                    
                    if (validationError) {
                        return utils.createErrorResponse(validationError);
                    }
                    
                    const newAccount = await storageService.addAccount(account);
                    return utils.createResponse(newAccount, 201);
                } catch (error) {
                    return utils.createErrorResponse(error.message, 500);
                }
            }
        } else if (request.method === 'PUT') {
            // 更新账号
            const accountId = path.split('/').pop();
            if (path.startsWith('/api/accounts/') && accountId) {
                try {
                    const accountData = await request.json();
                    const validationError = utils.validateAccount(accountData);
                    
                    if (validationError) {
                        return utils.createErrorResponse(validationError);
                    }
                    
                    const updatedAccount = await storageService.updateAccount(accountId, accountData);
                    return utils.createResponse(updatedAccount);
                } catch (error) {
                    return utils.createErrorResponse(error.message, 500);
                }
            }
        } else if (request.method === 'DELETE') {
            // 删除账号
            const accountId = path.split('/').pop();
            if (path.startsWith('/api/accounts/') && accountId) {
                try {
                    await storageService.deleteAccount(accountId);
                    return utils.createResponse({ message: '账号删除成功' });
                } catch (error) {
                    return utils.createErrorResponse(error.message, 500);
                }
            }
        }
        
        return utils.createErrorResponse('方法不允许', 405);
    },

    // 处理健康检查
    async handleHealthCheck() {
        return utils.createResponse({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'account-password-manager'
        });
    }
};

// 主请求处理函数
async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }
    
    // 处理静态文件
    if (path === '/' || path === '/index.html') {
        return new Response(await fetch(request.url.replace('/index.html', '/src/index.html')), {
            headers: {
                'Content-Type': 'text/html',
                ...corsHeaders
            }
        });
    }
    
    // 处理 CSS 文件
    if (path.endsWith('.css')) {
        const cssResponse = await fetch(request.url);
        return new Response(cssResponse.body, {
            headers: {
                'Content-Type': 'text/css',
                ...corsHeaders
            }
        });
    }
    
    // 处理 JS 文件
    if (path.endsWith('.js')) {
        const jsResponse = await fetch(request.url);
        return new Response(jsResponse.body, {
            headers: {
                'Content-Type': 'application/javascript',
                ...corsHeaders
            }
        });
    }
    
    // 处理 API 请求
    if (path.startsWith('/api/')) {
        if (path.startsWith('/api/categories')) {
            return await apiHandler.handleCategories(request);
        } else if (path.startsWith('/api/accounts')) {
            return await apiHandler.handleAccounts(request);
        } else if (path === '/api/health') {
            return await apiHandler.handleHealthCheck();
        }
        
        return utils.createErrorResponse('API端点不存在', 404);
    }
    
    // 默认返回主页
    return new Response(await fetch(request.url.replace(url.pathname, '/src/index.html')), {
        headers: {
            'Content-Type': 'text/html',
            ...corsHeaders
        }
    });
}

// 事件监听器
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
}); 