// js/ui.js
const UIManager = {
    updateProfileDisplay(settings) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        const name = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User';
        const email = currentUser.email || '';
        const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase() || 'JD';

        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');

        if (userNameEl) userNameEl.textContent = name;
        if (userEmailEl) userEmailEl.textContent = email || 'Profile';

        if (userAvatarEl) {
            if (settings.profile?.avatarImage) {
                userAvatarEl.innerHTML = `<img src="${settings.profile.avatarImage}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
            } else {
                userAvatarEl.textContent = initials;
                userAvatarEl.style.cssText = 'background:linear-gradient(45deg,#4361ee,#4cc9f0);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.2rem;';
            }
        }
    },
    applyDarkMode(enable) {
        document.body.classList.toggle('dark-mode', enable);
    }
};