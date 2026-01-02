// js/settings.js
class SettingsManager {
    constructor(app) {
        this.app = app;
    }

    render() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        const profile = this.app.settings.profile || {};

        document.getElementById('pageContent').innerHTML = `
        <div class="chart-card">
            <h5 class="mb-4">Settings</h5>
            <ul class="nav nav-tabs mb-4" id="settingsTabs">
                <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#profile">Profile Settings</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#financial">Financial Settings</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#appearance">Appearance</button></li>
            </ul>

            <div class="tab-content">
                <div class="tab-pane fade show active" id="profile">
                    <div class="row">
                        <div class="col-md-4 text-center mb-4">
                            <div class="profile-avatar mb-3">
                                <div class="avatar-display" id="avatarDisplay">
                                    ${profile.avatarImage ? `<img src="${profile.avatarImage}">` : (profile.avatar || `${currentUser.firstName?.[0]}${currentUser.lastName?.[0]}`.toUpperCase() || 'JD')}
                                </div>
                                <input type="file" id="avatarUpload" accept="image/*" style="display:none;">
                                <button class="btn btn-outline-primary btn-sm mt-2" id="changeAvatarBtn">Change Avatar</button>
                                <button class="btn btn-outline-secondary btn-sm mt-2" id="useInitialsBtn" style="display:${profile.avatarImage ? 'block' : 'none'};">Use Initials</button>
                            </div>
                            <h5>${profile.name || `${currentUser.firstName} ${currentUser.lastName}`}</h5>
                            <p class="text-muted">${profile.email || currentUser.email || ''}</p>
                        </div>
                        <div class="col-md-8">
                            <div class="row">
                                <div class="col-md-6 mb-3"><label>First Name</label><input class="form-control" id="profileFirstName" value="${currentUser.firstName || ''}"></div>
                                <div class="col-md-6 mb-3"><label>Last Name</label><input class="form-control" id="profileLastName" value="${currentUser.lastName || ''}"></div>
                                <div class="col-md-6 mb-3"><label>Email</label><input class="form-control" id="profileEmail" value="${profile.email || currentUser.email || ''}"></div>
                                <div class="col-md-6 mb-3"><label>Password</label><input type="password" class="form-control" id="profilePassword" placeholder="Enter new password (leave blank to keep current)"></div>
                                <div class="col-md-6 mb-3"><label>Location</label><input class="form-control" id="profileLocation" value="${profile.location || ''}"></div>
                                <div class="col-12 mb-3"><label>Bio</label><textarea class="form-control" id="profileBio" rows="3">${profile.bio || ''}</textarea></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-pane fade" id="financial">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Currency</label>
                            <select class="form-select" id="currencySelect">
                                <option value="$" ${this.app.settings.currency === '$' ? 'selected' : ''}>USD ($)</option>
                                <option value="€" ${this.app.settings.currency === '€' ? 'selected' : ''}>EUR (€)</option>
                                <option value="£" ${this.app.settings.currency === '£' ? 'selected' : ''}>GBP (£)</option>
                                <option value="¥" ${this.app.settings.currency === '¥' ? 'selected' : ''}>JPY (¥)</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Starting Balance</label>
                            <input type="number" class="form-control" id="startingBalance" value="${this.app.settings.startingBalance || 0}" min="0" step="0.01">
                            <small class="text-muted">Your current available money</small>
                        </div>
                    </div>
                </div>

                <div class="tab-pane fade" id="appearance">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Theme</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="darkModeToggle" ${this.app.settings.darkMode ? 'checked' : ''}>
                                <label class="form-check-label">Dark Mode</label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Theme Color</label>
                            <div class="color-picker">
                                <div class="color-option ${profile.themeColor === 'blue' ? 'active' : ''}" data-color="blue" style="background: #4361ee;"></div>
                                <div class="color-option ${profile.themeColor === 'green' ? 'active' : ''}" data-color="green" style="background: #28a745;"></div>
                                <div class="color-option ${profile.themeColor === 'purple' ? 'active' : ''}" data-color="purple" style="background: #6f42c1;"></div>
                                <div class="color-option ${profile.themeColor === 'orange' ? 'active' : ''}" data-color="orange" style="background: #fd7e14;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-4 d-flex gap-2">
                <button class="btn btn-primary" id="saveSettingsBtn">Save Settings</button>
            </div>
        </div>
        `;

