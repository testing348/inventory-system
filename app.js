// Authentication Data
const USERS = {
    'admin': { password: 'admin', role: 'admin', name: 'Admin User' },
    'megan': { password: 'megan', role: 'admin', name: 'Megan' },
    'employee': { password: '12345', role: 'employee', name: 'Employee' }
};

let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// DOM Elements for Login
const loginScreen = document.getElementById('login-screen');
const roleSelection = document.getElementById('role-selection');
const loginFormContainer = document.getElementById('login-form-container');
const btnRoleAdmin = document.getElementById('role-admin');
const btnRoleEmployee = document.getElementById('role-employee');
const btnBackToRoles = document.getElementById('btn-back-to-roles');
const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');

const loginForm = document.getElementById('login-form');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const mainApp = document.getElementById('main-app');

let selectedRole = null;

// Role Selection Logic
if (btnRoleAdmin) {
    btnRoleAdmin.addEventListener('click', () => {
        selectedRole = 'admin';
        showLoginForm('Admin Login', 'Enter your administrator credentials');
    });
}

if (btnRoleEmployee) {
    btnRoleEmployee.addEventListener('click', () => {
        selectedRole = 'employee';
        showLoginForm('Employee Login', 'Enter your staff credentials');
    });
}

if (btnBackToRoles) {
    btnBackToRoles.addEventListener('click', () => {
        if (roleSelection) roleSelection.style.display = 'block';
        if (loginFormContainer) loginFormContainer.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
        if (loginForm) loginForm.reset();
    });
}

const showLoginForm = (title, subtitle) => {
    if (loginTitle) loginTitle.textContent = title;
    if (loginSubtitle) loginSubtitle.textContent = subtitle;
    if (roleSelection) roleSelection.style.display = 'none';
    if (loginFormContainer) loginFormContainer.style.display = 'block';
};

// User Profile Elements
const userAvatar = document.querySelector('.avatar');
const userNameDisplay = document.querySelector('.user-name');
const userRoleDisplay = document.querySelector('.user-role');

const updateUIForRole = () => {
    if (!currentUser) return;

    document.body.classList.remove('is-admin', 'is-employee');
    document.body.classList.add(currentUser.role === 'admin' ? 'is-admin' : 'is-employee');

    // Update Sidebar Navigation Visibility
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        if (currentUser.role === 'employee') {
            // Employee only sees Sales, Purchases, Product DB, and Logout
            if (target !== 'sales' && target !== 'purchases' && target !== 'products' && item.id !== 'btn-logout') {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        } else {
            // Admin sees everything
            item.style.display = 'flex';
        }
    });

    // If employee is logged in and was on a restricted page, switch to Sales
    const activeNav = document.querySelector('.nav-item.active');
    if (currentUser.role === 'employee' && activeNav) {
        const target = activeNav.getAttribute('data-target');
        if (target !== 'sales' && target !== 'purchases' && target !== 'products') {
            document.querySelector('.nav-item[data-target="sales"]').click();
        }
    }

    // Hide Add Product button for employees
    const btnAddProduct = document.getElementById('btn-add-item-db');
    if (btnAddProduct) {
        btnAddProduct.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
    }

    // Update User Profile
    if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
    if (userRoleDisplay) userRoleDisplay.textContent = capitalize(currentUser.role);
    if (userAvatar) userAvatar.textContent = currentUser.name.split(' ').map(n => n[0]).join('');
};

const handleLogin = (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.toLowerCase();
    const password = loginPasswordInput.value;

    const user = USERS[username];

    // Validate user existence, password, AND selected role
    if (user && user.password === password && user.role === selectedRole) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        loginScreen.classList.add('hidden');
        if (mainApp) mainApp.style.display = 'flex'; // Show dashboard
        updateUIForRole();
        loginForm.reset();
        loginError.style.display = 'none';

        // Initial render
        populateUserFilters();
        filterAndRender();
        renderSalesRecords();
        renderPurchaseRecords();
        if (currentUser.role === 'admin' && typeof renderReports === 'function') renderReports();
    } else {
        loginError.textContent = user && user.role !== selectedRole
            ? `Username not authorized for ${capitalize(selectedRole)} access.`
            : 'Invalid username or password.';
        loginError.style.display = 'block';
    }
};

const checkAuth = () => {
    if (currentUser) {
        loginScreen.classList.add('hidden');
        if (mainApp) mainApp.style.display = 'flex'; // Show dashboard
        updateUIForRole();
        populateUserFilters();
        filterAndRender();
        renderSalesRecords();
        renderPurchaseRecords();
        if (currentUser.role === 'admin' && typeof renderReports === 'function') renderReports();
    } else {
        loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.style.display = 'none'; // Hide dashboard
        if (roleSelection) roleSelection.style.display = 'block';
        if (loginFormContainer) loginFormContainer.style.display = 'none';
    }
};

if (loginForm) loginForm.addEventListener('submit', handleLogin);

// Logout (can be called from console or tied to a future UI button)
window.logout = () => {
    sessionStorage.removeItem('currentUser');
    location.reload();
};

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        window.logout();
    });
}

// Admin Override Helper
const isAdminAuthenticated = () => {
    if (currentUser.role === 'admin') return true;
    const password = prompt('Action restricted to Admin. Please enter an admin password:');
    return password === USERS['admin'].password || password === USERS['megan'].password;
};

