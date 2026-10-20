/* =====================================================
   RDSLP - JavaScript del Login
   Autenticación SOLO contra MySQL (XAMPP).
   Sin fallback a localStorage.
===================================================== */

document.addEventListener('DOMContentLoaded', async function () {
    const loginForm      = document.getElementById('loginForm');
    const emailInput     = document.getElementById('email');
    const passwordInput  = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const eyeIcon        = document.getElementById('eyeIcon');
    const errorMessage   = document.getElementById('errorMessage');
    const errorText      = document.getElementById('errorText');
    const btnLogin       = document.querySelector('.btn-login');

    // ── Si ya hay sesión activa, redirigir al dashboard ───────────────────────
    const sesionActiva = localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user');
    if (sesionActiva) {
        window.location.href = 'dashboard.html';
        return;
    }

    // ── Toggle mostrar / ocultar contraseña ──────────────────────────────────
    togglePassword.addEventListener('click', function () {
        const tipo = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', tipo);
        eyeIcon.innerHTML = tipo === 'text'
            ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="23" x2="23" y2="23"></line>`
            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });

    // ── Submit del formulario ─────────────────────────────────────────────────
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email    = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('remember').checked;

        errorMessage.classList.remove('show');

        // Validaciones básicas
        if (!email || !password) { showError('Por favor, completa todos los campos'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Ingresa un correo válido'); return; }

        setLoading(true);

        try {
            // Verificar que el servidor esté disponible
            const serverUp = await window.apiClient.isServerUp();
            if (!serverUp) {
                showError('No se puede conectar al servidor. Verifica que XAMPP y Node.js estén corriendo.');
                setLoading(false);
                return;
            }

            // Login contra MySQL
            const result = await window.apiClient.login(email, password, remember);

            if (!result) {
                showError('Error al conectar con la base de datos. Intenta de nuevo.');
                setLoading(false);
                return;
            }

            if (!result.success) {
                showError(result.message || 'Correo o contraseña incorrectos');
                passwordInput.value = '';
                passwordInput.focus();
                setLoading(false);
                return;
            }

            // Sesión guardada por apiClient.login() → redirigir
            console.log('Sesión iniciada:', result.user.name, '| Rol:', result.user.role);
            window.location.href = 'dashboard.html';

        } catch (err) {
            console.error('Error en login:', err);
            showError('Error inesperado. Verifica que el servidor esté corriendo.');
            setLoading(false);
        }
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showError(msg) {
        errorText.textContent = msg;
        errorMessage.classList.add('show');
        loginForm.style.animation = 'shake 0.5s ease';
        setTimeout(() => { loginForm.style.animation = ''; }, 500);
    }

    function setLoading(loading) {
        btnLogin.disabled    = loading;
        btnLogin.textContent = loading ? 'Iniciando sesión...' : 'Iniciar Sesión';
    }

    // ── Recuperar / Restablecer Contraseña ───────────────────────────────────
    const forgotModal   = document.getElementById('forgotPasswordModal');
    const forgotBtn     = document.getElementById('forgotPasswordBtn');
    const closeForgot   = document.getElementById('closeForgotModal');
    const cancelForgot  = document.getElementById('cancelForgotModal');
    const forgotForm    = document.getElementById('forgotPasswordForm');
    const forgotMsg     = document.getElementById('forgotMessage');

    forgotBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        forgotForm?.reset();
        if (forgotMsg) forgotMsg.style.display = 'none';
        forgotModal?.classList.add('active');
    });

    const hideForgotModal = () => forgotModal?.classList.remove('active');
    closeForgot?.addEventListener('click', hideForgotModal);
    cancelForgot?.addEventListener('click', hideForgotModal);

    forgotForm?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail')?.value.trim();
        const newPass = document.getElementById('newPassword')?.value;
        const confirmPass = document.getElementById('confirmNewPassword')?.value;

        if (!email || !newPass || !confirmPass) {
            showForgotMsg('Por favor completa todos los campos.', false);
            return;
        }

        if (newPass.length < 6) {
            showForgotMsg('La nueva contraseña debe tener al menos 6 caracteres.', false);
            return;
        }

        if (newPass !== confirmPass) {
            showForgotMsg('Las contraseñas no coinciden.', false);
            return;
        }

        // Buscar y actualizar en almacenamiento local
        let allUsers = JSON.parse(localStorage.getItem('rdslp_all_users') || '[]');
        const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

        if (userIndex !== -1) {
            allUsers[userIndex].password = newPass;
            localStorage.setItem('rdslp_all_users', JSON.stringify(allUsers));
            showForgotMsg('¡Contraseña restablecida con éxito! Redirigiendo al login...', true);
            
            setTimeout(() => {
                hideForgotModal();
                if (emailInput) emailInput.value = email;
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            }, 1600);
        } else {
            // Si no está en demo local, comprobar servidor o notificar
            showForgotMsg('No encontramos ninguna cuenta con ese correo electrónico.', false);
        }
    });

    function showForgotMsg(msg, isSuccess) {
        if (!forgotMsg) return;
        forgotMsg.textContent = msg;
        forgotMsg.style.display = 'block';
        forgotMsg.style.background = isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        forgotMsg.style.color = isSuccess ? '#4ade80' : '#f87171';
        forgotMsg.style.border = isSuccess ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)';
    }

    // Animación shake
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80%      { transform: translateX(5px); }
        }`;
    document.head.appendChild(style);
});
