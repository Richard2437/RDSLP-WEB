/* =====================================================
   RDSLP - JavaScript del Perfil
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const auth = window.authManager;
    const content = window.contentManager;
    const community = window.communityManager;
    let currentUser = null;

    init();

    function init() {
        checkAuth();
        loadUserData();
        loadProfileData();
        setupEventListeners();
    }

    function checkAuth() {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        document.getElementById('userAvatar').textContent = currentUser.name?.charAt(0).toUpperCase() || 'U';
        document.getElementById('userName').textContent = currentUser.name || 'Usuario';
    }

    function loadProfileData() {
        if (!currentUser) return;

        const roleNames = { 'admin': 'Administrador', 'moderator': 'Moderador', 'user': 'Usuario' };
        const role = currentUser.role || 'user';
        const name = currentUser.name || 'Usuario';
        const email = currentUser.email || '';
        const initial = name.charAt(0).toUpperCase() || 'U';

        document.getElementById('profileAvatar').textContent = initial;
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;

        const roleEl = document.getElementById('profileRole');
        roleEl.textContent = roleNames[role] || 'Usuario';
        roleEl.className = 'profile-role ' + role;

        document.getElementById('editName').value = name;
        document.getElementById('editEmail').value = email;
        const roleDropdown = document.getElementById('editRole');
        if (roleDropdown) roleDropdown.value = role;
        document.getElementById('editBio').value = currentUser.bio || '';

        // Stats
        const comments = content.getComments();
        const userComments = comments.filter(c => c.authorId === currentUser.id);
        const ratings = JSON.parse(localStorage.getItem('rdslp_ratings') || '[]');
        const userRatings = ratings.filter(r => r.userId === currentUser.id);
        const events = community.getEvents();
        const userEvents = events.filter(e => e.participants?.some(p => p.id === currentUser.id));

        document.getElementById('statComments').textContent = userComments.length;
        document.getElementById('statRatings').textContent = userRatings.length;
        document.getElementById('statEvents').textContent = userEvents.length;
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsSubmit);

        document.getElementById('cancelChanges')?.addEventListener('click', () => {
            loadProfileData();
            hideMessage();
        });
    }

    async function handleSettingsSubmit(e) {
        e.preventDefault();

        const editName = document.getElementById('editName').value.trim();
        const editBio = document.getElementById('editBio')?.value.trim() || '';
        const editRole = document.getElementById('editRole')?.value || currentUser.role || 'user';
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        hideMessage();

        if (!editName) {
            showMessage('El nombre no puede estar vacío', 'error');
            return;
        }

        const updates = { name: editName, bio: editBio, role: editRole };

        if (currentPassword || newPassword || confirmNewPassword) {
            if (!currentPassword) {
                showMessage('Ingresa tu contraseña actual', 'error');
                return;
            }

            const users = auth.getAllUsers();
            const user = users.find(u => u.email === currentUser.email);

            if (!user || user.password !== currentPassword) {
                showMessage('La contraseña actual es incorrecta', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showMessage('Las contraseñas no coinciden', 'error');
                return;
            }

            updates.password = newPassword;
        }

        // Actualizar rol en Supabase si cambió
        if (editRole && editRole !== currentUser.role) {
            try {
                if (window.rdslpSupabase && currentUser.id) {
                    await window.rdslpSupabase.changeUserRole(currentUser.id, editRole);
                }
            } catch (err) {
                console.warn('[RDSLP] Error al actualizar rol en Supabase:', err);
            }
        }

        const result = auth.updateProfile(updates);

        if (result.success) {
            currentUser = { ...result.user, role: editRole };
            localStorage.setItem('rdslp_user', JSON.stringify(currentUser));
            sessionStorage.setItem('rdslp_user', JSON.stringify(currentUser));
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
            loadProfileData();
            loadUserData();
            showMessage(`¡Perfil y Rol (${editRole}) actualizados exitosamente!`, 'success');
        } else {
            showMessage(result.message || 'Error al guardar', 'error');
        }
    }

    function showMessage(text, type) {
        const el = document.getElementById('settingsMessage');
        el.textContent = text;
        el.className = 'settings-message ' + type;
    }

    function hideMessage() {
        const el = document.getElementById('settingsMessage');
        el.className = 'settings-message';
        el.textContent = '';
    }
});