// Persistence Data
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let salesHistory = JSON.parse(localStorage.getItem('salesHistory')) || [];
let purchasesHistory = JSON.parse(localStorage.getItem('purchasesHistory')) || [];

const saveToStorage = () => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('salesHistory', JSON.stringify(salesHistory));
    localStorage.setItem('purchasesHistory', JSON.stringify(purchasesHistory));
};

let currentReceipt = [];


let currentOrder = [];
let totalExpenses = 0;

// DOM Elements
const inventoryList = document.getElementById('inventory-list');
const productDbList = document.getElementById('product-db-list');
const btnAddItem = document.getElementById('btn-add-item-db');
const addItemModal = document.getElementById('add-item-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const addItemForm = document.getElementById('add-item-form');
const globalSearch = document.getElementById('global-search');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');

const btnRecordSale = document.getElementById('btn-record-sale');
const recordSaleModal = document.getElementById('record-sale-modal');
const btnCloseSaleModal = document.getElementById('btn-close-sale-modal');
const btnCancelSaleModal = document.getElementById('btn-cancel-sale-modal');
const recordSaleForm = document.getElementById('record-sale-form');
const saleItemId = document.getElementById('sale-item-id');
const btnAddToReceipt = document.getElementById('btn-add-to-receipt');
const receiptList = document.getElementById('receipt-list');
const receiptTotal = document.getElementById('receipt-total');
const btnCompleteSale = document.getElementById('btn-complete-sale');
const salesList = document.getElementById('sales-list');

const btnReceiveStock = document.getElementById('btn-receive-stock');
const receiveStockModal = document.getElementById('receive-stock-modal');
const btnCloseReceiveModal = document.getElementById('btn-close-receive-modal');
const btnCancelReceiveModal = document.getElementById('btn-cancel-receive-modal');
const receiveStockForm = document.getElementById('receive-stock-form');
const receiveItemId = document.getElementById('receive-item-id');
const btnAddToReceive = document.getElementById('btn-add-to-receive');
const receiveList = document.getElementById('receive-list');
const receiveTotal = document.getElementById('receive-total');
const btnCompleteReceive = document.getElementById('btn-complete-receive');
const purchasesList = document.getElementById('purchases-list');
const salesUserFilter = document.getElementById('sales-user-filter');
const purchasesUserFilter = document.getElementById('purchases-user-filter');
const salesStartDateInput = document.getElementById('sales-start-date');
const salesEndDateInput = document.getElementById('sales-end-date');
const purchasesStartDateInput = document.getElementById('purchases-start-date');
const purchasesEndDateInput = document.getElementById('purchases-end-date');

const adjustStockModal = document.getElementById('adjust-stock-modal');
const btnCloseAdjustModal = document.getElementById('btn-close-adjust-modal');
const btnCancelAdjustModal = document.getElementById('btn-cancel-adjust-modal');
const adjustStockForm = document.getElementById('adjust-stock-form');
const adjustItemId = document.getElementById('adjust-item-id');
const adjustItemName = document.getElementById('adjust-item-name');

// Stats Elements
const statTotalValue = document.getElementById('stat-total-value');
const statTotalSales = document.getElementById('stat-total-sales');
const statItemsSold = document.getElementById('stat-items-sold');
const statLowStock = document.getElementById('stat-low-stock');
const statOutOfStock = document.getElementById('stat-out-of-stock');
const statTotalExpenses = document.getElementById('stat-total-expenses');
// Formatting utilities
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const populateUserFilters = () => {
    if (salesUserFilter) {
        const currentVal = salesUserFilter.value;
        const users = [...new Set(salesHistory.map(s => s.handledBy || 'Unknown'))].sort();
        salesUserFilter.innerHTML = '<option value="all">All Staff</option>';
        users.forEach(user => {
            salesUserFilter.innerHTML += `<option value="${user}">${user}</option>`;
        });
        if (users.includes(currentVal)) salesUserFilter.value = currentVal;
    }
    if (purchasesUserFilter) {
        const currentVal = purchasesUserFilter.value;
        const users = [...new Set(purchasesHistory.map(p => p.handledBy || 'Unknown'))].sort();
        purchasesUserFilter.innerHTML = '<option value="all">All Staff</option>';
        users.forEach(user => {
            purchasesUserFilter.innerHTML += `<option value="${user}">${user}</option>`;
        });
        if (users.includes(currentVal)) purchasesUserFilter.value = currentVal;
    }
};

// Calculate and update stats
function updateStats() {
    const activeInventory = inventory.filter(item => item.showInInventory !== false);
    const totalAssets = activeInventory.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const totalSalesValue = activeInventory.reduce((acc, item) => acc + ((item.sold || 0) * item.price), 0);
    const totalSoldQty = activeInventory.reduce((acc, item) => acc + (item.sold || 0), 0);
    const lowStockCount = activeInventory.filter(item => item.qty > 0 && item.qty <= 5).length;
    const outOfStockCount = activeInventory.filter(item => item.qty === 0).length;

    statTotalValue.textContent = formatCurrency(totalAssets);
    statTotalSales.textContent = formatCurrency(totalSalesValue);
    statItemsSold.textContent = `${totalSoldQty.toLocaleString()} items sold`;
    statLowStock.textContent = lowStockCount;
    if (statOutOfStock) statOutOfStock.textContent = outOfStockCount;

    // We update totalExpenses on complete order, and keep a running tally
    let expenseSum = purchasesHistory.reduce((acc, purchase) => acc + purchase.total, 0);
    statTotalExpenses.textContent = formatCurrency(expenseSum);
}

// Generate Status Badge
function getStatusBadge(qty) {
    if (qty === 0) return '<span class="status-badge status-outofstock">Out of Stock</span>';
    if (qty <= 5) return '<span class="status-badge status-lowstock">Low Stock</span>';
    return '<span class="status-badge status-instock">In Stock</span>';
}

// Render Table (Inventory/Stock)
function renderTable(data = inventory) {
    inventoryList.innerHTML = '';

    updateStats();
    if (typeof renderProductDB === 'function') renderProductDB(data);

    const activeData = data.filter(item => item.showInInventory !== false);

    // Toggle Actions Header
    const actionHeader = document.querySelector('#inventory-list').closest('table').querySelector('th:nth-child(8)');
    if (actionHeader) actionHeader.style.display = currentUser.role === 'admin' ? '' : 'none';

    if (activeData.length === 0) {
        inventoryList.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 32px;">No active inventory items found.</td></tr>`;
        return;
    }

    activeData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${item.name}</div>
            </td>
            <td style="color: var(--text-secondary); font-family: monospace;">${item.sku}</td>
            <td>
                <span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; font-size: 12px; color: var(--text-secondary);">
                    ${capitalize(item.category)}
                </span>
            </td>
            <td><strong>${item.qty}</strong></td>
            <td>${item.sold || 0}</td>
            <td style="font-weight: 500;">${formatCurrency(item.price)}</td>
            <td>${getStatusBadge(item.qty)}</td>
            ${currentUser.role === 'admin' ? `
            <td>
                <div class="action-btns">
                    <button class="action-btn" title="Edit Stock" onclick="editItem(${item.id}, 'inventory')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn" title="Remove from Inventory" onclick="removeFromInventory(${item.id})" style="color: var(--status-warn-text);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </td>` : ''}
        `;
        inventoryList.appendChild(tr);
    });
}

function renderProductDB(data = inventory) {
    if (!productDbList) return;
    productDbList.innerHTML = '';
    const searchTerm = globalSearch.value.toLowerCase();

    let filteredData = data;
    if (searchTerm) {
        filteredData = data.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm)
        );
    }

    // Toggle Actions Header
    const actionHeader = document.querySelector('#product-db-list').closest('table').querySelector('th:nth-child(6)');
    if (actionHeader) actionHeader.style.display = currentUser.role === 'admin' ? '' : 'none';

    if (filteredData.length === 0) {
        productDbList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 32px;">No products in database. ${searchTerm ? '(Matches search)' : ''}</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="font-weight: 500;">${item.name}</div></td>
            <td style="color: var(--text-secondary); font-family: monospace;">${item.sku}</td>
            <td>
                <span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; font-size: 12px; color: var(--text-secondary);">
                    ${capitalize(item.category)}
                </span>
            </td>
            <td style="font-weight: 500;">${formatCurrency(item.cost || 0)}</td>
            <td style="font-weight: 500;">${formatCurrency(item.price)}</td>
            ${currentUser.role === 'admin' ? `
            <td>
                <div class="action-btns">
                    ${item.showInInventory === false ? `
                    <button class="action-btn" title="Restore to Inventory" onclick="addToInventory(${item.id})" style="color: var(--status-good-text);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    ` : ''}
                    <button class="action-btn" title="Edit Product" onclick="editItem(${item.id}, 'database')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn" title="Delete Permanently" onclick="deleteProduct(${item.id})" style="color: var(--status-danger-text);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>` : ''}
        `;
        productDbList.appendChild(tr);
    });
}

// Modal logic
const editItemId = document.getElementById('edit-item-id');
const modalTitle = document.getElementById('modal-title');

// Category Management
const syncCategories = () => {
    // Collect all valid categories
    const activeCategories = new Set();
    inventory.forEach(item => activeCategories.add(item.category));

    // Update itemCategory dropdown
    const currentSelection = itemCategory.value;
    itemCategory.innerHTML = '<option value="" disabled selected hidden>Choose Category...</option>';

    // Add custom active categories
    activeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = capitalize(cat);
        itemCategory.appendChild(option);
    });

    // Add the add new option at the very bottom
    const addNewOpt = document.createElement('option');
    addNewOpt.value = '__ADD_NEW__';
    addNewOpt.textContent = '+ Add New Category...';
    itemCategory.appendChild(addNewOpt);

    // Restore selection if possible
    if (currentSelection && currentSelection !== "" && Array.from(itemCategory.options).some(opt => opt.value === currentSelection)) {
        itemCategory.value = currentSelection;
    } else {
        itemCategory.selectedIndex = 0;
    }

    // Update category filter dropdown
    const currentFilter = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    activeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = capitalize(cat);
        categoryFilter.appendChild(option);
    });

    if (Array.from(categoryFilter.options).some(opt => opt.value === currentFilter)) {
        categoryFilter.value = currentFilter;
    } else {
        categoryFilter.value = 'all';
    }
};

const openModal = () => {
    editItemId.value = '';
    modalTitle.textContent = 'Add New Item';
    addItemForm.reset();
    syncCategories();

    newCategoryInput.style.display = 'none';
    newCategoryInput.required = false;

    document.getElementById('group-name').style.display = 'block';
    document.getElementById('group-meta').style.display = 'flex';
    document.getElementById('group-pricing').style.display = 'flex';
    document.getElementById('item-qty-container').style.display = 'none';
    document.getElementById('item-qty').required = false;

    addItemModal.classList.add('active');
};
const newCategoryInput = document.getElementById('new-category-input');
const itemCategory = document.getElementById('item-category');

const closeModal = () => {
    addItemModal.classList.remove('active');
    addItemForm.reset();
    newCategoryInput.style.display = 'none';
    newCategoryInput.required = false;
};

itemCategory.addEventListener('change', (e) => {
    if (e.target.value === '__ADD_NEW__') {
        newCategoryInput.style.display = 'block';
        newCategoryInput.required = true;
    } else {
        newCategoryInput.style.display = 'none';
        newCategoryInput.required = false;
    }
});

btnAddItem.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

// Add/Edit Item Submission
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const idVal = editItemId.value;
    const isEdit = !!idVal;
    const itemIndex = isEdit ? inventory.findIndex(item => item.id === parseInt(idVal)) : -1;

    const name = document.getElementById('item-name').value;
    const sku = document.getElementById('item-sku').value;
    let category = document.getElementById('item-category').value;

    if (category === '__ADD_NEW__') {
        category = newCategoryInput.value.trim().toLowerCase();
    }

    const cost = parseFloat(document.getElementById('item-cost').value);
    const price = parseFloat(document.getElementById('item-price').value);

    if (isEdit) {
        if (itemIndex > -1) {
            if (document.getElementById('group-name').style.display !== 'none') {
                inventory[itemIndex].name = name;
                inventory[itemIndex].sku = sku;
                inventory[itemIndex].category = category;
                inventory[itemIndex].cost = cost;
                inventory[itemIndex].price = price;
            }

            const qtyContainer = document.getElementById('item-qty-container');
            if (qtyContainer.style.display !== 'none') {
                const qtyInput = document.getElementById('item-qty');
                if (qtyInput.value !== '') {
                    inventory[itemIndex].qty = parseInt(qtyInput.value);
                }
            }
        }
    } else {
        const newItem = {
            id: Date.now(),
            name, sku, category, qty: 0, sold: 0, cost, price,
            showInInventory: true
        };
        inventory.unshift(newItem);
    }

    syncCategories();
    saveToStorage();
    filterAndRender();
    closeModal();
});

// Record Sale Logic
const renderReceipt = () => {
    receiptList.innerHTML = '';
    let total = 0;

    if (currentReceipt.length === 0) {
        receiptList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 10px;">Receipt is empty</div>';
        receiptTotal.textContent = '$0.00';
        btnCompleteSale.disabled = true;
        return;
    }

    currentReceipt.forEach((item, index) => {
        total += item.price * item.qtySold;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.padding = '8px 0';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        div.innerHTML = `
            <span><strong>${item.qtySold}x</strong> ${item.name}</span>
            <div style="display: flex; gap: 12px; align-items: center;">
                <span>${formatCurrency(item.price * item.qtySold)}</span>
                <button type="button" style="background: none; border: none; color: var(--status-danger-text); cursor: pointer;" onclick="removeFromReceipt(${index})">&times;</button>
            </div>
        `;
        receiptList.appendChild(div);
    });

    receiptTotal.textContent = formatCurrency(total);
    btnCompleteSale.disabled = false;
};

window.removeFromReceipt = (index) => {
    currentReceipt.splice(index, 1);
    renderReceipt();
};

const openSaleModal = () => {
    saleItemId.innerHTML = '<option value="" disabled selected>Select an item...</option>';
    inventory.forEach(item => {
        if (item.qty > 0) {
            saleItemId.innerHTML += `<option value="${item.id}">${item.name} (${item.qty} in stock) - ${formatCurrency(item.price)}</option>`;
        }
    });
    currentReceipt = [];
    renderReceipt();
    document.getElementById('sale-qty').value = '';
    recordSaleModal.classList.add('active');
};

const closeSaleModal = () => {
    recordSaleModal.classList.remove('active');
    recordSaleForm.reset();
    currentReceipt = [];
};

btnRecordSale.addEventListener('click', openSaleModal);
btnCloseSaleModal.addEventListener('click', closeSaleModal);
btnCancelSaleModal.addEventListener('click', closeSaleModal);

btnAddToReceipt.addEventListener('click', () => {
    const id = parseInt(saleItemId.value);
    const qtySoldInput = document.getElementById('sale-qty').value;
    const qtySold = parseInt(qtySoldInput);

    if (!id || isNaN(qtySold) || qtySold < 1) return;

    const itemInfo = inventory.find(i => i.id === id);
    if (!itemInfo) return;

    const existing = currentReceipt.find(i => i.id === id);
    const currentRequested = existing ? existing.qtySold + qtySold : qtySold;

    if (currentRequested > itemInfo.qty) {
        alert(`Cannot add ${currentRequested}. Only ${itemInfo.qty} available in stock.`);
        return;
    }

    if (existing) {
        existing.qtySold += qtySold;
    } else {
        currentReceipt.push({ ...itemInfo, qtySold });
    }

    document.getElementById('sale-qty').value = '';
    renderReceipt();
});

recordSaleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentReceipt.length === 0) return;

    let saleTotal = 0;
    currentReceipt.forEach(receiptItem => {
        const itemIndex = inventory.findIndex(i => i.id === receiptItem.id);
        if (itemIndex > -1) {
            inventory[itemIndex].qty -= receiptItem.qtySold;
            inventory[itemIndex].sold = (inventory[itemIndex].sold || 0) + receiptItem.qtySold;
            saleTotal += receiptItem.qtySold * receiptItem.price;
        }
    });

    salesHistory.unshift({
        id: 'RCP-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        items: [...currentReceipt],
        total: saleTotal,
        handledBy: currentUser ? currentUser.name : 'Unknown'
    });

    saveToStorage();
    populateUserFilters();
    filterAndRender();
    renderSalesRecords();
    closeSaleModal();
});

function renderSalesRecords() {
    salesList.innerHTML = '';
    const searchTerm = globalSearch.value.toLowerCase();
    const startDate = document.getElementById('sales-start-date').value;
    const endDate = document.getElementById('sales-end-date').value;

    let filteredSales = salesHistory;

    // Filter by User
    const userFilter = salesUserFilter ? salesUserFilter.value : 'all';
    if (userFilter !== 'all') {
        filteredSales = filteredSales.filter(sale => (sale.handledBy || 'Unknown') === userFilter);
    }

    // Filter by Date
    if (startDate || endDate) {
        filteredSales = filteredSales.filter(sale => {
            const saleTime = sale.timestamp || new Date(sale.date).getTime();
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            if (start && saleTime < start) return false;
            if (end && saleTime > end) return false;
            return true;
        });
    }

    if (searchTerm) {
        filteredSales = filteredSales.filter(sale => {
            return sale.items.some(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm))
            ) || sale.id.toLowerCase().includes(searchTerm);
        });
    }

    if (filteredSales.length === 0) {
        salesList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">No sales records found. ${searchTerm ? '(Matches search)' : ''}</td></tr>`;
        return;
    }

    filteredSales.forEach(sale => {
        const tr = document.createElement('tr');
        const itemNames = sale.items.map(i => `${i.qtySold}x ${i.name}`).join(', ');
        tr.innerHTML = `
            <td>${sale.date}</td>
            <td style="font-family: monospace;">${sale.id}</td>
            <td style="color: var(--text-secondary);">${itemNames}</td>
            <td style="font-weight: 600; color: var(--status-good-text);">${formatCurrency(sale.total)}</td>
            <td style="font-size: 13px;">${sale.handledBy || 'Unknown'}</td>
            <td>
                <button class="action-btn" title="Delete" onclick="deleteSaleRecord('${sale.id}')" style="color: var(--status-danger-text);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
         `;
        salesList.appendChild(tr);
    });
}

