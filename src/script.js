// 全局变量
let categories = [];
let accounts = [];
let currentDeleteItem = null;
let currentDeleteType = null;

// 工具函数
const utils = {
    // 生成唯一ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 显示通知
    showNotification: (message, type = 'success') => {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },

    // 加密数据（简单加密，实际项目中应使用更安全的加密方法）
    encrypt: (data) => {
        return btoa(JSON.stringify(data));
    },

    // 解密数据
    decrypt: (encryptedData) => {
        try {
            return JSON.parse(atob(encryptedData));
        } catch (error) {
            console.error('解密失败:', error);
            return null;
        }
    },

    // 复制到剪贴板
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            utils.showNotification('已复制到剪贴板', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            utils.showNotification('复制失败', 'error');
        }
    }
};

// API 服务
const apiService = {
    // 基础URL（部署后需要更新）
    baseUrl: '', // 部署时设置为实际的Worker URL

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },

    // 获取所有分类
    async getCategories() {
        return await this.request('/api/categories');
    },

    // 添加分类
    async addCategory(category) {
        return await this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(category)
        });
    },

    // 删除分类
    async deleteCategory(categoryId) {
        return await this.request(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });
    },

    // 获取所有账号
    async getAccounts() {
        return await this.request('/api/accounts');
    },

    // 添加账号
    async addAccount(account) {
        return await this.request('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(account)
        });
    },

    // 更新账号
    async updateAccount(accountId, account) {
        return await this.request(`/api/accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(account)
        });
    },

    // 删除账号
    async deleteAccount(accountId) {
        return await this.request(`/api/accounts/${accountId}`, {
            method: 'DELETE'
        });
    }
};

// 数据管理
const dataManager = {
    // 初始化数据
    async init() {
        try {
            await this.loadCategories();
            await this.loadAccounts();
            this.renderCategories();
            this.renderAccounts();
        } catch (error) {
            console.error('初始化失败:', error);
            utils.showNotification('加载数据失败', 'error');
        }
    },

    // 加载分类
    async loadCategories() {
        try {
            categories = await apiService.getCategories();
        } catch (error) {
            console.error('加载分类失败:', error);
            // 如果API不可用，使用本地存储
            categories = this.loadFromLocalStorage('categories') || [];
        }
    },

    // 加载账号
    async loadAccounts() {
        try {
            accounts = await apiService.getAccounts();
        } catch (error) {
            console.error('加载账号失败:', error);
            // 如果API不可用，使用本地存储
            accounts = this.loadFromLocalStorage('accounts') || [];
        }
    },

    // 保存分类
    async saveCategory(category) {
        try {
            const newCategory = await apiService.addCategory(category);
            categories.push(newCategory);
            this.saveToLocalStorage('categories', categories);
            this.renderCategories();
            utils.showNotification('分类添加成功', 'success');
        } catch (error) {
            console.error('保存分类失败:', error);
            // 本地保存
            category.id = utils.generateId();
            categories.push(category);
            this.saveToLocalStorage('categories', categories);
            this.renderCategories();
            utils.showNotification('分类添加成功（本地模式）', 'info');
        }
    },

    // 删除分类
    async deleteCategory(categoryId) {
        try {
            await apiService.deleteCategory(categoryId);
            categories = categories.filter(c => c.id !== categoryId);
            // 同时删除该分类下的所有账号
            accounts = accounts.filter(a => a.categoryId !== categoryId);
            this.saveToLocalStorage('categories', categories);
            this.saveToLocalStorage('accounts', accounts);
            this.renderCategories();
            this.renderAccounts();
            utils.showNotification('分类删除成功', 'success');
        } catch (error) {
            console.error('删除分类失败:', error);
            // 本地删除
            categories = categories.filter(c => c.id !== categoryId);
            accounts = accounts.filter(a => a.categoryId !== categoryId);
            this.saveToLocalStorage('categories', categories);
            this.saveToLocalStorage('accounts', accounts);
            this.renderCategories();
            this.renderAccounts();
            utils.showNotification('分类删除成功（本地模式）', 'info');
        }
    },

    // 保存账号
    async saveAccount(account) {
        try {
            const newAccount = await apiService.addAccount(account);
            accounts.push(newAccount);
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号添加成功', 'success');
        } catch (error) {
            console.error('保存账号失败:', error);
            // 本地保存
            account.id = utils.generateId();
            accounts.push(account);
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号添加成功（本地模式）', 'info');
        }
    },

    // 更新账号
    async updateAccount(accountId, accountData) {
        try {
            const updatedAccount = await apiService.updateAccount(accountId, accountData);
            const index = accounts.findIndex(a => a.id === accountId);
            if (index !== -1) {
                accounts[index] = updatedAccount;
            }
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号更新成功', 'success');
        } catch (error) {
            console.error('更新账号失败:', error);
            // 本地更新
            const index = accounts.findIndex(a => a.id === accountId);
            if (index !== -1) {
                accounts[index] = { ...accounts[index], ...accountData };
            }
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号更新成功（本地模式）', 'info');
        }
    },

    // 删除账号
    async deleteAccount(accountId) {
        try {
            await apiService.deleteAccount(accountId);
            accounts = accounts.filter(a => a.id !== accountId);
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号删除成功', 'success');
        } catch (error) {
            console.error('删除账号失败:', error);
            // 本地删除
            accounts = accounts.filter(a => a.id !== accountId);
            this.saveToLocalStorage('accounts', accounts);
            this.renderAccounts();
            utils.showNotification('账号删除成功（本地模式）', 'info');
        }
    },

    // 本地存储方法
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('保存到本地存储失败:', error);
        }
    },

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('从本地存储加载失败:', error);
            return null;
        }
    }
};

// UI 渲染器
const uiRenderer = {
    // 渲染分类
    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        
        if (categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>暂无分类</h3>
                    <p>点击"添加分类"按钮创建您的第一个分类</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => {
            const accountCount = accounts.filter(a => a.categoryId === category.id).length;
            return `
                <div class="category-card">
                    <h3>
                        <i class="${category.icon}"></i>
                        ${category.name}
                    </h3>
                    <div class="account-count">${accountCount} 个账号</div>
                    <div class="category-actions">
                        <button class="btn btn-small btn-secondary" onclick="editCategory('${category.id}')" title="编辑分类">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteCategory('${category.id}')" title="删除分类">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染账号
    renderAccounts(filteredAccounts = null) {
        const container = document.getElementById('accountsContainer');
        const accountsToRender = filteredAccounts || accounts;
        
        if (accountsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-key"></i>
                    <h3>暂无账号</h3>
                    <p>点击"添加账号"按钮添加您的第一个账号</p>
                </div>
            `;
            return;
        }

        container.innerHTML = accountsToRender.map(account => {
            const category = categories.find(c => c.id === account.categoryId);
            return `
                <div class="account-card">
                    <div class="account-header">
                        <div>
                            <div class="account-title">${account.name}</div>
                            ${category ? `<span class="account-category"><i class="${category.icon}"></i>${category.name}</span>` : ''}
                        </div>
                        <div class="account-actions">
                            <button class="btn btn-small btn-secondary" onclick="editAccount('${account.id}')" title="编辑账号">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteAccount('${account.id}')" title="删除账号">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="account-info">
                        <div class="info-row">
                            <span class="info-label">用户名:</span>
                            <span class="info-value">${account.username}</span>
                            <button class="btn btn-small" onclick="utils.copyToClipboard('${account.username}')" title="复制用户名">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div class="info-row">
                            <span class="info-label">密码:</span>
                            <div class="password-field">
                                <input type="password" value="${account.password}" readonly>
                                <button class="password-toggle" onclick="togglePassword(this.previousElementSibling)">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-small" onclick="utils.copyToClipboard('${account.password}')" title="复制密码">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        ${account.url ? `
                            <div class="info-row">
                                <span class="info-label">网址:</span>
                                <span class="info-value">
                                    <a href="${account.url}" target="_blank" rel="noopener noreferrer">${account.url}</a>
                                </span>
                            </div>
                        ` : ''}
                        ${account.notes ? `
                            <div class="info-row">
                                <span class="info-label">备注:</span>
                                <span class="info-value">${account.notes}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
};

// 模态框管理
const modalManager = {
    // 显示模态框
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    },

    // 关闭模态框
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        // 清空表单
        const form = document.querySelector(`#${modalId} form`);
        if (form) {
            form.reset();
        }
    },

    // 显示添加分类模态框
    showAddCategoryModal() {
        this.showModal('addCategoryModal');
    },

    // 显示添加账号模态框
    showAddAccountModal() {
        // 更新分类选择器
        const categorySelect = document.getElementById('accountCategory');
        categorySelect.innerHTML = '<option value="">请选择分类</option>' + 
            categories.map(category => 
                `<option value="${category.id}">${category.name}</option>`
            ).join('');
        
        this.showModal('addAccountModal');
    },

    // 显示编辑账号模态框
    showEditAccountModal(accountId) {
        const account = accounts.find(a => a.id === accountId);
        if (!account) return;

        // 填充表单
        document.getElementById('editAccountId').value = account.id;
        document.getElementById('editAccountName').value = account.name;
        document.getElementById('editAccountUsername').value = account.username;
        document.getElementById('editAccountPassword').value = account.password;
        document.getElementById('editAccountUrl').value = account.url || '';
        document.getElementById('editAccountNotes').value = account.notes || '';

        // 更新分类选择器
        const categorySelect = document.getElementById('editAccountCategory');
        categorySelect.innerHTML = '<option value="">请选择分类</option>' + 
            categories.map(category => 
                `<option value="${category.id}" ${category.id === account.categoryId ? 'selected' : ''}>${category.name}</option>`
            ).join('');

        this.showModal('editAccountModal');
    },

    // 显示确认删除模态框
    showConfirmDeleteModal(itemId, itemType, message) {
        currentDeleteItem = itemId;
        currentDeleteType = itemType;
        document.getElementById('deleteConfirmMessage').textContent = message;
        this.showModal('confirmDeleteModal');
    }
};

// 事件处理函数
function showAddCategoryModal() {
    modalManager.showAddCategoryModal();
}

function showAddAccountModal() {
    modalManager.showAddAccountModal();
}

function closeModal(modalId) {
    modalManager.closeModal(modalId);
}

function togglePassword(input) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    const icon = input.nextElementSibling.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function searchAccounts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredAccounts = accounts.filter(account => 
        account.name.toLowerCase().includes(searchTerm) ||
        account.username.toLowerCase().includes(searchTerm) ||
        (account.notes && account.notes.toLowerCase().includes(searchTerm))
    );
    uiRenderer.renderAccounts(filteredAccounts);
}

