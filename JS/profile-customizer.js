/* =====================================================
   RDSLP - Personalizador de Avatar y Portada de Perfil
   Permite subir fotos desde el dispositivo, URLs o elegir
   diseños predefinidos. Sincronizado en la nube (Supabase).
===================================================== */

(function () {
    const STORAGE_KEY = 'rdslp_profile_customizations';

    const COVER_PRESETS = [
        { name: 'Aurora Original', value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', isGradient: true },
        { name: 'Cyberpunk Neon', value: 'linear-gradient(135deg, #ff007a 0%, #7928ca 50%, #4338ca 100%)', isGradient: true },
        { name: 'Noche Profunda', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', isGradient: true },
        { name: 'Matrix Emerald', value: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #10b981 100%)', isGradient: true },
        { name: 'Carbon Minimal', value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)', isGradient: true },
        { name: 'Ocean Tech', value: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #1d4ed8 100%)', isGradient: true },
        { name: 'Circuitos', value: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', isGradient: false },
        { name: 'Espacio Exterior', value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', isGradient: false },
        { name: 'Código Binario', value: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', isGradient: false },
        { name: 'Setup Hacker', value: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80', isGradient: false }
    ];

    const AVATAR_PRESETS = [
        { type: 'emoji', value: '👨‍💻', label: 'Programador' },
        { type: 'emoji', value: '👩‍💻', label: 'Programadora' },
        { type: 'emoji', value: '🤖', label: 'Cyborg Bot' },
        { type: 'emoji', value: '🧑‍🚀', label: 'Astronauta' },
        { type: 'emoji', value: '🥷', label: 'Ninja Dev' },
        { type: 'emoji', value: '⚡', label: 'Rayo Tech' },
        { type: 'image', value: 'https://api.dicebear.com/7.x/bottts/svg?seed=CoderX', label: 'Robot 1' },
        { type: 'image', value: 'https://api.dicebear.com/7.x/bottts/svg?seed=MatrixBot', label: 'Robot 2' },
        { type: 'image', value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexDev', label: 'Avatar Alex' },
        { type: 'image', value: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JordanDev', label: 'Avatar Jordan' }
    ];

    const ProfileCustomizer = {
        getCustomizationsMap: function () {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            } catch (e) {
                return {};
            }
        },

        getUserCustomization: function (userId, userName) {
            const map = this.getCustomizationsMap();
            const uId = userId ? String(userId) : '';
            const uName = userName ? String(userName).trim().toLowerCase() : '';

            if (uId && map[uId]) return map[uId];
            if (uName && map[uName]) return map[uName];

            // Revisar si es el usuario actual logueado
            const current = this.getCurrentUser();
            if (current) {
                const isCurrent = (uId && String(current.id) === uId) || (uName && current.name && current.name.trim().toLowerCase() === uName);
                if (isCurrent && (current.avatar || current.cover)) {
                    return { avatar: current.avatar || null, cover: current.cover || null };
                }
            }

            return { avatar: null, cover: null };
        },

        getCurrentUser: function () {
            try {
                if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
                    const u = window.authManager.getCurrentUser();
                    if (u) return u;
                }
                return JSON.parse(localStorage.getItem('rdslp_user') || sessionStorage.getItem('rdslp_user') || 'null');
            } catch (e) {
                return null;
            }
        },

        saveUserCustomization: async function (customData) {
            const current = this.getCurrentUser();
            if (!current) return { success: false, message: 'Debes iniciar sesión' };

            const uId = String(current.id || current.name);
            const uName = (current.name || 'Usuario').trim().toLowerCase();

            // 1. Actualizar objeto usuario actual
            if (customData.avatar !== undefined) current.avatar = customData.avatar;
            if (customData.cover !== undefined) current.cover = customData.cover;

            try {
                localStorage.setItem('rdslp_user', JSON.stringify(current));
                sessionStorage.setItem('rdslp_user', JSON.stringify(current));
            } catch (e) {}

            // 2. Actualizar mapa local de personalizaciones
            const map = this.getCustomizationsMap();
            const entry = {
                userId: uId,
                userName: current.name || 'Usuario',
                avatar: current.avatar || null,
                cover: current.cover || null,
                updatedAt: new Date().toISOString()
            };

            map[uId] = entry;
            map[uName] = entry;

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
            } catch (e) {}

            // 3. Sincronizar en Supabase para todos los dispositivos
            this.syncCloudCustomization(entry);

            // 4. Disparar eventos para actualizar todas las vistas
            window.dispatchEvent(new CustomEvent('rdslp_customization_updated', { detail: entry }));
            window.dispatchEvent(new CustomEvent('rdslp_user_updated', { detail: current }));

            return { success: true, customization: entry };
        },

        syncCloudCustomization: async function (entry) {
            try {
                if (!window.rdslpSupabase || typeof window.rdslpSupabase.getClient !== 'function') return;
                const client = await window.rdslpSupabase.getClient();
                if (!client) return;

                // Subir como evento en la tabla mensajes (chat_id = '__PROFILE_CUSTOM__')
                await client.from('mensajes').insert([{
                    chat_id: '__PROFILE_CUSTOM__',
                    author_id: String(entry.userId),
                    author_name: entry.userName,
                    text: JSON.stringify(entry)
                }]);

                // Intentar actualizar también en la tabla perfiles si existe
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(entry.userId))) {
                    try {
                        await client.from('perfiles').update({
                            avatar: entry.avatar,
                            cover: entry.cover
                        }).eq('id', entry.userId);
                    } catch (errP) {}
                }
            } catch (e) {
                console.warn('[RDSLP] Error sincronizando personalización en Supabase:', e);
            }
        },

        loadCloudCustomizations: async function () {
            try {
                if (!window.rdslpSupabase || typeof window.rdslpSupabase.getClient !== 'function') return;
                const client = await window.rdslpSupabase.getClient();
                if (!client) return;

                const { data, error } = await client
                    .from('mensajes')
                    .select('*')
                    .eq('chat_id', '__PROFILE_CUSTOM__')
                    .order('created_at', { ascending: true });

                if (!error && Array.isArray(data)) {
                    const map = this.getCustomizationsMap();
                    data.forEach(item => {
                        try {
                            const parsed = JSON.parse(item.text);
                            if (parsed && (parsed.userId || parsed.userName)) {
                                if (parsed.userId) map[String(parsed.userId)] = parsed;
                                if (parsed.userName) map[String(parsed.userName).trim().toLowerCase()] = parsed;
                            }
                        } catch (e) {}
                    });

                    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
                    window.dispatchEvent(new CustomEvent('rdslp_customization_updated'));
                }
            } catch (e) {
                console.warn('[RDSLP] Error cargando personalizaciones de Supabase:', e);
            }
        },

        // Comprimir imagen usando Canvas para ahorrar ancho de banda y almacenamiento
        compressImage: function (file, maxWidth, maxHeight, quality = 0.85) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    reject(new Error('Archivo no es una imagen válida'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        let w = img.width;
                        let h = img.height;

                        if (w > maxWidth || h > maxHeight) {
                            const ratio = Math.min(maxWidth / w, maxHeight / h);
                            w = Math.round(w * ratio);
                            h = Math.round(h * ratio);
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, w, h);

                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = () => reject(new Error('Error procesando imagen'));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Error leyendo archivo'));
                reader.readAsDataURL(file);
            });
        },

        // Aplicar estilos a la portada y avatar en el modal
        applyCustomizationToElement: function (coverEl, avatarEl, customData, fallbackInitial = 'U') {
            const customs = customData || {};

            // 1. Portada (Cover)
            if (coverEl) {
                if (customs.cover) {
                    if (customs.cover.startsWith('linear-gradient') || customs.cover.startsWith('radial-gradient')) {
                        coverEl.style.backgroundImage = 'none';
                        coverEl.style.background = customs.cover;
                    } else {
                        coverEl.style.backgroundImage = `url("${customs.cover}")`;
                        coverEl.style.backgroundSize = 'cover';
                        coverEl.style.backgroundPosition = 'center';
                        coverEl.style.backgroundRepeat = 'no-repeat';
                    }
                } else {
                    coverEl.style.backgroundImage = 'none';
                    coverEl.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)';
                }
            }

            // 2. Avatar
            if (avatarEl) {
                if (customs.avatar) {
                    if (customs.avatar.startsWith('data:image') || customs.avatar.startsWith('http://') || customs.avatar.startsWith('https://')) {
                        avatarEl.innerHTML = `
                            <img src="${customs.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">
                        `;
                    } else {
                        // Emoji o Inicial estilizada
                        avatarEl.innerHTML = `<span style="font-size: 38px; line-height: 1;">${customs.avatar}</span>`;
                    }
                } else {
                    avatarEl.innerHTML = `<span style="font-size: 38px; font-weight: 800; line-height: 1;">${(fallbackInitial || 'U').toUpperCase()}</span>`;
                }
            }
        },

        // =====================================================
        // MODAL INTERACTIVO DE PERSONALIZACIÓN
        // =====================================================
        openCustomizerModal: function (type) {
            let modal = document.getElementById('rdslpCustomizerModal');
            if (!modal) {
                modal = this.createCustomizerModal();
            }

            this.activeType = type; // 'cover' | 'avatar'
            this.selectedVal = null;

            const titleEl = modal.querySelector('#customizerModalTitle');
            const previewEl = modal.querySelector('#customizerPreviewContent');
            const presetsGrid = modal.querySelector('#customizerPresetsGrid');

            if (type === 'cover') {
                titleEl.textContent = '🎨 Personalizar Foto de Fondo / Portada';
                previewEl.className = 'customizer-preview cover-mode';
                this.renderCoverPresets(presetsGrid);
            } else {
                titleEl.textContent = '🖼️ Personalizar Foto de Perfil / Avatar';
                previewEl.className = 'customizer-preview avatar-mode';
                this.renderAvatarPresets(presetsGrid);
            }

            this.updatePreview(null);
            modal.classList.add('active');
        },

        renderCoverPresets: function (container) {
            container.innerHTML = COVER_PRESETS.map((p, idx) => {
                const bgStyle = p.isGradient ? `background: ${p.value};` : `background: url('${p.value}') center/cover;`;
                return `
                    <div class="preset-card cover-preset" onclick="window.rdslpCustomizer.selectPreset('${p.value}', this)" style="${bgStyle}" title="${p.name}">
                        <span>${p.name}</span>
                    </div>
                `;
            }).join('');
        },

        renderAvatarPresets: function (container) {
            container.innerHTML = AVATAR_PRESETS.map((p, idx) => {
                const inner = p.type === 'image'
                    ? `<img src="${p.value}" alt="${p.label}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                    : `<span style="font-size: 28px;">${p.value}</span>`;
                return `
                    <div class="preset-card avatar-preset" onclick="window.rdslpCustomizer.selectPreset('${p.value}', this)" title="${p.label}">
                        ${inner}
                    </div>
                `;
            }).join('');
        },

        selectPreset: function (val, el) {
            this.selectedVal = val;
            document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
            if (el) el.classList.add('selected');
            this.updatePreview(val);
        },

        updatePreview: function (val) {
            const preview = document.getElementById('customizerPreviewBox');
            if (!preview) return;

            if (this.activeType === 'cover') {
                if (val) {
                    if (val.startsWith('linear-gradient')) {
                        preview.style.background = val;
                        preview.style.backgroundImage = 'none';
                    } else {
                        preview.style.backgroundImage = `url("${val}")`;
                        preview.style.backgroundSize = 'cover';
                        preview.style.backgroundPosition = 'center';
                    }
                } else {
                    preview.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)';
                    preview.style.backgroundImage = 'none';
                }
            } else {
                if (val) {
                    if (val.startsWith('data:image') || val.startsWith('http')) {
                        preview.innerHTML = `<img src="${val}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        preview.innerHTML = `<span style="font-size: 34px;">${val}</span>`;
                    }
                } else {
                    const current = this.getCurrentUser();
                    preview.innerHTML = `<span style="font-size: 34px; font-weight: 700;">${(current?.name?.charAt(0) || 'U').toUpperCase()}</span>`;
                }
            }
        },

        createCustomizerModal: function () {
            const modal = document.createElement('div');
            modal.id = 'rdslpCustomizerModal';
            modal.className = 'customizer-modal-overlay';
            modal.innerHTML = `
                <div class="customizer-modal-box">
                    <div class="customizer-modal-top">
                        <h3 id="customizerModalTitle" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">Personalizar</h3>
                        <button type="button" class="btn-close-customizer" onclick="document.getElementById('rdslpCustomizerModal').classList.remove('active')">&times;</button>
                    </div>

                    <!-- Vista previa en vivo -->
                    <div class="customizer-preview-container" id="customizerPreviewContent">
                        <div class="customizer-preview-box" id="customizerPreviewBox"></div>
                    </div>

                    <!-- Pestañas de origen -->
                    <div class="customizer-tabs">
                        <button type="button" class="c-tab active" data-tab="upload" onclick="window.rdslpCustomizer.switchTab('upload')">📁 Subir Archivo</button>
                        <button type="button" class="c-tab" data-tab="presets" onclick="window.rdslpCustomizer.switchTab('presets')">✨ Galería</button>
                        <button type="button" class="c-tab" data-tab="url" onclick="window.rdslpCustomizer.switchTab('url')">🔗 Enlace URL</button>
                    </div>

                    <div class="customizer-tab-body">
                        <!-- Tab Subir -->
                        <div class="c-tab-panel active" id="cTabUpload">
                            <div class="drop-zone" id="customizerDropZone" onclick="document.getElementById('customizerFileInput').click()">
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 6px; color: var(--accent-primary);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                <p style="margin: 0; font-weight: 600; font-size: 13px;">Haz clic o arrastra tu imagen aquí</p>
                                <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Soporta PNG, JPG, WEBP (optimización automática)</span>
                            </div>
                            <input type="file" id="customizerFileInput" accept="image/*" style="display: none;">
                        </div>

                        <!-- Tab Presets -->
                        <div class="c-tab-panel" id="cTabPresets" style="display: none;">
                            <div class="presets-grid" id="customizerPresetsGrid"></div>
                        </div>

                        <!-- Tab URL -->
                        <div class="c-tab-panel" id="cTabUrl" style="display: none;">
                            <div style="display: flex; gap: 8px;">
                                <input type="url" id="customizerUrlInput" placeholder="https://ejemplo.com/imagen.jpg" style="flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary); font-size: 13px;">
                                <button type="button" class="btn-primary" onclick="window.rdslpCustomizer.handleUrlInput()" style="padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">Probar</button>
                            </div>
                        </div>
                    </div>

                    <div class="customizer-modal-actions">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('rdslpCustomizerModal').classList.remove('active')">Cancelar</button>
                        <button type="button" class="btn-primary" id="btnSaveCustomization" onclick="window.rdslpCustomizer.saveSelection()">Guardar Cambios</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Listener de archivo
            const fileInput = modal.querySelector('#customizerFileInput');
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const isCover = ProfileCustomizer.activeType === 'cover';
                    const maxW = isCover ? 1200 : 200;
                    const maxH = isCover ? 450 : 200;
                    const compressed = await ProfileCustomizer.compressImage(file, maxW, maxH, 0.85);

                    ProfileCustomizer.selectedVal = compressed;
                    ProfileCustomizer.updatePreview(compressed);
                } catch (err) {
                    alert('Error cargando imagen: ' + err.message);
                }
            });

            // Drag and Drop
            const dropZone = modal.querySelector('#customizerDropZone');
            ['dragenter', 'dragover'].forEach(name => {
                dropZone.addEventListener(name, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('dragover');
                });
            });
            ['dragleave', 'drop'].forEach(name => {
                dropZone.addEventListener(name, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                });
            });
            dropZone.addEventListener('drop', async (e) => {
                const file = e.dataTransfer.files[0];
                if (file) {
                    try {
                        const isCover = ProfileCustomizer.activeType === 'cover';
                        const maxW = isCover ? 1200 : 200;
                        const maxH = isCover ? 450 : 200;
                        const compressed = await ProfileCustomizer.compressImage(file, maxW, maxH, 0.85);
                        ProfileCustomizer.selectedVal = compressed;
                        ProfileCustomizer.updatePreview(compressed);
                    } catch (err) {
                        alert('Error cargando imagen: ' + err.message);
                    }
                }
            });

            return modal;
        },

        switchTab: function (tabName) {
            document.querySelectorAll('.c-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
            document.getElementById('cTabUpload').style.display = tabName === 'upload' ? 'block' : 'none';
            document.getElementById('cTabPresets').style.display = tabName === 'presets' ? 'block' : 'none';
            document.getElementById('cTabUrl').style.display = tabName === 'url' ? 'block' : 'none';
        },

        handleUrlInput: function () {
            const input = document.getElementById('customizerUrlInput');
            const url = input ? input.value.trim() : '';
            if (!url) return;
            this.selectedVal = url;
            this.updatePreview(url);
        },

        saveSelection: async function () {
            if (!this.selectedVal) {
                alert('Selecciona o sube una imagen primero.');
                return;
            }

            const btnSave = document.getElementById('btnSaveCustomization');
            if (btnSave) {
                btnSave.disabled = true;
                btnSave.textContent = 'Guardando...';
            }

            const payload = {};
            if (this.activeType === 'cover') {
                payload.cover = this.selectedVal;
            } else {
                payload.avatar = this.selectedVal;
            }

            const res = await this.saveUserCustomization(payload);
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.textContent = 'Guardar Cambios';
            }

            if (res.success) {
                document.getElementById('rdslpCustomizerModal')?.classList.remove('active');
            } else {
                alert(res.message || 'Error guardando personalización');
            }
        }
    };

    // Auto-cargar en segundo plano al iniciar
    document.addEventListener('DOMContentLoaded', () => {
        ProfileCustomizer.loadCloudCustomizations();
        setInterval(() => ProfileCustomizer.loadCloudCustomizations(), 10000);
    });

    window.rdslpCustomizer = ProfileCustomizer;
})();