window.deleteSaleRecord = (id) => {
    if (!isAdminAuthenticated()) return;
    if (confirm('Are you sure you want to delete this sales record? This will also return the items to inventory.')) {
        const saleToDelete = salesHistory.find(sale => sale.id === id);
        if (saleToDelete) {
            saleToDelete.items.forEach(saleItem => {
                const itemIndex = inventory.findIndex(i => i.id === saleItem.id);
                if (itemIndex > -1) {
                    inventory[itemIndex].qty += saleItem.qtySold;
                    inventory[itemIndex].sold = Math.max(0, (inventory[itemIndex].sold || 0) - saleItem.qtySold);
                }
            });
        }
        salesHistory = salesHistory.filter(sale => sale.id !== id);
        saveToStorage();
        filterAndRender();
        renderSalesRecords();
        renderReports();
    }
};

// Receive Stock Logic
const renderReceive = () => {
    receiveList.innerHTML = '';
    let total = 0;

    if (currentOrder.length === 0) {
        receiveList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 10px;">Order is empty</div>';
        receiveTotal.textContent = '$0.00';
        btnCompleteReceive.disabled = true;
        return;
    }

    currentOrder.forEach((item, index) => {
        total += item.cost;
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.padding = '8px 0';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        div.innerHTML = `
            <span><strong>${item.qtyReceived}x</strong> ${item.name}</span>
            <div style="display: flex; gap: 12px; align-items: center;">
                <span>${formatCurrency(item.cost)}</span>
                <button type="button" style="background: none; border: none; color: var(--status-danger-text); cursor: pointer;" onclick="removeFromReceive(${index})">&times;</button>
            </div>
        `;
        receiveList.appendChild(div);
    });

    receiveTotal.textContent = formatCurrency(total);
    btnCompleteReceive.disabled = false;
};

