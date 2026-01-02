// js/init.js
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'log.html';
        return;
    }
    window.financeApp = new FinanceDashboard();
});