        this.addStyles();
        this.setupEventListeners();
    }

    addStyles() {
        if (document.getElementById('settingsStyles')) return;
        const style = document.createElement('style');
        style.id = 'settingsStyles';
        style.textContent = `
            .color-picker { display: flex; gap: 10px; margin-top: 8px; }
            .color-option { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #dee2e6; cursor: pointer; transition: all 0.2s; }
            .color-option:hover { transform: scale(1.1); }
            .color-option.active { border-color: #4361ee; transform: scale(1.1); box-shadow: 0 0 0 3px rgba(67,97,238,0.2); }
            .avatar-display { width: 120px; height: 120px; background: linear-gradient(45deg,#4361ee,#4cc9f0); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; margin: 0 auto; overflow: hidden; }
            .avatar-display img { width: 100%; height: 100%; object-fit: cover; }
            .nav-tabs .nav-link.active { color: #4361ee; border-bottom: 3px solid #4361ee; background: transparent; }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Initialize Bootstrap tabs
        const triggerTabList = [].slice.call(document.querySelectorAll('#settingsTabs button'));
        triggerTabList.forEach(function (triggerEl) {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            triggerEl.addEventListener('click', function (event) {
                event.preventDefault();
                tabTrigger.show();
            });
        });

        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            const firstName = document.getElementById('profileFirstName').value.trim() || currentUser.firstName;
            const lastName = document.getElementById('profileLastName').value.trim() || currentUser.lastName;
            const email = document.getElementById('profileEmail').value.trim() || currentUser.email;
            const password = document.getElementById('profilePassword').value.trim();

            this.app.settings.profile.firstName = firstName;
            this.app.settings.profile.lastName = lastName;
            this.app.settings.profile.name = `${firstName} ${lastName}`;
            this.app.settings.profile.email = email;
            this.app.settings.profile.location = document.getElementById('profileLocation').value.trim();
            this.app.settings.profile.bio = document.getElementById('profileBio').value.trim();

            this.app.settings.currency = document.getElementById('currencySelect').value;
            this.app.settings.startingBalance = parseFloat(document.getElementById('startingBalance').value) || 0;

            this.app.settings.darkMode = document.getElementById('darkModeToggle').checked;

            const activeColor = document.querySelector('.color-option.active');
            if (activeColor) this.app.settings.profile.themeColor = activeColor.dataset.color;

            localStorage.setItem(this.app.settingsKey, JSON.stringify(this.app.settings));

            UIManager.applyDarkMode(this.app.settings.darkMode);
            UIManager.updateProfileDisplay(this.app.settings);

            // Update currentUser
            const updatedUser = JSON.parse(localStorage.getItem('currentUser'));
            updatedUser.firstName = firstName;
            updatedUser.lastName = lastName;
            updatedUser.email = email;
            if (password) {
                updatedUser.password = password;
            }
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            Swal.fire('Success!', 'Settings saved', 'success');
            this.app.updateDashboard();
        });

        document.getElementById('changeAvatarBtn')?.addEventListener('click', () => document.getElementById('avatarUpload').click());
        document.getElementById('avatarUpload')?.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = ev => {
                    document.getElementById('avatarDisplay').innerHTML = `<img src="${ev.target.result}">`;
                    document.getElementById('useInitialsBtn').style.display = 'block';
                    this.app.settings.profile.avatarImage = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        document.getElementById('useInitialsBtn')?.addEventListener('click', () => {
            const initials = `${currentUser.firstName?.[0]}${currentUser.lastName?.[0]}`.toUpperCase() || 'JD';
            document.getElementById('avatarDisplay').innerHTML = initials;
            document.getElementById('avatarDisplay').style.background = 'linear-gradient(45deg,#4361ee,#4cc9f0)';
            document.getElementById('useInitialsBtn').style.display = 'none';
            delete this.app.settings.profile.avatarImage;
        });

        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
}