window.removeFromReceive = (index) => {
    currentOrder.splice(index, 1);
    renderReceive();
};

const openReceiveModal = () => {
    receiveItemId.innerHTML = '<option value="" disabled selected>Select an item...</option>';
    inventory.forEach(item => {
        receiveItemId.innerHTML += `<option value="${item.id}">${item.name}</option>`;
    });
    currentOrder = [];
    renderReceive();
    document.getElementById('receive-qty').value = '';
    document.getElementById('receive-cost').value = '';
    receiveStockModal.classList.add('active');
};

const closeReceiveModal = () => {
    receiveStockModal.classList.remove('active');
    receiveStockForm.reset();
    currentOrder = [];
};

btnReceiveStock.addEventListener('click', openReceiveModal);
btnCloseReceiveModal.addEventListener('click', closeReceiveModal);
btnCancelReceiveModal.addEventListener('click', closeReceiveModal);

// Auto-compute value base on cost
const computeReceiveValue = () => {
    const id = parseInt(receiveItemId.value);
    const qty = parseInt(document.getElementById('receive-qty').value) || 0;
    const item = inventory.find(i => i.id === id);
    if (item) {
        const totalCost = (item.cost || 0) * qty;
        document.getElementById('receive-cost').value = totalCost.toFixed(2);
    }
};

