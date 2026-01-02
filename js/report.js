// js/report.js
document.addEventListener('DOMContentLoaded', function() {
    const importCSVInput = document.getElementById('importCSV');
    if (importCSVInput) {
        importCSVInput.addEventListener('change', importCSV);
    }
});

function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');

        const transactions = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 5) {
                const tx = {
                    id: Date.now().toString() + i,
                    date: values[0].trim(),
                    description: values[1].trim(),
                    type: values[2].trim(),
                    category: values[3].trim(),
                    amount: parseFloat(values[4].trim())
                };
                if (tx.date && tx.description && tx.type && tx.category && !isNaN(tx.amount)) {
                    transactions.push(tx);
                }
            }
        }

        if (transactions.length > 0) {
            window.financeApp.transactions.push(...transactions);
            window.financeApp.saveTransactions();
            window.financeApp.populateCategoryTable();
            Swal.fire('Imported!', `${transactions.length} transactions imported successfully`, 'success');
        } else {
            Swal.fire('Error', 'No valid transactions found in CSV', 'error');
        }
    };
    reader.readAsText(file);
}
function exportCSV() {
    const transactions = window.financeApp.transactions;
    const csvContent = [
        ['Date', 'Description', 'Type', 'Category', 'Amount'],
        ...transactions.map(tx => [
            tx.date,
            tx.description,
            tx.type,
            tx.category,
            tx.amount
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Swal.fire('Exported!', 'CSV file downloaded', 'success');
}

function exportPDF() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }

        const doc = new jsPDF();

    let yPos = 30;
    const lineHeight = 8;
    const pageHeight = 280;

    // Helper function to add new page if needed
    const checkPageBreak = () => {
        if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 30;
        }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Report', 20, yPos);
    yPos += 15;

    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 15;

    // Summary Section
    checkPageBreak();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, yPos);
    yPos += 12;

    const currency = window.financeApp.settings.currency || '$';
    const totals = window.financeApp.calculateTotals();

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos += lineHeight;
    doc.text(`Total Expenses: ${currency}${totals.expense.toFixed(2)}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Net Balance: ${currency}${totals.balance.toFixed(2)}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Total Savings: ${currency}${totals.savings.toFixed(2)}`, 20, yPos);
    yPos += 15;

    // Category Analysis
    checkPageBreak();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Analysis', 20, yPos);
    yPos += 12;

    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Category', 20, yPos);
    doc.text('Type', 80, yPos);
    doc.text('Transactions', 120, yPos);
    doc.text('Amount', 160, yPos);
    yPos += lineHeight;

    // Draw line under headers
    doc.line(20, yPos - 2, 190, yPos - 2);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    const categories = {};
    window.financeApp.transactions.forEach(tx => {
        if (!categories[tx.category]) {
            categories[tx.category] = { income: 0, expense: 0, count: 0 };
        }
        categories[tx.category][tx.type] += tx.amount;
        categories[tx.category].count++;
    });

    Object.entries(categories).forEach(([category, data]) => {
        checkPageBreak();

        const total = data.income - data.expense;
        const type = total >= 0 ? 'Income' : 'Expense';

        doc.text(typeof FinanceUtils !== 'undefined' ? FinanceUtils.getCategoryName(category) : category, 20, yPos);
        doc.text(type, 80, yPos);
        doc.text(data.count.toString(), 120, yPos);
        doc.text(`${currency}${Math.abs(total).toFixed(2)}`, 160, yPos);
        yPos += lineHeight;
    });

    // Savings Goals
    if (window.financeApp.settings.savingsGoals && window.financeApp.settings.savingsGoals.length > 0) {
        checkPageBreak();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Savings Goals', 20, yPos + 10);
        yPos += 22;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        window.financeApp.settings.savingsGoals.forEach(goal => {
            checkPageBreak();

            const progress = Math.min((goal.current / goal.target) * 100, 100);
            doc.text(`${goal.name}:`, 20, yPos);
            doc.text(`${currency}${goal.current.toFixed(2)} / ${currency}${goal.target.toFixed(2)}`, 60, yPos);
            doc.text(`(${progress.toFixed(1)}%)`, 140, yPos);
            yPos += lineHeight;
        });
    }

    // Recent Transactions (last 10)
    checkPageBreak();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 20, yPos + 10);
    yPos += 22;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 20, yPos);
    doc.text('Description', 50, yPos);
    doc.text('Category', 120, yPos);
    doc.text('Amount', 160, yPos);
    yPos += lineHeight;

    doc.line(20, yPos - 2, 190, yPos - 2);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    const recentTransactions = window.financeApp.transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    recentTransactions.forEach(tx => {
        checkPageBreak();

        doc.text(tx.date, 20, yPos);
        doc.text(tx.description.substring(0, 25), 50, yPos);
        doc.text(typeof FinanceUtils !== 'undefined' ? FinanceUtils.getCategoryName(tx.category) : tx.category, 120, yPos);
        doc.text(`${currency}${tx.amount.toFixed(2)}`, 160, yPos);
        yPos += lineHeight;
    });

        // Save the PDF
        const fileName = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        Swal.fire('Exported!', 'PDF report downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        Swal.fire('Error', 'Failed to generate PDF report. Please try again.', 'error');
    }
}

function addRow() {
    Swal.fire({
        title: 'Add New Category',
        input: 'text',
        inputLabel: 'Category Name',
        inputPlaceholder: 'Enter category name',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Category name is required!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Add a sample transaction for the new category
            const newTx = {
                id: Date.now().toString(),
                type: 'expense',
                description: `Sample ${result.value}`,
                amount: 0,
                category: result.value.toLowerCase(),
                date: new Date().toISOString().split('T')[0]
            };
            window.financeApp.transactions.push(newTx);
            window.financeApp.saveTransactions();
            window.financeApp.populateCategoryTable();
            Swal.fire('Added!', `Category "${result.value}" added successfully`, 'success');
        }
    });
}

function viewCategoryDetails(category) {
    const transactions = window.financeApp.transactions.filter(tx => tx.category === category);
    const total = transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    let details = `<h5>Category: ${FinanceUtils.capitalize(category)}</h5>
                   <p>Total: ${window.financeApp.settings.currency}${total.toFixed(2)}</p>
                   <p>Transactions: ${transactions.length}</p>
                   <table class="table table-sm">
                       <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                       <tbody>`;

    transactions.forEach(tx => {
        details += `<tr>
                        <td>${tx.date}</td>
                        <td>${tx.description}</td>
                        <td class="${tx.type === 'income' ? 'text-success' : 'text-danger'}">${window.financeApp.settings.currency}${tx.amount}</td>
                    </tr>`;
    });
    details += '</tbody></table>';

    Swal.fire({
        title: 'Category Details',
        html: details,
        width: '800px'
    });
}

function deleteCategory(category) {
    Swal.fire({
        title: 'Are you sure?',
        text: `Delete all transactions in category "${category}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            window.financeApp.transactions = window.financeApp.transactions.filter(tx => tx.category !== category);
            window.financeApp.saveTransactions();
            window.financeApp.populateCategoryTable();
            Swal.fire('Deleted!', 'Category has been deleted.', 'success');
        }
    });
}

// Make functions globally available
window.exportCSV = exportCSV;
window.exportPDF = exportPDF;
window.addRow = addRow;
window.viewCategoryDetails = viewCategoryDetails;
window.deleteCategory = deleteCategory;