// State management
let users = JSON.parse(localStorage.getItem('expenseTrackerUsers')) || [];
let currentUser = null;
let isLoginForm = true;

// Initialize sample data
function initializeSampleData() {
    if (users.length === 0) {
        users.push({
            id: Date.now().toString(),
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123',
            joinDate: new Date().toLocaleDateString()
        });
        localStorage.setItem('expenseTrackerUsers', JSON.stringify(users));
    }
}

// Toggle forms
function toggleForms() {
    isLoginForm = !isLoginForm;

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const infoTitle = document.getElementById('infoTitle');
    const infoSubtitle = document.getElementById('infoSubtitle');
    const switchFormBtn = document.getElementById('switchFormBtn');

    if (isLoginForm) {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        infoTitle.textContent = 'Take Control of Your Finances';
        infoSubtitle.textContent = 'Login to track your expenses and manage your budget';
        switchFormBtn.textContent = 'Sign Up';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        infoTitle.textContent = 'Start Managing Your Money';
        infoSubtitle.textContent = 'Sign up to take control of your expenses today';
        switchFormBtn.textContent = 'Login';
    }
    resetForms();
}

// Reset forms
function resetForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.success-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(input => input.style.borderColor = '#e8e8e8');
}

// Validation
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    resetForms();

    let valid = true;
    if (!validateEmail(email)) {
        document.getElementById('loginEmailError').classList.add('show');
        valid = false;
    }
    if (password.length < 6) {
        document.getElementById('loginPasswordError').textContent = 'Password too short';
        document.getElementById('loginPasswordError').classList.add('show');
        valid = false;
    }

    if (!valid) return;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('loginSuccess').classList.add('show');
        setTimeout(() => window.location.href = 'das.html', 1500);
    } else {
        document.getElementById('loginPasswordError').textContent = 'Invalid email or password';
        document.getElementById('loginPasswordError').classList.add('show');
    }
}

// Handle Signup
function handleSignup(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    resetForms();

    let valid = true;
    if (firstName.length < 2) { document.getElementById('firstNameError').classList.add('show'); valid = false; }
    if (lastName.length < 2) { document.getElementById('lastNameError').classList.add('show'); valid = false; }
    if (!validateEmail(email)) { document.getElementById('signupEmailError').classList.add('show'); valid = false; }
    if (users.some(u => u.email === email)) {
        document.getElementById('signupEmailError').textContent = 'Email already exists';
        document.getElementById('signupEmailError').classList.add('show');
        valid = false;
    }
    if (!validatePassword(password)) { document.getElementById('signupPasswordError').classList.add('show'); valid = false; }
    if (password !== confirm) { document.getElementById('confirmPasswordError').classList.add('show'); valid = false; }
    if (!terms) { document.getElementById('termsError').classList.add('show'); valid = false; }

    if (!valid) return;

    const newUser = { id: Date.now().toString(), firstName, lastName, email, password, joinDate: new Date().toLocaleDateString() };
    users.push(newUser);
    localStorage.setItem('expenseTrackerUsers', JSON.stringify(users));

    currentUser = { id: newUser.id, firstName, lastName, email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    document.getElementById('signupSuccess').classList.add('show');
    setTimeout(() => window.location.href = 'das.html', 2000);
}

// Password toggle
function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

// LOGOUT CONFIRMATION MODAL
// LOGOUT CONFIRMATION MODAL - NOW FULLY STYLED AND BEAUTIFUL
function showLogoutConfirmation() {
    const modalHTML = `
        <div class="modal-overlay" id="logoutModal">
            <div class="confirmation-modal">
                <div class="modal-icon">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h3 class="modal-title">Confirm Logout</h3>
                <p class="modal-message">
                    Are you sure you want to logout?<br>
                    You'll need to login again to access your expense data.
                </p>
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-cancel" id="cancelLogout">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="modal-btn modal-btn-confirm" id="confirmLogout">
                        <i class="fas fa-sign-out-alt"></i> Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add fade-in animation
    const modal = document.querySelector('#logoutModal .confirmation-modal');
    modal.classList.add('fade-in');

    // Event listeners
    document.getElementById('cancelLogout').addEventListener('click', closeModal);
    document.getElementById('confirmLogout').addEventListener('click', () => {
        closeModal();
        setTimeout(() => {
            localStorage.removeItem('currentUser');
            window.location.href = 'log.html';
        }, 300);
    });

    // Close on overlay click
    document.getElementById('logoutModal').addEventListener('click', (e) => {
        if (e.target.id === 'logoutModal') {
            closeModal();
        }
    });

    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    function closeModal() {
        modal.classList.add('modal-closing');
        setTimeout(() => {
            const overlay = document.getElementById('logoutModal');
            if (overlay) overlay.remove();
        }, 300);
    }
}
// MAIN - Everything runs after page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeSampleData();
    currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // === LOGIN / SIGNUP PAGE ===
    if (window.location.pathname.includes('log.html') || window.location.pathname === '/') {
        const switchFormBtn = document.getElementById('switchFormBtn');
        const showSignup = document.getElementById('showSignup');
        const showLogin = document.getElementById('showLogin');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (switchFormBtn) switchFormBtn.addEventListener('click', toggleForms);
        if (showSignup) showSignup.addEventListener('click', (e) => { e.preventDefault(); if (isLoginForm) toggleForms(); });
        if (showLogin) showLogin.addEventListener('click', (e) => { e.preventDefault(); if (!isLoginForm) toggleForms(); });
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (signupForm) signupForm.addEventListener('submit', handleSignup);

        setupPasswordToggles();

        // Show login form by default
        if (loginForm && signupForm) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        }
    }

    // === DASHBOARD PAGE ===
    if (window.location.pathname.includes('das.html')) {
        // Redirect if not logged in
        if (!currentUser) {
            window.location.href = 'log.html';
            return;
        }
        // Display user info
        document.getElementById('userName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        // document.getElementById('welcomeUserName').textContent = currentUser.firstName;

        const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
    
        // NOW attach logout with confirmation
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', showLogoutConfirmation);
        }
    }
});