receiveItemId.addEventListener('change', computeReceiveValue);
document.getElementById('receive-qty').addEventListener('input', computeReceiveValue);

btnAddToReceive.addEventListener('click', () => {
    const id = parseInt(receiveItemId.value);
    const qtyInput = document.getElementById('receive-qty').value;
    const costInput = document.getElementById('receive-cost').value;
    const qtyReceived = parseInt(qtyInput);
    const cost = parseFloat(costInput);

    if (!id || isNaN(qtyReceived) || qtyReceived < 1 || isNaN(cost) || cost < 0) return;

    const itemInfo = inventory.find(i => i.id === id);
    if (!itemInfo) return;

    currentOrder.push({ ...itemInfo, qtyReceived, cost });

    document.getElementById('receive-qty').value = '';
    document.getElementById('receive-cost').value = '';
    renderReceive();
});

receiveStockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentOrder.length === 0) return;

    let orderTotal = 0;
    currentOrder.forEach(orderItem => {
        const itemIndex = inventory.findIndex(i => i.id === orderItem.id);
        if (itemIndex > -1) {
            inventory[itemIndex].qty += orderItem.qtyReceived;
            orderTotal += orderItem.cost;
        }
    });

    purchasesHistory.unshift({
        id: 'PUR-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
        items: [...currentOrder],
        total: orderTotal,
        handledBy: currentUser ? currentUser.name : 'Unknown'
    });

    saveToStorage();
    populateUserFilters();
    filterAndRender();
    renderPurchaseRecords();
    closeReceiveModal();
});

