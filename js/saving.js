// js/saving.js
function addSavingsGoal() {
    Swal.fire({
        title: 'Add Savings Goal',
        html: `
            <div class="mb-3">
                <label class="form-label">Goal Name</label>
                <input type="text" id="goalName" class="form-control" placeholder="e.g. Emergency Fund">
            </div>
            <div class="mb-3">
                <label class="form-label">Target Amount ($)</label>
                <input type="number" id="goalTarget" class="form-control" step="0.01" min="0.01">
            </div>
            <div class="mb-3">
                <label class="form-label">Current Amount ($)</label>
                <input type="number" id="goalCurrent" class="form-control" step="0.01" min="0" value="0">
            </div>
            <div class="mb-3">
                <label class="form-label">Color</label>
                <input type="color" id="goalColor" class="form-control" value="#28a745">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Goal',
        preConfirm: () => {
            const name = document.getElementById('goalName').value.trim();
            const target = parseFloat(document.getElementById('goalTarget').value);
            const current = parseFloat(document.getElementById('goalCurrent').value);
            const color = document.getElementById('goalColor').value;

            if (!name || isNaN(target) || target <= 0 || isNaN(current) || current < 0) {
                Swal.showValidationMessage('Please fill all fields correctly');
                return false;
            }

            return { name, target, current, color };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const newGoal = {
                id: Date.now().toString(),
                name: result.value.name,
                target: result.value.target,
                current: result.value.current,
                color: result.value.color
            };

            window.financeApp.settings.savingsGoals.push(newGoal);
            window.financeApp.saveSettings();
            window.financeApp.renderSavings();

            // Update dashboard if user is currently viewing it
            if (window.financeApp.currentPage === 'dashboard') {
                window.financeApp.renderDashboard();
            }

            Swal.fire('Added!', 'Savings goal has been added.', 'success');
        }
    });
}

function editSavingsGoal(goalId) {
    const goal = window.financeApp.settings.savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    Swal.fire({
        title: 'Edit Savings Goal',
        html: `
            <div class="mb-3">
                <label class="form-label">Goal Name</label>
                <input type="text" id="editGoalName" class="form-control" value="${goal.name}">
            </div>
            <div class="mb-3">
                <label class="form-label">Target Amount ($)</label>
                <input type="number" id="editGoalTarget" class="form-control" step="0.01" min="0.01" value="${goal.target}">
            </div>
            <div class="mb-3">
                <label class="form-label">Current Amount ($)</label>
                <input type="number" id="editGoalCurrent" class="form-control" step="0.01" min="0" value="${goal.current}">
            </div>
            <div class="mb-3">
                <label class="form-label">Color</label>
                <input type="color" id="editGoalColor" class="form-control" value="${goal.color}">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Goal',
        preConfirm: () => {
            const name = document.getElementById('editGoalName').value.trim();
            const target = parseFloat(document.getElementById('editGoalTarget').value);
            const current = parseFloat(document.getElementById('editGoalCurrent').value);
            const color = document.getElementById('editGoalColor').value;

            if (!name || isNaN(target) || target <= 0 || isNaN(current) || current < 0) {
                Swal.showValidationMessage('Please fill all fields correctly');
                return false;
            }

            return { name, target, current, color };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            goal.name = result.value.name;
            goal.target = result.value.target;
            goal.current = result.value.current;
            goal.color = result.value.color;

            window.financeApp.saveSettings();
            window.financeApp.renderSavings();

            // Update dashboard if user is currently viewing it
            if (window.financeApp.currentPage === 'dashboard') {
                window.financeApp.renderDashboard();
            }

            Swal.fire('Updated!', 'Savings goal has been updated.', 'success');
        }
    });
}

function deleteSavingsGoal(goalId) {
    const goal = window.financeApp.settings.savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    Swal.fire({
        title: 'Are you sure?',
        text: `Delete "${goal.name}" savings goal? This will remove all progress.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            window.financeApp.settings.savingsGoals = window.financeApp.settings.savingsGoals.filter(g => g.id !== goalId);
            window.financeApp.saveSettings();
            window.financeApp.renderSavings();

            // Update dashboard if user is currently viewing it
            if (window.financeApp.currentPage === 'dashboard') {
                window.financeApp.renderDashboard();
            }

            Swal.fire('Deleted!', 'Savings goal has been deleted.', 'success');
        }
    });
}

function allocateSavings() {
    const goalId = document.getElementById('allocationGoal').value;
    const amount = parseFloat(document.getElementById('allocationAmount').value);

    if (!goalId) {
        Swal.fire('Error', 'Please select a savings goal', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        Swal.fire('Error', 'Please enter a valid amount', 'error');
        return;
    }

    const goal = window.financeApp.settings.savingsGoals.find(g => g.id === goalId);
    if (!goal) {
        Swal.fire('Error', 'Goal not found', 'error');
        return;
    }

    // Check if user has enough money (simplified check)
    const availableMoney = window.financeApp.calculateTotals().balance;
    if (amount > availableMoney) {
        Swal.fire('Insufficient Funds', 'You don\'t have enough money to allocate this amount.', 'warning');
        return;
    }

    goal.current += amount;

    // Add a transaction to track the savings allocation
    const transaction = {
        id: Date.now().toString(),
        type: 'expense',
        description: `Savings: ${goal.name}`,
        amount: amount,
        category: 'savings',
        date: new Date().toISOString().split('T')[0]
    };

    window.financeApp.transactions.push(transaction);
    window.financeApp.saveTransactions();
    window.financeApp.saveSettings();
    window.financeApp.renderSavings();

    // Update dashboard if user is currently viewing it
    if (window.financeApp.currentPage === 'dashboard') {
        window.financeApp.renderDashboard();
    }

    // Clear form
    document.getElementById('allocationGoal').value = '';
    document.getElementById('allocationAmount').value = '';

    Swal.fire('Success!', `$${amount.toFixed(2)} added to ${goal.name}`, 'success');
}

// Make functions globally available
window.addSavingsGoal = addSavingsGoal;
window.editSavingsGoal = editSavingsGoal;
window.deleteSavingsGoal = deleteSavingsGoal;
window.allocateSavings = allocateSavings;