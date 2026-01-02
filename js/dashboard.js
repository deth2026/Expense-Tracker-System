// js/dashboard.js
class FinanceDashboard {
    constructor() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) { window.location.href = 'log.html'; return; }

        this.userId = currentUser.id;
        this.transactionsKey = `finance_transactions_${this.userId}`;
        this.budgetKey = `finance_budget_${this.userId}`;
        this.settingsKey = `finance_settings_${this.userId}`;

        this.transactions = JSON.parse(localStorage.getItem(this.transactionsKey)) || this.getDefaultTransactions();
        this.monthlyBudget = parseFloat(localStorage.getItem(this.budgetKey)) || 2000;
        this.settings = JSON.parse(localStorage.getItem(this.settingsKey)) || { currency: '$',darkMode: false };

        if (!this.settings.profile) {
            this.settings.profile = {
                name: `${currentUser.firstName} ${currentUser.lastName}`,
                firstName: currentUser.firstName, lastName: currentUser.lastName,
                email: currentUser.email, avatar: `${currentUser.firstName?.[0]}${currentUser.lastName?.[0]}`.toUpperCase(),
                phone: '', location: '', bio: '', currencyPreference: '$',
                notificationEnabled: true, autoBackup: false, monthlyBudgetAlert: true,
                themeColor: 'blue', userId: currentUser.id, joinDate: currentUser.joinDate,
                avatarImage: null, investmentValue: 0
            };
        }

        this.charts = {};
        this.transactionMgr = new TransactionManager(this);
        this.settingsMgr = new SettingsManager(this);

        this.init();
    }

    getDefaultTransactions() {
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 20; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i * 2);
            dates.push(d.toISOString().split('T')[0]);
        }
        return [{ id: '1', type: 'income', description: 'Salary', amount: 5000, category: 'other', date: dates[0] }];
    }

    init() {
        this.setupEventListeners();
        UIManager.applyDarkMode(this.settings.darkMode);
        UIManager.updateProfileDisplay(this.settings);
        
        // Initialize savings goals if not exists
        if (!this.settings.savingsGoals) {
            this.settings.savingsGoals = [
                { id: '1', name: 'Emergency Fund', target: 10000, current: 2500, color: '#28a745' },
                { id: '2', name: 'Vacation', target: 3000, current: 800, color: '#007bff' },
                { id: '3', name: 'New Car', target: 15000, current: 5000, color: '#ffc107' }
            ];
            this.saveSettings();
        }
        
        this.loadPage('dashboard');
    }

    setupEventListeners() {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                this.loadPage(link.dataset.page);
            });
        });

        document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('show'));
        document.getElementById('saveTransaction')?.addEventListener('click', () => this.transactionMgr.save());
        document.getElementById('saveBudget')?.addEventListener('click', () => this.saveBudget());
    }

    loadPage(page) {
        this.currentPage = page;
        document.getElementById('pageTitle').textContent = FinanceUtils.getPageTitle(page);

        Object.values(this.charts).forEach(c => c?.destroy());
        this.charts = {};

        const pages = {
            dashboard: () => this.renderDashboard(),
            transactions: () => this.renderTransactions(),
            analytics: () => this.renderAnalytics(),
            savings: () => this.renderSavings(),
            reports: () => this.renderReports(),
            settings: () => this.settingsMgr.render()
        };
        pages[page]();
    }

    calculateTotals() {
        const now = new Date();
        const monthTx = this.transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear());
        const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const yearIncome = this.transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear() && t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const actualSavings = this.settings.savingsGoals ? this.settings.savingsGoals.reduce((sum, goal) => sum + goal.current, 0) : 0;
        return { income, expense, balance: income - expense, savings: actualSavings };
    }

    renderDashboard() {
        const t = this.calculateTotals();
        document.getElementById('pageContent').innerHTML = `
            <div class="row mb-4">
                <div class="col-md-3 mb-3"><div class="stats-card card-income"><h5>Total Income</h5><div class="amount">${this.settings.currency}${t.income.toFixed(2)}</div><small>This Month</small></div></div>
                <div class="col-md-3 mb-3"><div class="stats-card card-expense"><h5>Total Expenses</h5><div class="amount">${this.settings.currency}${t.expense.toFixed(2)}</div><small>This Month</small></div></div>
                <div class="col-md-3 mb-3"><div class="stats-card card-balance"><h5>Balance</h5><div class="amount">${this.settings.currency}${t.balance.toFixed(2)}</div><small>Available</small></div></div>
                <div class="col-md-3 mb-3"><div class="stats-card card-savings"><h5>Savings</h5><div class="amount">${this.settings.currency}${t.savings.toFixed(2)}</div><small>Actual</small></div></div>
            </div>
            <div class="row">
                <div class="col-lg-8"><div class="chart-card"><div class="chart-header"><h5>Income vs Expenses</h5></div><canvas id="ieChart"></canvas></div></div>
                <div class="col-lg-4"><div class="chart-card"><div class="chart-header"><h5>Categories</h5></div><canvas id="catChart"></canvas></div></div>
            </div>
            <div class="chart-card mt-4"><div class="chart-header"><h5>Recent Transactions</h5></div><div id="recentTx"></div></div>
        `;
        this.transactionMgr.renderRecent();
        this.charts.ie = FinanceCharts.createIncomeExpense(document.getElementById('ieChart'), this.settings.currency, t.income, t.expense);
        this.charts.cat = FinanceCharts.createCategory(document.getElementById('catChart'), this.settings.currency, this.transactions);
    }

    renderTransactions() {
        document.getElementById('pageContent').innerHTML = `
            <div class="chart-card">
                <div class="chart-header"><h5>All Transactions</h5><button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTransactionModal">Add Transaction</button></div>
                <div class="filter-tabs mb-3">
                    <div class="filter-tab active" data-filter="all">All</div>
                    <div class="filter-tab" data-filter="income">Income</div>
                    <div class="filter-tab" data-filter="expense">Expense</div>
                </div>
                <div class="data-table"><div class="table-header"><div>Date</div><div>Description</div><div>Category</div><div>Type</div><div>Amount</div><div class="text-center">Actions</div></div><div id="txList"></div></div>
            </div>
        `;
        this.transactionMgr.renderList();
        this.transactionMgr.setupFilters();
    }

    renderAnalytics() {
        document.getElementById('pageContent').innerHTML = `
            <div class="row">
                <div class="col-md-8"><div class="chart-card"><h5>Monthly Trend</h5><canvas id="trendChart"></canvas></div></div>
                <div class="col-md-4"><div class="chart-card"><h5>Top Categories</h5><canvas id="topCatChart"></canvas></div></div>
            </div>
        `;
        this.charts.trend = FinanceCharts.createMonthlyTrend(document.getElementById('trendChart'), this.settings.currency, this.transactions);
        this.charts.topCat = FinanceCharts.createTopCategories(document.getElementById('topCatChart'), this.settings.currency, this.transactions);
    }

    renderSavings() {
        const totalSaved = this.settings.savingsGoals.reduce((sum, goal) => sum + goal.current, 0);
        const totalTarget = this.settings.savingsGoals.reduce((sum, goal) => sum + goal.target, 0);

        document.getElementById('pageContent').innerHTML = `
            <h2>Savings Goals</h2>
            <p class="text-muted">Track and manage your savings towards specific goals</p>

            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card p-4">
                        <h6>Total Saved</h6>
                        <div class="saving-amount">${this.settings.currency}${totalSaved.toFixed(2)}</div>
                        <small>Across all goals</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-4">
                        <h6>Total Target</h6>
                        <div class="target-amount">${this.settings.currency}${totalTarget.toFixed(2)}</div>
                        <small>Combined goals</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card p-4">
                        <h6>Progress</h6>
                        <div class="progress-amount">${((totalSaved / totalTarget) * 100).toFixed(1)}%</div>
                        <small>Overall completion</small>
                    </div>
                </div>
            </div>

            <!-- Savings Goals List -->
            <div class="card p-4 mb-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Your Savings Goals</h5>
                    <button class="btn btn-primary btn-sm" onclick="addSavingsGoal()">
                        <i class="bi bi-plus-circle"></i> Add Goal
                    </button>
                </div>

                <div class="row" id="savingsGoalsContainer">
                    ${this.renderSavingsGoals()}
                </div>
            </div>

            <!-- Savings Allocation -->
            <div class="card p-4">
                <h5>Quick Allocation</h5>
                <p class="text-muted">Add money to your savings goals</p>

                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Select Goal</label>
                        <select class="form-select" id="allocationGoal">
                            <option value="">Choose a goal</option>
                            ${this.settings.savingsGoals.map(goal => `<option value="${goal.id}">${goal.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Amount</label>
                        <input type="number" class="form-control" id="allocationAmount" step="0.01" min="0.01" placeholder="0.00">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">&nbsp;</label>
                        <button class="btn btn-success w-100" onclick="allocateSavings()">
                            <i class="bi bi-plus"></i> Add to Savings
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSavingsGoals() {
        return this.settings.savingsGoals.map(goal => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const remaining = goal.target - goal.current;
            return `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center" style="background-color: ${goal.color}; color: white;">
                            <h6 class="mb-0">${goal.name}</h6>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="editSavingsGoal('${goal.id}')">Edit</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteSavingsGoal('${goal.id}')">Delete</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span>Current:</span>
                                <strong>${this.settings.currency}${goal.current.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-3">
                                <span>Target:</span>
                                <strong>${this.settings.currency}${goal.target.toFixed(2)}</strong>
                            </div>
                            <div class="progress mb-2" style="height: 20px;">
                                <div class="progress-bar" style="width: ${progress}%; background-color: ${goal.color};">
                                    ${progress.toFixed(1)}%
                                </div>
                            </div>
                            <small class="text-muted">
                                ${remaining > 0 ? `${this.settings.currency}${remaining.toFixed(2)} remaining` : 'Goal achieved!'}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    saveSettings() {
        localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    }

    renderReports() {
        const t = this.calculateTotals();
        document.getElementById('pageContent').innerHTML = `
            <h2>Reports & Analytics</h2>
            <p class="text-muted">Analyze your financial data with detailed reports</p>

                <!-- Filters -->
                <div class="card p-4 mb-4">
                    <h5>Report Filters</h5>

                    <div class="row g-3 mt-2">
                        <div class="col-md-3">
                            <label class="form-label">Period</label>
                            <select class="form-select" id="reportPeriod">
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="reportType">
                                <option>All Types</option>
                                <option>Income</option>
                                <option>Expense</option>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="reportCategory">
                                <option>All Categories</option>
                                <option>food</option>
                                <option>shopping</option>
                                <option>transport</option>
                                <option>housing</option>
                                <option>entertainment</option>
                                <option>education</option>
                                <option>health</option>
                                <option>other</option>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label">Date Range</label>
                            <input type="date" class="form-control" id="reportDateRange">
                        </div>
                    </div>

                    <!-- export file -->
                    <div class="mt-3 d-flex flex-wrap gap-2 align-items-center">
                        <!-- Import -->
                        <label class="btn btn-outline-success mb-0">
                            <i class="bi bi-upload"></i> Import CSV
                            <input type="file" id="importCSV" accept=".csv" hidden>
                        </label>

                        <!-- Export CSV -->
                        <button class="btn btn-outline-primary" onclick="exportCSV()">
                            <i class="bi bi-download"></i> Export CSV
                        </button>

                        <!-- Export PDF -->
                        <button class="btn btn-outline-danger" onclick="exportPDF()">
                            <i class="bi bi-file-earmark-pdf"></i> Export PDF
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card p-4">
                            <h6>Total Income</h6>
                            <div class="income">${this.settings.currency}${t.income.toFixed(2)}</div>
                            <small>${this.transactions.filter(tx => tx.type === 'income').length} transactions</small>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="card p-4">
                            <h6>Total Expenses</h6>
                            <div class="expense">${this.settings.currency}${t.expense.toFixed(2)}</div>
                            <small>${this.transactions.filter(tx => tx.type === 'expense').length} transactions</small>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="card p-4">
                            <h6><i class="fas fa-balance-scale"></i> Net Balance</h6>
                            <div class="${t.balance >= 0 ? 'income' : 'expense'}">${this.settings.currency}${t.balance.toFixed(2)}</div>
                            <small>Income minus expenses</small>
                        </div>
                    </div>
                </div>

                <!-- Detailed Category Analysis -->
                <div class="card p-4">
                    <h5 class="mb-3">Detailed Category Analysis</h5>

                    <div class="table-responsive">
                        <table class="table custom-table align-middle">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Transactions</th>
                                    <th>Amount ($)</th>
                                    <th>Avg / Transaction ($)</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="categoryTable"></tbody>
                        </table>
                    </div>
                </div>
        `;
        this.populateCategoryTable();
    }

    // getYearlyTotal(type) {
    //     return this.transactions.filter(t => new Date(t.date).getFullYear() === new Date().getFullYear() && t.type === type).reduce((s, t) => s + t.amount, 0);
    // }

    exportReport() {
        const t = this.calculateTotals();
        const report = {
            title: 'Financial Report', date: new Date().toLocaleDateString(),
            user: this.settings.profile,
            monthlySummary: { income: t.income, expenses: t.expense, balance: t.balance, budget: this.monthlyBudget, remainingBudget: this.monthlyBudget - t.expense },
            yearlySummary: { totalIncome: this.getYearlyTotal('income'), totalExpenses: this.getYearlyTotal('expense'), netSavings: this.getYearlyTotal('income') * 0.2 },
            transactions: this.transactions.slice(0,50)
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Swal.fire('Exported!', 'Report downloaded', 'success');
    }

    populateCategoryTable() {
        const tableBody = document.getElementById('categoryTable');
        if (!tableBody) return;

        const categories = {};
        this.transactions.forEach(tx => {
            if (!categories[tx.category]) {
                categories[tx.category] = { income: 0, expense: 0, count: 0, transactions: [] };
            }
            categories[tx.category][tx.type] += tx.amount;
            categories[tx.category].count++;
            categories[tx.category].transactions.push(tx);
        });

        tableBody.innerHTML = Object.entries(categories).map(([category, data]) => {
            const total = data.income - data.expense;
            const avg = data.count > 0 ? total / data.count : 0;
            return `
                <tr>
                    <td>${FinanceUtils.capitalize(category)}</td>
                    <td><span class="badge bg-${total >= 0 ? 'success' : 'danger'}">${total >= 0 ? 'Income' : 'Expense'}</span></td>
                    <td>${data.count}</td>
                    <td>${this.settings.currency}${Math.abs(total).toFixed(2)}</td>
                    <td>${this.settings.currency}${Math.abs(avg).toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewCategoryDetails('${category}')">
                            <i class="fa fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${category}')">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    saveTransactions() {
        localStorage.setItem(this.transactionsKey, JSON.stringify(this.transactions));
    }

    updateDashboard() {
        this.loadPage(this.currentPage);
    }
}