function renderPurchaseRecords() {
    purchasesList.innerHTML = '';
    const searchTerm = globalSearch.value.toLowerCase();
    const startDate = document.getElementById('purchases-start-date').value;
    const endDate = document.getElementById('purchases-end-date').value;

    let filteredPurchases = purchasesHistory;

    // Filter by User
    const userFilter = purchasesUserFilter ? purchasesUserFilter.value : 'all';
    if (userFilter !== 'all') {
        filteredPurchases = filteredPurchases.filter(p => (p.handledBy || 'Unknown') === userFilter);
    }

    // Filter by Date
    if (startDate || endDate) {
        filteredPurchases = filteredPurchases.filter(purchase => {
            const purchaseTime = purchase.timestamp || new Date(purchase.date).getTime();
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            if (start && purchaseTime < start) return false;
            if (end && purchaseTime > end) return false;
            return true;
        });
    }

    if (searchTerm) {
        filteredPurchases = filteredPurchases.filter(purchase => {
            return purchase.items.some(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm))
            ) || purchase.id.toLowerCase().includes(searchTerm);
        });
    }

    if (filteredPurchases.length === 0) {
        purchasesList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">No purchase records found. ${searchTerm ? '(Matches search)' : ''}</td></tr>`;
        return;
    }

    filteredPurchases.forEach(purchase => {
        const tr = document.createElement('tr');
        const itemNames = purchase.items.map(i => `${i.qtyReceived}x ${i.name}`).join(', ');
        tr.innerHTML = `
            <td>${purchase.date}</td>
            <td style="font-family: monospace;">${purchase.id}</td>
            <td style="color: var(--text-secondary);">${itemNames}</td>
            <td style="font-weight: 600; color: #ef4444;">-${formatCurrency(purchase.total)}</td>
            <td style="font-size: 13px;">${purchase.handledBy || 'Unknown'}</td>
            <td>
                <button class="action-btn" title="Delete" onclick="deletePurchaseRecord('${purchase.id}')" style="color: var(--status-danger-text);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
         `;
        purchasesList.appendChild(tr);
    });
}

window.deletePurchaseRecord = (id) => {
    if (!isAdminAuthenticated()) return;
    if (confirm('Are you sure you want to delete this purchase record? This will also remove the received items from inventory.')) {
        const purchaseToDelete = purchasesHistory.find(p => p.id === id);
        if (purchaseToDelete) {
            purchaseToDelete.items.forEach(purchaseItem => {
                const itemIndex = inventory.findIndex(i => i.id === purchaseItem.id);
                if (itemIndex > -1) {
                    inventory[itemIndex].qty = Math.max(0, inventory[itemIndex].qty - purchaseItem.qtyReceived);
                }
            });
        }
        purchasesHistory = purchasesHistory.filter(p => p.id !== id);
        saveToStorage();
        filterAndRender();
        renderPurchaseRecords();
        updateStats();
    }
};

// Adjust Stock Logic
window.openAdjustModal = (id, name) => {
    adjustItemId.value = id;
    adjustItemName.textContent = name;
    adjustStockModal.classList.add('active');
};
const closeAdjustModal = () => {
    adjustStockModal.classList.remove('active');
    adjustStockForm.reset();
};

btnCloseAdjustModal.addEventListener('click', closeAdjustModal);
btnCancelAdjustModal.addEventListener('click', closeAdjustModal);

adjustStockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(adjustItemId.value);
    const adjustQty = parseInt(document.getElementById('adjust-qty').value);

    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        if (inventory[itemIndex].qty + adjustQty < 0) {
            alert('Stock cannot be below 0');
            return;
        }
        inventory[itemIndex].qty += adjustQty;
        saveToStorage();
        filterAndRender();
        closeAdjustModal();
    }
});

