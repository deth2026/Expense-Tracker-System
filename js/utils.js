// js/utils.js
const FinanceUtils = {
    getCategoryIcon(cat) {
        const icons = {
            food: 'fas fa-utensils',
            shopping: 'fas fa-shopping-bag',
            transport: 'fas fa-car',
            housing: 'fas fa-home',
            entertainment: 'fas fa-film',
            education: 'fas fa-graduation-cap',
            health: 'fas fa-heartbeat',
            savings: 'fas fa-piggy-bank',
            other: 'fas fa-question-circle'
        };
        return icons[cat] || 'fas fa-question-circle';
    },

    getCategoryColor(cat) {
        const colors = {
            food: 'bg-food', shopping: 'bg-shopping', transport: 'bg-transport',
            housing: 'bg-housing', entertainment: 'bg-entertainment',
            education: 'bg-education', health: 'bg-health', savings: 'bg-savings',
            other: 'bg-other'
        };
        return colors[cat] || 'bg-other';
    },

    getCategoryName(cat) {
        const names = {
            food: 'Food & Dining', shopping: 'Shopping', transport: 'Transportation',
            housing: 'Housing', entertainment: 'Entertainment',
            education: 'Education', health: 'Healthcare', savings: 'Savings',
            other: 'Other'
        };
        return names[cat] || cat;
    },

    getPageTitle(page) {
        const titles = {
            dashboard: 'Dashboard', transactions: 'Transactions',
            analytics: 'Analytics', savings: 'Savings',
            reports: 'Reports', settings: 'Settings'
        };
        return titles[page] || 'Dashboard';
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};