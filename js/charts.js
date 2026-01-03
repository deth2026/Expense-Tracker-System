// js/charts.js
class FinanceCharts {
    static createIncomeExpense(ctx, currency, income, expense) {
        return new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Income', 'Expenses'], datasets: [{ data: [income, expense], backgroundColor: ['#4cc9f0', '#f72585'] }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => currency + v } } } }
        });
    }

    static createCategory(ctx, currency, transactions) {
        const now = new Date();
        const expenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth());
        const cats = {};
        expenses.forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);
        const labels = Object.keys(cats).map(FinanceUtils.getCategoryName);
        const data = Object.values(cats);

        if (!data.length) {
            ctx.parentElement.innerHTML = '<p class="text-center py-5 text-muted">No expenses yet</p>';
            return null;
        }

        return new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: ['#f72585','#4361ee','#4cc9f0','#f8961e','#38b000','#7209b7'] }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }

    static createMonthlyTrend(ctx, currency, transactions) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year = new Date().getFullYear();
        const data = months.map((_,i) => {
            const tx = transactions.filter(t => new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i);
            return {
                income: tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
                expense: tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
            };
        });

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    { label: 'Income', data: data.map(d=>d.income), borderColor: '#4cc9f0', backgroundColor: 'rgba(76,201,240,0.1)', fill: true },
                    { label: 'Expense', data: data.map(d=>d.expense), borderColor: '#f72585', backgroundColor: 'rgba(247,37,133,0.1)', fill: true }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: v => currency + v } } } }
        });
    }

    static createTopCategories(ctx, currency, transactions) {
        const expenses = transactions.filter(t => t.type === 'expense');
        const cats = {};
        expenses.forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);
        const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0,5);

        return new Chart(ctx, {
            type: 'bar',
            data: { labels: sorted.map(([c]) => FinanceUtils.getCategoryName(c)), datasets: [{ data: sorted.map(([,a]) => a), backgroundColor: '#4361ee' }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => currency + v } } } }
        });
    }

    static createSavingsLine(ctx, currency, transactions) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const cumulative = months.map((_,i) => {
            const tx = transactions.filter(t => new Date(t.date).getFullYear() === new Date().getFullYear() && new Date(t.date).getMonth() <= i && t.type === 'income');
            return tx.reduce((s,t) => s + t.amount, 0) * 0.2;
        });

        return new Chart(ctx, {
            type: 'line',
            data: { labels: months, datasets: [{ label: 'Savings', data: cumulative, borderColor: '#38b000', backgroundColor: 'rgba(56,176,0,0.1)', fill: true }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: v => currency + v } } } }
        });
    }

    static createMonthlyPerformance(ctx, currency, transactions) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year = new Date().getFullYear();
        const data = months.map((_, i) => {
            const tx = transactions.filter(t => new Date(t.date).getFullYear() === year && new Date(t.date).getMonth() === i);
            const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expense = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            return income - expense;
        });

        return new Chart(ctx, {
            type: 'bar',
            data: { labels: months, datasets: [{ label: 'Monthly Net', data, backgroundColor: data.map(v => v >= 0 ? '#38b000' : '#f72585') }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { callback: v => currency + v } } } }
        });
    }
}