// Search and Filter Logic
function filterAndRender() {
    const searchTerm = globalSearch.value.toLowerCase();
    const category = categoryFilter.value;
    const sortVal = sortFilter.value;

    let filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || item.sku.toLowerCase().includes(searchTerm);
        const matchesCategory = category === 'all' || item.category === category;
        return matchesSearch && matchesCategory;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
        if (sortVal === 'stock-low') {
            return a.qty - b.qty;
        } else if (sortVal === 'stock-high') {
            return b.qty - a.qty;
        } else if (sortVal === 'sold-low') {
            return (a.sold || 0) - (b.sold || 0);
        } else if (sortVal === 'sold-high') {
            return (b.sold || 0) - (a.sold || 0);
        } else if (sortVal === 'alpha-asc') {
            return a.name.localeCompare(b.name);
        } else if (sortVal === 'alpha-desc') {
            return b.name.localeCompare(a.name);
        }
        return 0; // default (no primary sort or insertion sort if untouched)
    });

    renderTable(filtered);
}

globalSearch.addEventListener('input', () => {
    filterAndRender();
    renderSalesRecords();
    renderPurchaseRecords();
});

document.getElementById('sales-start-date').addEventListener('change', renderSalesRecords);
document.getElementById('sales-end-date').addEventListener('change', renderSalesRecords);
document.getElementById('purchases-start-date').addEventListener('change', renderPurchaseRecords);
document.getElementById('purchases-end-date').addEventListener('change', renderPurchaseRecords);

categoryFilter.addEventListener('change', filterAndRender);
if (sortFilter) sortFilter.addEventListener('change', filterAndRender);
if (salesUserFilter) salesUserFilter.addEventListener('change', renderSalesRecords);
if (purchasesUserFilter) purchasesUserFilter.addEventListener('change', renderPurchaseRecords);

// Reports Logic
let topItemsChartInstance = null;
const reportPeriod = document.getElementById('report-period');
const reportList = document.getElementById('report-list');
const reportUnits = document.getElementById('report-units');
const reportRevenue = document.getElementById('report-revenue');
const reportCogs = document.getElementById('report-cogs');
const reportProfit = document.getElementById('report-profit');
const reportChartMetric = document.getElementById('report-chart-metric');

