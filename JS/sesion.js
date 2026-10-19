/* =====================================================
   RDSLP - JavaScript del Registro
   Registro SOLO contra MySQL (XAMPP).
   Sin fallback a localStorage.
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const registerForm         = document.getElementById('registerForm');
    const passwordInput        = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword       = document.getElementById('togglePassword');
    const eyeIcon              = document.getElementById('eyeIcon');
    const errorMessage         = document.getElementById('errorMessage');
    const errorText            = document.getElementById('errorText');
    const successMessage       = document.getElementById('successMessage');
    const successText          = document.getElementById('successText');
    const strengthFill         = document.getElementById('strengthFill');
    const strengthText         = document.getElementById('strengthText');
    const btnRegister          = document.querySelector('.btn-register');

    // ── Toggle mostrar/ocultar contraseña ─────────────────────────────────────
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eyeIcon.innerHTML = type === 'text'
            ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="23" x2="23" y2="23"></line>`
            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    });

    // ── Medidor de fortaleza de contraseña ────────────────────────────────────
    passwordInput.addEventListener('input', function () {
        const password = passwordInput.value;
        const strength = checkPasswordStrength(password);

        strengthFill.className = 'strength-fill';
        strengthText.className = 'strength-text';

        if (password.length === 0) {
            strengthText.textContent = 'Fortaleza de la contraseña';
        } else if (strength === 'weak') {
            strengthFill.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Contraseña débil';
        } else if (strength === 'medium') {
            strengthFill.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = 'Contraseña media';
        } else {
            strengthFill.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Contraseña fuerte';
        }
    });

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length >= 6)          score++;
        if (password.length >= 8)          score++;
        if (/[A-Z]/.test(password))        score++;
        if (/[a-z]/.test(password))        score++;
        if (/[0-9]/.test(password))        score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }

    // ── Submit del formulario ─────────────────────────────────────────────────
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const firstName       = document.getElementById('firstName').value.trim();
        const lastName        = document.getElementById('lastName').value.trim();
        const email           = document.getElementById('email').value.trim();
        const password        = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms           = document.getElementById('terms').checked;

        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');

        // Validaciones
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showError('Por favor, completa todos los campos'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Ingresa un correo electrónico válido'); return;
        }
        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres'); return;
        }
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden'); return;
        }
        if (!terms) {
            showError('Debes aceptar los Términos y Condiciones y autorizar el tratamiento de datos (Habeas Data).'); return;
        }

        setLoading(true);

        try {
            // Verificar que el servidor esté disponible
            const serverUp = await window.apiClient.isServerUp();
            if (!serverUp) {
                showError('No se puede conectar al servidor. Verifica que XAMPP y Node.js estén corriendo.');
                setLoading(false);
                return;
            }

            // Registro contra MySQL con consentimiento legal registrado
            const result = await window.apiClient.register({ 
                firstName, 
                lastName, 
                email, 
                password,
                habeasDataAccepted: true,
                termsAccepted: true,
                acceptedAt: new Date().toISOString()
            });

            if (!result) {
                showError('Error al conectar con la base de datos. Intenta de nuevo.');
                setLoading(false);
                return;
            }

            if (!result.success) {
                showError(result.message || 'Error al crear la cuenta');
                setLoading(false);
                return;
            }

            // Guardar sesión automáticamente tras el registro
            sessionStorage.setItem('rdslp_user', JSON.stringify({
                ...result.user,
                loginTime: new Date().toISOString()
            }));

            console.log('Cuenta creada en MySQL:', result.user.name);
            showSuccess('¡Cuenta creada! Redirigiendo...');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);

        } catch (err) {
            console.error('Error en registro:', err);
            showError('Error inesperado. Verifica que el servidor esté corriendo.');
            setLoading(false);
        }
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
        registerForm.style.animation = 'shake 0.5s ease';
        setTimeout(() => { registerForm.style.animation = ''; }, 500);
    }

    function showSuccess(message) {
        successText.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    function setLoading(loading) {
        btnRegister.disabled    = loading;
        btnRegister.textContent = loading ? 'Creando cuenta...' : 'Crear Cuenta';
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
