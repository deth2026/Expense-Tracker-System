// js/transactions.js
class TransactionManager {
    constructor(app) {
        this.app = app;
    }
    save() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const editId = document.getElementById('editId').value;

        if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
            Swal.fire('Error', 'Please fill all fields correctly', 'error');
            return;
        }

        const tx = { id: editId || Date.now().toString(), type, description, amount, category, date };

        if (editId) {
            const index = this.app.transactions.findIndex(t => t.id === editId);
            this.app.transactions[index] = tx;
        } else {
            this.app.transactions.push(tx);
        }

        localStorage.setItem(this.app.transactionsKey, JSON.stringify(this.app.transactions));
        bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'))?.hide();
        document.getElementById('transactionForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('editId').value = '';

        Swal.fire('Success!', 'Transaction saved', 'success');
        this.app.updateDashboard();
    }

    edit(id) {
        const tx = this.app.transactions.find(t => t.id === id);
        if (!tx) return;

        document.getElementById('description').value = tx.description;
        document.getElementById('amount').value = tx.amount;
        document.getElementById('category').value = tx.category;
        document.getElementById('date').value = tx.date;
        document.querySelector(`input[name="type"][value="${tx.type}"]`).checked = true;
        document.getElementById('editId').value = tx.id;

        new bootstrap.Modal(document.getElementById('addTransactionModal')).show();
    }

    delete(id) {
        Swal.fire({
            title: 'Delete Transaction?', text: "This action cannot be undone!", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Yes, delete!'
        }).then(res => {
            if (res.isConfirmed) {
                this.app.transactions = this.app.transactions.filter(t => t.id !== id);
                localStorage.setItem(this.app.transactionsKey, JSON.stringify(this.app.transactions));
                this.app.updateDashboard();
                Swal.fire('Deleted!', 'Transaction removed.', 'success');
            }
        });
    }

    renderRecent() {
        const container = document.getElementById('recentTx');
        if (!container) return;
        const recent = this.app.transactions.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,6);
        container.innerHTML = recent.length ? recent.map(t => `
            <div class="transaction-item">
                <div class="transaction-icon ${FinanceUtils.getCategoryColor(t.category)}">
                    <i class="${FinanceUtils.getCategoryIcon(t.category)}"></i>
                </div>
                <div class="transaction-details flex-grow-1">
                    <h6>${t.description}</h6>
                    <p>${new Date(t.date).toLocaleDateString()} • ${FinanceUtils.getCategoryName(t.category)}</p>
                </div>
                <div class="${t.type==='income'?'amount-income':'amount-expense'}">
                    ${t.type==='income'?'+' : '-'}${this.app.settings.currency}${t.amount.toFixed(2)}
                </div>
            </div>
        `).join('') : '<p class="text-center py-4 text-muted">No transactions yet</p>';
    }

    renderList(filter = 'all') {
        const list = document.getElementById('txList');
        if (!list) return;
        let filtered = this.app.transactions.slice();
        if (filter !== 'all') filtered = filtered.filter(t => t.type === filter);
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

        list.innerHTML = filtered.length ? filtered.map(t => `
            <div class="table-row">
                <div>${new Date(t.date).toLocaleDateString()}</div>
                <div>${t.description}</div>
                <div><span class="badge ${FinanceUtils.getCategoryColor(t.category)}">${FinanceUtils.getCategoryName(t.category)}</span></div>
                <div><span class="type-badge ${t.type==='income'?'type-income':'type-expense'}">${t.type}</span></div>
                <div class="${t.type==='income'?'amount-income':'amount-expense'}">
                    ${t.type==='income'?'+' : '-'}${this.app.settings.currency}${t.amount.toFixed(2)}
                </div>
                <div class="action-buttons">
                    <div class="action-btn edit-btn" onclick="window.financeApp.transactionMgr.edit('${t.id}')">
                        <i class="fas fa-edit"></i>
                    </div>
                    <div class="action-btn delete-btn" onclick="window.financeApp.transactionMgr.delete('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            </div>
        `).join('') : '<div class="text-center py-5 text-muted">No transactions found</div>';
    }

    setupFilters() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderList(tab.dataset.filter);
            });
        });
    }
}