const renderReports = () => {
    if (!reportList) return;
    const period = reportPeriod.value;

    const now = new Date();
    let startDateCutoff = null;
    let endDateCutoff = null;

    if (period === 'today') {
        startDateCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (period === '7days') {
        startDateCutoff = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    } else if (period === '30days') {
        startDateCutoff = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    } else if (period === 'thisMonth') {
        startDateCutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (period === 'thisYear') {
        startDateCutoff = new Date(now.getFullYear(), 0, 1).getTime();
    } else if (period === 'custom') {
        const startVal = document.getElementById('report-start-date').value;
        const endVal = document.getElementById('report-end-date').value;
        if (startVal) startDateCutoff = new Date(startVal).setHours(0, 0, 0, 0);
        if (endVal) endDateCutoff = new Date(endVal).setHours(23, 59, 59, 999);
    }

    const relevantSales = salesHistory.filter(sale => {
        const saleTime = sale.timestamp || new Date(sale.date).getTime();

        if (period === 'all') return true;
        if (startDateCutoff && saleTime < startDateCutoff) return false;
        if (endDateCutoff && saleTime > endDateCutoff) return false;
        if (!startDateCutoff && !endDateCutoff && period !== 'all') return false; // Fail safe for custom
        return true;
    });

    // Aggregation
    const itemMap = new Map();
    let totalUnits = 0;
    let totalRev = 0;
    let totalCogs = 0;

    relevantSales.forEach(sale => {
        sale.items.forEach(item => {
            const cost = item.cost || 0;
            const rev = item.price * item.qtySold;
            const cogs = cost * item.qtySold;
            const profit = rev - cogs;

            totalUnits += item.qtySold;
            totalRev += rev;
            totalCogs += cogs;

            if (!itemMap.has(item.id)) {
                itemMap.set(item.id, { name: item.name, units: item.qtySold, rev: rev, cogs: cogs, profit: profit });
            } else {
                const mapItem = itemMap.get(item.id);
                mapItem.units += item.qtySold;
                mapItem.rev += rev;
                mapItem.cogs += cogs;
                mapItem.profit += profit;
            }
        });
    });

    reportUnits.textContent = totalUnits.toLocaleString();
    reportRevenue.textContent = formatCurrency(totalRev);
    reportCogs.textContent = formatCurrency(totalCogs);
    reportProfit.textContent = formatCurrency(totalRev - totalCogs);

    reportList.innerHTML = '';

    if (itemMap.size === 0) {
        reportList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">No sales in this period.</td></tr>`;

        const ctx = document.getElementById('topItemsChart');
        if (ctx) {
            if (topItemsChartInstance) topItemsChartInstance.destroy();
        }
        return;
    }

    // Render Chart
    const ctx = document.getElementById('topItemsChart');
    if (ctx) {
        if (topItemsChartInstance) topItemsChartInstance.destroy();

        const metric = reportChartMetric ? reportChartMetric.value : 'units';

        let sortedItems;
        if (metric === 'profit') {
            // Only include items with positive profit for the pie chart
            sortedItems = Array.from(itemMap.values())
                .filter(item => item.profit > 0)
                .sort((a, b) => b.profit - a.profit)
                .slice(0, 5);
        } else {
            sortedItems = Array.from(itemMap.values())
                .sort((a, b) => b.units - a.units)
                .slice(0, 5);
        }

        const labels = sortedItems.map(item => item.name);
        const data = sortedItems.map(item => metric === 'profit' ? item.profit : item.units);
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
        ];

        // Chart text should be bright due to dark mode
        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';

        topItemsChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255,255,255,0.7)',
                            font: {
                                family: "'Outfit', sans-serif"
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    if (metric === 'profit') {
                                        label += formatCurrency(context.parsed);
                                    } else {
                                        label += context.parsed + ' units';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    Array.from(itemMap.values()).sort((a, b) => b.rev - a.rev).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div style="font-weight: 500;">${row.name}</div></td>
            <td>${row.units}</td>
            <td>${formatCurrency(row.rev)}</td>
            <td>${formatCurrency(row.cogs)}</td>
            <td style="font-weight: 600; color: ${row.profit >= 0 ? 'var(--status-good-text)' : 'var(--status-danger-text)'};">${formatCurrency(row.profit)}</td>
        `;
        reportList.appendChild(tr);
    });
};

window.removeFromInventory = (id) => {
    if (!isAdminAuthenticated()) return;
    if (confirm('Are you sure you want to remove this item from active inventory? It will remain in the Product Database.')) {
        const item = inventory.find(i => i.id === id);
        if (item) {
            item.showInInventory = false;
            saveToStorage();
            filterAndRender();
        }
    }
};

window.addToInventory = (id) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
        item.showInInventory = true;
        saveToStorage();
        filterAndRender();
    }
};

window.deleteProduct = (id) => {
    if (!isAdminAuthenticated()) return;
    if (confirm('Are you sure you want to PERMANENTLY delete this product? It will be removed from BOTH the database and inventory.')) {
        inventory = inventory.filter(item => item.id !== id);
        syncCategories();
        saveToStorage();
        filterAndRender();
    }
};

window.editItem = (id, mode) => {
    if (!isAdminAuthenticated()) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    editItemId.value = item.id;
    modalTitle.textContent = mode === 'inventory' ? 'Edit Stock Level' : 'Edit Product Details';

    document.getElementById('item-name').value = item.name;
    document.getElementById('item-sku').value = item.sku;

    syncCategories();

    document.getElementById('item-category').value = item.category;
    document.getElementById('item-cost').value = item.cost || 0;
    document.getElementById('item-price').value = item.price;

    const qtyInput = document.getElementById('item-qty');
    qtyInput.value = item.qty;

    // Visibility logic based on mode
    if (mode === 'inventory') {
        document.getElementById('group-name').style.display = 'none';
        document.getElementById('group-meta').style.display = 'none';
        document.getElementById('group-pricing').style.display = 'none';
        document.getElementById('item-qty-container').style.display = 'block';
        qtyInput.required = true;
    } else {
        document.getElementById('group-name').style.display = 'block';
        document.getElementById('group-meta').style.display = 'flex';
        document.getElementById('group-pricing').style.display = 'flex';
        document.getElementById('item-qty-container').style.display = 'none';
        qtyInput.required = false;
    }

    newCategoryInput.style.display = 'none';
    newCategoryInput.required = false;

    addItemModal.classList.add('active');
};

if (reportPeriod) {
    reportPeriod.addEventListener('change', (e) => {
        const customDates = document.getElementById('report-custom-dates');
        if (e.target.value === 'custom') {
            customDates.style.display = 'flex';
        } else {
            customDates.style.display = 'none';
        }
        renderReports();
    });
}

const reportStartDate = document.getElementById('report-start-date');
const reportEndDate = document.getElementById('report-end-date');
if (reportStartDate) reportStartDate.addEventListener('change', renderReports);
if (reportEndDate) reportEndDate.addEventListener('change', renderReports);
if (reportChartMetric) reportChartMetric.addEventListener('change', renderReports);

// Initial Render
syncCategories();
renderTable();
renderSalesRecords();
renderPurchaseRecords();

// Navigation logic
const navItems = document.querySelectorAll('.nav-item');
const viewStats = document.getElementById('view-stats');
const viewTable = document.getElementById('view-table');
const viewSales = document.getElementById('view-sales');
const viewPurchases = document.getElementById('view-purchases');
const viewReports = document.getElementById('view-reports');
const viewProducts = document.getElementById('view-products');


navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-target');

        viewStats.style.display = 'none';
        viewTable.style.display = 'none';
        if (viewSales) viewSales.style.display = 'none';
        if (viewPurchases) viewPurchases.style.display = 'none';
        if (viewReports) viewReports.style.display = 'none';
        if (viewProducts) viewProducts.style.display = 'none';


        const searchBar = document.querySelector('.search-bar');
        if (target === 'dashboard' || target === 'reports') {
            searchBar.style.visibility = 'hidden';
            searchBar.style.opacity = '0';
        } else {
            searchBar.style.visibility = 'visible';
            searchBar.style.opacity = '1';
        }

        if (target === 'dashboard') {
            viewStats.style.display = 'grid';
            viewTable.style.display = 'flex';
        } else if (target === 'inventory') {
            viewTable.style.display = 'flex';
            filterAndRender();
        } else if (target === 'products' && viewProducts) {
            viewProducts.style.display = 'flex';
            renderProductDB();
        } else if (target === 'sales' && viewSales) {
            viewSales.style.display = 'flex';
            renderSalesRecords();
        } else if (target === 'purchases' && viewPurchases) {
            viewPurchases.style.display = 'flex';
            renderPurchaseRecords();
        } else if (target === 'reports' && viewReports) {
            viewReports.style.display = 'flex';
            renderReports();
        }
    });
});