function editAccount(accountId) {
    modalManager.showEditAccountModal(accountId);
}

function deleteAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    const message = `确定要删除账号 "${account.name}" 吗？`;
    modalManager.showConfirmDeleteModal(accountId, 'account', message);
}

function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    const accountCount = accounts.filter(a => a.categoryId === categoryId).length;
    const message = `确定要删除分类 "${category.name}" 吗？这将同时删除该分类下的 ${accountCount} 个账号。`;
    modalManager.showConfirmDeleteModal(categoryId, 'category', message);
}

function confirmDelete() {
    if (currentDeleteType === 'account') {
        dataManager.deleteAccount(currentDeleteItem);
    } else if (currentDeleteType === 'category') {
        dataManager.deleteCategory(currentDeleteItem);
    }
    modalManager.closeModal('confirmDeleteModal');
}

// 表单提交处理
document.addEventListener('DOMContentLoaded', function() {
    // 添加分类表单
    document.getElementById('addCategoryForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value;
        
        if (!name) {
            utils.showNotification('请输入分类名称', 'error');
            return;
        }

        const category = {
            name: name,
            icon: icon
        };

        await dataManager.saveCategory(category);
        modalManager.closeModal('addCategoryModal');
    });

    // 添加账号表单
    document.getElementById('addAccountForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const categoryId = document.getElementById('accountCategory').value;
        const name = document.getElementById('accountName').value.trim();
        const username = document.getElementById('accountUsername').value.trim();
        const password = document.getElementById('accountPassword').value;
        const url = document.getElementById('accountUrl').value.trim();
        const notes = document.getElementById('accountNotes').value.trim();

        if (!categoryId || !name || !username || !password) {
            utils.showNotification('请填写必填字段', 'error');
            return;
        }

        const account = {
            categoryId: categoryId,
            name: name,
            username: username,
            password: password,
            url: url || null,
            notes: notes || null
        };

        await dataManager.saveAccount(account);
        modalManager.closeModal('addAccountModal');
    });

    // 编辑账号表单
    document.getElementById('editAccountForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const accountId = document.getElementById('editAccountId').value;
        const categoryId = document.getElementById('editAccountCategory').value;
        const name = document.getElementById('editAccountName').value.trim();
        const username = document.getElementById('editAccountUsername').value.trim();
        const password = document.getElementById('editAccountPassword').value;
        const url = document.getElementById('editAccountUrl').value.trim();
        const notes = document.getElementById('editAccountNotes').value.trim();

        if (!categoryId || !name || !username || !password) {
            utils.showNotification('请填写必填字段', 'error');
            return;
        }

        const accountData = {
            categoryId: categoryId,
            name: name,
            username: username,
            password: password,
            url: url || null,
            notes: notes || null
        };

        await dataManager.updateAccount(accountId, accountData);
        modalManager.closeModal('editAccountModal');
    });

    // 初始化应用
    dataManager.init();
});

// 点击模态框外部关闭
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}); 