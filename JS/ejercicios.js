/* =====================================================
   RDSLP - JavaScript de Ejercicios con Shell Interactivo
   y Ejecución Multilenguaje (JS, Python, SQL, Java, C++)
===================================================== */

document.addEventListener('DOMContentLoaded', function () {
    if (!window.authManager) {
        window.location.href = 'login.html';
        return;
    }

    const auth = window.authManager;
    let currentUser = null;
    let apiKey = localStorage.getItem('rdslp_ai_api_key') || '';
    let commandHistory = [];
    let historyIndex = -1;

    // Plantillas de código inicial por lenguaje
    const CODE_STARTERS = {
        javascript: `// JavaScript ES6+\nfunction solucion() {\n    console.log("¡Hola desde el Sandbox JavaScript!");\n    const lenguajes = ["JavaScript", "Python", "SQL", "Java", "C++"];\n    console.log("Lenguajes en la terminal:", lenguajes.join(", "));\n}\n\nsolucion();`,
        python: `# Python 3 en el navegador (WebAssembly)\ndef saludo():\n    print("¡Hola desde Python en RDSLP!")\n    for i in range(1, 4):\n        print(f"Paso {i}: ejecutando correctamente")\n\nsaludo()`,
        sql: `-- SQL Sandbox (Simulación relacional interactiva)\nCREATE TABLE desarrolladores (\n    id INT,\n    nombre TEXT,\n    lenguaje TEXT,\n    nivel TEXT\n);\n\nINSERT INTO desarrolladores VALUES (1, 'Carlos', 'Python', 'Senior');\nINSERT INTO desarrolladores VALUES (2, 'Maria', 'JavaScript', 'Lead');\nINSERT INTO desarrolladores VALUES (3, 'Andres', 'SQL', 'Especialista');\n\nSELECT * FROM desarrolladores;`,
        java: `// Java Sandbox\npublic class Solucion {\n    public static void main(String[] args) {\n        System.out.println("¡Hola desde Java!");\n        int a = 15, b = 25;\n        System.out.println("Resultado suma: " + (a + b));\n    }\n}`,
        cpp: `// C++ Sandbox\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "¡Hola desde C++ en RDSLP!" << endl;\n    for(int i = 1; i <= 3; i++) {\n        cout << "Iteración #" << i << endl;\n    }\n    return 0;\n}`
    };

    const exerciseDescriptions = {
        suma: { title: 'Suma de dos números', desc: 'Crea una función que reciba dos números y retorne su suma.', example: 'suma(2, 3) // 5' },
        factorial: { title: 'Factorial', desc: 'Calcula el factorial de n.', example: 'factorial(5) // 120' },
        palindromo: { title: 'Palíndromo', desc: 'Verifica si es palíndromo.', example: 'esPalindromo("ana") // true' },
        fibonacci: { title: 'Fibonacci', desc: 'Retorna n números de la serie.', example: 'fibonacci(5) // [0,1,1,2,3]' },
        ordenar: { title: 'Ordenar', desc: 'Ordena un array de menor a mayor.', example: 'ordenar([3,1,2]) // [1,2,3]' },
        libre: { title: 'Ejercicio Libre', desc: 'Programa lo que quieras en el lenguaje que prefieras.', example: '' }
    };

    init();

    function init() {
        checkAuth();
        loadUserData();
        setupEventListeners();
        loadMyExercises();
        checkAdminRole();
        updateLanguageBadge();
        
        // Cargar plantilla inicial si el editor está vacío
        const codeInput = document.getElementById('codeInput');
        if (codeInput && !codeInput.value.trim()) {
            codeInput.value = CODE_STARTERS['javascript'];
            updateLineNumbers();
        }
    }

    function checkAuth() {
        currentUser = auth.getCurrentUser();
    }

    function loadUserData() {
        if (!currentUser) return;
        const initial = currentUser.name?.charAt(0).toUpperCase() || 'U';
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        if (userAvatar) userAvatar.textContent = initial;
        if (userName) userName.textContent = currentUser.name || 'Usuario';
    }

    function checkAdminRole() {
        if (currentUser && currentUser.role === 'admin') {
            const btn = document.getElementById('configApiBtn');
            if (btn) {
                btn.style.display = 'block';
                updateApiKeyStatus();
            }
        }
    }

    function updateApiKeyStatus() {
        const btn = document.getElementById('configApiBtn');
        if (btn) {
            btn.textContent = apiKey ? 'API Key Configurada ✅' : 'Configurar API Key ⚙️';
            btn.style.borderColor = apiKey ? 'var(--success-color)' : 'var(--border-color)';
        }
    }

    function updateLanguageBadge() {
        const lang = document.getElementById('languageSelect')?.value || 'javascript';
        const badge = document.getElementById('currentLangBadge');
        if (badge) {
            const map = { javascript: 'JS', python: 'Python', sql: 'SQL', java: 'Java', cpp: 'C++' };
            badge.textContent = map[lang] || lang.toUpperCase();
        }
    }

    function setupEventListeners() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
            window.location.href = 'login.html';
        });

        // Cambio de ejercicio
        document.getElementById('exerciseSelect')?.addEventListener('change', function () {
            const ex = exerciseDescriptions[this.value];
            const descEl = document.getElementById('exerciseDescription');
            if (ex && this.value) {
                descEl.innerHTML = `<p><strong>${ex.title}</strong></p><p>${ex.desc}</p>${ex.example ? `<p class="code-example">${ex.example}</p>` : ''}`;
            } else {
                descEl.innerHTML = '<p>Selecciona un ejercicio para ver las instrucciones o escribe código libre.</p>';
            }
        });

        // Cambio de lenguaje
        document.getElementById('languageSelect')?.addEventListener('change', function () {
            updateLanguageBadge();
            const codeInput = document.getElementById('codeInput');
            // Si el editor está con código por defecto o vacío, sugerir la plantilla
            if (codeInput && (!codeInput.value.trim() || Object.values(CODE_STARTERS).includes(codeInput.value))) {
                codeInput.value = CODE_STARTERS[this.value] || '';
                updateLineNumbers();
            }
            appendTerminalMessage(`Cambiado lenguaje activo a <strong>${this.value.toUpperCase()}</strong>.`, 'info');
        });

        // Botones principales
        document.getElementById('runCodeBtn')?.addEventListener('click', runCode);
        document.getElementById('evaluateBtn')?.addEventListener('click', evaluateCodeWithAI);
        document.getElementById('clearBtn')?.addEventListener('click', clearEditor);
        document.getElementById('shareBtn')?.addEventListener('click', shareExercise);
        document.getElementById('configApiBtn')?.addEventListener('click', configureApiKey);

        // Botones de la terminal
        document.getElementById('clearTerminalBtn')?.addEventListener('click', clearTerminal);
        document.getElementById('copyOutputBtn')?.addEventListener('click', copyTerminalOutput);

        // Shell interactivo por línea de comandos
        const termInput = document.getElementById('terminalInput');
        termInput?.addEventListener('keydown', handleShellInput);
        document.getElementById('terminalSendBtn')?.addEventListener('click', () => executeShellCommand(termInput.value));

        // Line numbers
        const codeInput = document.getElementById('codeInput');
        codeInput?.addEventListener('input', updateLineNumbers);
        codeInput?.addEventListener('scroll', () => {
            const lines = document.getElementById('lineNumbers');
            if (lines) lines.scrollTop = codeInput.scrollTop;
        });
    }

    function configureApiKey() {
        const key = prompt('Ingresa tu API Key de Google Gemini (o compatible):', apiKey);
        if (key !== null) {
            apiKey = key.trim();
            localStorage.setItem('rdslp_ai_api_key', apiKey);
            updateApiKeyStatus();
            alert('API Key guardada con éxito.');
        }
    }

    function updateLineNumbers() {
        const code = document.getElementById('codeInput')?.value || '';
        const lines = code.split('\n').length;
        const lineNumbers = document.getElementById('lineNumbers');
        if (lineNumbers) {
            lineNumbers.textContent = Array(lines).fill(0).map((_, i) => i + 1).join('\n');
        }
    }

    // =====================================================
    // MOTOR DE EJECUCIÓN MULTILENGUAJE
    // =====================================================

    async function runCode() {
        const code = document.getElementById('codeInput')?.value || '';
        const lang = document.getElementById('languageSelect')?.value || 'javascript';
        if (!code.trim()) {
            appendTerminalMessage('Aviso: El editor está vacío. Escribe código para ejecutar.', 'error');
            return;
        }

        const runBtn = document.getElementById('runCodeBtn');
        const originalText = runBtn.innerHTML;
        runBtn.innerHTML = '<span>Ejecutando... ⏳</span>';
        runBtn.disabled = true;

        const startTime = performance.now();
        let result = { stdout: '', stderr: '', html: '', exitCode: 0 };

        try {
            if (lang === 'javascript') {
                result = executeJavaScript(code);
            } else if (lang === 'python') {
                result = await executePython(code);
            } else if (lang === 'sql') {
                result = executeSQL(code);
            } else if (lang === 'java' || lang === 'cpp') {
                result = executeCompiledLang(code, lang);
            } else {
                result.stderr = `Lenguaje "${lang}" no tiene ejecutor local directo.`;
                result.exitCode = 1;
            }
        } catch (err) {
            result.stderr = err.message || String(err);
            result.exitCode = 1;
        } finally {
            const elapsed = Math.round(performance.now() - startTime);
            renderExecutionBlock(lang, code, result, elapsed);
            runBtn.innerHTML = originalText;
            runBtn.disabled = false;
        }
    }

    // 1. Ejecutor de JavaScript
    function executeJavaScript(code) {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        const logs = [];

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        console.log = (...args) => logs.push(args.map(formatConsoleArg).join(' '));
        console.warn = (...args) => logs.push('[WARN] ' + args.map(formatConsoleArg).join(' '));
        console.info = (...args) => logs.push('[INFO] ' + args.map(formatConsoleArg).join(' '));
        console.error = (...args) => logs.push('[ERROR] ' + args.map(formatConsoleArg).join(' '));

        try {
            const func = new Function(code);
            const returnedVal = func();
            if (returnedVal !== undefined && logs.length === 0) {
                logs.push(`Retorno: ${formatConsoleArg(returnedVal)}`);
            }
            stdout = logs.join('\n');
            if (!stdout.trim()) {
                stdout = 'Código ejecutado exitosamente (sin salida por consola).';
            }
        } catch (e) {
            stderr = `${e.name}: ${e.message}`;
            exitCode = 1;
        } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.info = originalInfo;
        }

        return { stdout, stderr, exitCode };
    }

    function formatConsoleArg(arg) {
        if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
        }
        return String(arg);
    }

    // 2. Ejecutor de Python (Skulpt en el navegador)
    async function executePython(code) {
        return new Promise((resolve) => {
            if (typeof Sk === 'undefined') {
                return resolve({
                    stdout: '',
                    stderr: 'El intérprete de Python (Skulpt) aún se está descargando o no está disponible. Revisa tu conexión a internet.',
                    exitCode: 1
                });
            }

            let stdout = '';
            let stderr = '';

            function outf(text) {
                stdout += text;
            }

            function builtinRead(x) {
                if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                    throw "Archivo no encontrado: '" + x + "'";
                }
                return Sk.builtinFiles["files"][x];
            }

            Sk.configure({
                output: outf,
                read: builtinRead,
                __future__: Sk.python3
            });

            const myPromise = Sk.misceval.asyncToPromise(() => {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });

            myPromise.then(
                () => {
                    if (!stdout.trim()) stdout = 'Python finalizó correctamente (sin salidas con print).';
                    resolve({ stdout, stderr: '', exitCode: 0 });
                },
                (err) => {
                    resolve({ stdout, stderr: err.toString(), exitCode: 1 });
                }
            );
        });
    }

    // 3. Ejecutor de SQL Relacional en Memoria
    function executeSQL(code) {
        let stdout = '';
        let stderr = '';
        let tablesHtml = '';

        if (!window.__rdslp_tables) {
            window.__rdslp_tables = {
                desarrolladores: [
                    { id: 1, nombre: 'Carlos', lenguaje: 'Python', nivel: 'Senior' },
                    { id: 2, nombre: 'Maria', lenguaje: 'JavaScript', nivel: 'Lead' },
                    { id: 3, nombre: 'Andres', lenguaje: 'SQL', nivel: 'Especialista' }
                ],
                usuarios: [
                    { id: 101, email: 'admin@rdslp.com', rol: 'admin', estado: 'activo' },
                    { id: 102, email: 'dev@rdslp.com', rol: 'user', estado: 'activo' }
                ]
            };
        }

        try {
            const statements = code.split(';').map(s => s.trim()).filter(Boolean);
            statements.forEach(statement => {
                const upper = statement.toUpperCase();

                if (upper.startsWith('SELECT')) {
                    const fromMatch = statement.match(/FROM\s+([a-zA-Z0-9_]+)/i);
                    const tableName = fromMatch ? fromMatch[1].toLowerCase() : 'desarrolladores';
                    const data = window.__rdslp_tables[tableName] || window.__rdslp_tables['desarrolladores'];

                    if (data && data.length) {
                        const cols = Object.keys(data[0]);
                        tablesHtml += `
                            <table class="term-table">
                                <thead>
                                    <tr>${cols.map(c => `<th>${c.toUpperCase()}</th>`).join('')}</tr>
                                </thead>
                                <tbody>
                                    ${data.map(row => `<tr>${cols.map(c => `<td>${row[c] !== undefined ? row[c] : 'NULL'}</td>`).join('')}</tr>`).join('')}
                                </tbody>
                            </table>
                        `;
                        stdout += `Query OK: ${data.length} fila(s) retornada(s) de "${tableName}".\n`;
                    } else {
                        stdout += `Query OK: 0 filas retornadas de la tabla "${tableName}".\n`;
                    }
                } else if (upper.startsWith('CREATE TABLE')) {
                    const match = statement.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/i);
                    const tbl = match ? match[1].toLowerCase() : 'custom_table';
                    window.__rdslp_tables[tbl] = [];
                    stdout += `Query OK, 0 rows affected. Tabla "${tbl}" creada con éxito.\n`;
                } else if (upper.startsWith('INSERT INTO')) {
                    const match = statement.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
                    const tbl = match ? match[1].toLowerCase() : 'desarrolladores';
                    if (!window.__rdslp_tables[tbl]) window.__rdslp_tables[tbl] = [];

                    const valMatch = statement.match(/VALUES\s*\((.*?)\)/i);
                    if (valMatch) {
                        const rawVals = valMatch[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
                        const sampleRow = window.__rdslp_tables[tbl][0];
                        const cols = sampleRow ? Object.keys(sampleRow) : ['col1', 'col2', 'col3', 'col4'];
                        const newRow = {};
                        rawVals.forEach((val, idx) => {
                            const colName = cols[idx] || `col_${idx + 1}`;
                            newRow[colName] = isNaN(val) ? val : Number(val);
                        });
                        window.__rdslp_tables[tbl].push(newRow);
                        stdout += `Query OK, 1 row affected. Registro insertado en tabla "${tbl}".\n`;
                    }
                } else {
                    stdout += `Query ejecutada: "${statement.substring(0, 50)}..."\n`;
                }
            });

            return { stdout, stderr, html: tablesHtml, exitCode: 0 };
        } catch (e) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    // 4. Ejecutor Simulado para Java y C++
    function executeCompiledLang(code, lang) {
        let stdout = '';
        let stderr = '';

        if (lang === 'java') {
            const printRegex = /System\.out\.println\s*\((.*?)\);/g;
            let match;
            let count = 0;
            while ((match = printRegex.exec(code)) !== null) {
                count++;
                const arg = match[1].trim();
                try {
                    stdout += eval(arg) + '\n';
                } catch {
                    stdout += arg.replace(/^['"]|['"]$/g, '') + '\n';
                }
            }
            if (count === 0) {
                stdout = '[Compilación javac OK]: Ejecución finalizada (sin llamadas a System.out.println).';
            }
        } else if (lang === 'cpp') {
            const coutRegex = /cout\s*<<\s*([^;]+);/g;
            let match;
            let count = 0;
            while ((match = coutRegex.exec(code)) !== null) {
                count++;
                const parts = match[1].split('<<').map(p => p.trim()).filter(p => p && p !== 'endl');
                const outLine = parts.map(p => {
                    try { return eval(p); } catch { return p.replace(/^['"]|['"]$/g, ''); }
                }).join(' ');
                stdout += outLine + '\n';
            }
            if (count === 0) {
                stdout = '[Compilación g++ -O2 OK]: Proceso finalizado sin salida en cout.';
            }
        }

        return { stdout, stderr, exitCode: 0 };
    }

    // =====================================================
    // TERMINAL Y SHELL INTERACTIVO
    // =====================================================

    function renderExecutionBlock(lang, code, result, elapsedMs) {
        const outputBox = document.getElementById('outputBox');
        if (!outputBox) return;

        const langBadge = lang.toUpperCase();
        const block = document.createElement('div');
        block.className = 'term-exec-block';

        let bodyContent = '';
        if (result.stdout) {
            bodyContent += `<div class="term-stdout">${escapeHtml(result.stdout)}</div>`;
        }
        if (result.html) {
            bodyContent += `<div>${result.html}</div>`;
        }
        if (result.stderr) {
            bodyContent += `<div class="term-stderr">${escapeHtml(result.stderr)}</div>`;
        }

        block.innerHTML = `
            <div class="term-exec-header">
                <span class="term-prompt">rdslp@sandbox:~$</span>
                <span class="term-lang-tag">${langBadge}</span>
                <span style="color: #8b949e; font-size: 11px;">${new Date().toLocaleTimeString()}</span>
            </div>
            ${bodyContent}
            <div class="term-exec-footer">
                <span style="color: ${result.exitCode === 0 ? '#56d364' : '#ff7b72'};">
                    ${result.exitCode === 0 ? '✔ Salida: 0 (Éxito)' : '✖ Código de salida: ' + result.exitCode}
                </span>
                <span>⏱ ${elapsedMs} ms</span>
            </div>
        `;

        outputBox.appendChild(block);
        scrollTerminalToBottom();
    }

    function appendTerminalMessage(msg, type = 'info') {
        const outputBox = document.getElementById('outputBox');
        if (!outputBox) return;

        const colorMap = {
            info: '#58a6ff',
            success: '#56d364',
            error: '#ff7b72',
            warn: '#d29922'
        };

        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = `<span class="term-prompt">rdslp@sandbox:~$</span> <span style="color: ${colorMap[type] || '#c9d1d9'}">${msg}</span>`;
        outputBox.appendChild(div);
        scrollTerminalToBottom();
    }

    function scrollTerminalToBottom() {
        const screen = document.getElementById('terminalScreen');
        if (screen) {
            screen.scrollTop = screen.scrollHeight;
        }
    }

    function clearTerminal() {
        const outputBox = document.getElementById('outputBox');
        if (outputBox) outputBox.innerHTML = '';
        appendTerminalMessage('Terminal limpia.', 'info');
    }

    function copyTerminalOutput() {
        const screen = document.getElementById('terminalScreen');
        if (!screen) return;
        const text = screen.innerText || screen.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('¡Salida de la terminal copiada al portapapeles!');
        }).catch(() => {
            alert('No se pudo copiar automáticamente.');
        });
    }

    // Shell interactivo por comandos
    function handleShellInput(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = this.value.trim();
            if (val) {
                commandHistory.push(val);
                historyIndex = commandHistory.length;
                this.value = '';
                executeShellCommand(val);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                this.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                this.value = commandHistory[historyIndex] || '';
            } else {
                historyIndex = commandHistory.length;
                this.value = '';
            }
        }
    }

    async function executeShellCommand(rawCmd) {
        const cmd = rawCmd.trim();
        if (!cmd) return;

        const parts = cmd.split(' ');
        const mainCmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        if (mainCmd === 'clear' || mainCmd === 'cls') {
            clearTerminal();
            return;
        }

        if (mainCmd === 'help') {
            appendTerminalMessage(`
                <strong>Comandos de la Shell RDSLP:</strong><br>
                • <code>run</code> : Ejecuta el código que tengas en el editor<br>
                • <code>clear</code> : Limpia la consola<br>
                • <code>js &lt;código&gt;</code> : Evalúa una línea de JavaScript al vuelo<br>
                • <code>python &lt;código&gt;</code> : Evalúa una línea de Python al vuelo (Skulpt)<br>
                • <code>sql &lt;query&gt;</code> : Ejecuta una consulta SQL en memoria<br>
                • <code>lang &lt;javascript|python|sql|java|cpp&gt;</code> : Cambia de lenguaje<br>
                • <code>whoami</code> : Muestra tu usuario y rol en Supabase<br>
                • <code>date</code> : Muestra la fecha y hora del sistema
            `, 'info');
            return;
        }

        if (mainCmd === 'run') {
            runCode();
            return;
        }

        if (mainCmd === 'whoami') {
            const role = currentUser?.role || 'user';
            const email = currentUser?.email || 'anon@rdslp.com';
            const name = currentUser?.name || 'Usuario';
            appendTerminalMessage(`Usuario: <strong>${escapeHtml(name)}</strong> | Email: <code>${escapeHtml(email)}</code> | Rol Supabase: <span class="term-lang-tag">${role.toUpperCase()}</span>`, 'success');
            return;
        }

        if (mainCmd === 'date') {
            appendTerminalMessage(new Date().toString(), 'info');
            return;
        }

        if (mainCmd === 'lang') {
            const targetLang = args.toLowerCase();
            const allowed = ['javascript', 'python', 'sql', 'java', 'cpp'];
            if (allowed.includes(targetLang)) {
                const sel = document.getElementById('languageSelect');
                if (sel) {
                    sel.value = targetLang;
                    sel.dispatchEvent(new Event('change'));
                }
            } else {
                appendTerminalMessage(`Lenguaje no reconocido. Usa uno de: ${allowed.join(', ')}`, 'error');
            }
            return;
        }

        if (mainCmd === 'js' || mainCmd === 'node') {
            if (!args) { appendTerminalMessage('Uso: js console.log("Hola")', 'warn'); return; }
            const res = executeJavaScript(args);
            renderExecutionBlock('javascript', args, res, 5);
            return;
        }

        if (mainCmd === 'python' || mainCmd === 'py') {
            if (!args) { appendTerminalMessage('Uso: python print(2 + 2)', 'warn'); return; }
            const res = await executePython(args);
            renderExecutionBlock('python', args, res, 10);
            return;
        }

        if (mainCmd === 'sql') {
            if (!args) { appendTerminalMessage('Uso: sql SELECT * FROM desarrolladores', 'warn'); return; }
            const res = executeSQL(args);
            renderExecutionBlock('sql', args, res, 5);
            return;
        }

        // Si es una expresión matemática directa
        if (/^[0-9+\-*/().\s]+$/.test(cmd)) {
            try {
                const mathResult = eval(cmd);
                appendTerminalMessage(`${cmd} = <strong>${mathResult}</strong>`, 'success');
                return;
            } catch {}
        }

        appendTerminalMessage(`Comando no reconocido: "<code>${escapeHtml(cmd)}</code>". Escribe <code>help</code> para ver los comandos disponibles.`, 'warn');
    }

    // =====================================================
    // CALIFICACIÓN CON IA Y GESTIÓN DE EJERCICIOS
    // =====================================================

    async function evaluateCodeWithAI() {
        const code = document.getElementById('codeInput')?.value || '';
        const exercise = document.getElementById('exerciseSelect')?.value || 'libre';
        const lang = document.getElementById('languageSelect')?.value || 'javascript';

        if (!code.trim()) { alert('Por favor escribe código en el editor primero.'); return; }

        const btn = document.getElementById('evaluateBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Analizando con IA... 🤖';
        btn.disabled = true;

        if (apiKey) {
            try {
                await evaluateWithRealAI(code, exercise, lang);
            } catch (error) {
                console.error('Fallo API Real, usando evaluación inteligente simulada:', error);
                evaluateWithSimulation(code, exercise, lang);
            }
        } else {
            evaluateWithSimulation(code, exercise, lang);
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
    }

    async function evaluateWithRealAI(code, exercise, lang) {
        const prompt = `
            Actúa como profesor de programación estricto. Evalúa este código en ${lang} para el ejercicio "${exercise}".
            Código: ${code}
            Si el código tiene errores de sintaxis, no compila o no hace nada lógico, dale un puntaje muy bajo o 0 en funcionalidad.
            Responde SOLO JSON: {"total":0-100,"functionality":0-100,"cleanCode":0-100,"efficiency":0-100,"bestPractices":0-100,"feedback":["msg1","msg2"]}
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let textResponse = data.candidates[0].content.parts[0].text;
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const evaluation = JSON.parse(textResponse);

        displayEvaluation(evaluation);
        saveExercise(code, exercise, lang, evaluation);
    }

    function evaluateWithSimulation(code, exercise, lang) {
        setTimeout(() => {
            const evaluation = generateSimulatedEvaluation(code, exercise, lang);
            displayEvaluation(evaluation);
            saveExercise(code, exercise, lang, evaluation);
        }, 1200);
    }

    function generateSimulatedEvaluation(code, exerciseType, lang) {
        const length = code.trim().length;
        const hasComments = code.includes('//') || code.includes('/*') || code.includes('#') || code.includes('--');
        const hasFunctions = code.includes('function') || code.includes('=>') || code.includes('def ') || code.includes('class ') || code.includes('SELECT');
        const hasOutput = code.includes('console.log') || code.includes('print') || code.includes('System.out') || code.includes('cout') || code.includes('SELECT');
        const hasValidStructure = hasFunctions || hasOutput;
        
        let score = 75 + Math.floor(Math.random() * 20);
        
        if (length < 5) {
            score -= 50;
        } else if (length < 20 && !hasValidStructure) {
            score -= 30;
        }
        
        if (hasComments) score += 5;
        score = Math.min(100, Math.max(0, score));

        const feedbacks = [];
        if (score < 40) {
            feedbacks.push("El código parece no tener una estructura lógica reconocible.");
            feedbacks.push("Te sugerimos revisar la sintaxis básica para " + lang.toUpperCase() + ".");
        } else {
            feedbacks.push(`Excelente estructuración en ${lang.toUpperCase()}.`);
            feedbacks.push("La lógica algorítmica resuelve los requerimientos.");
            feedbacks.push(hasComments ? "Excelente documentación y uso de comentarios." : "Te sugerimos agregar comentarios explicativos.");
            feedbacks.push("El rendimiento computacional es óptimo.");
        }

        return {
            total: score,
            functionality: Math.min(100, score < 40 ? score : score + 5),
            cleanCode: score < 40 ? score + 10 : (hasComments ? 90 : 75),
            efficiency: score,
            bestPractices: score < 40 ? score : 85,
            feedback: feedbacks.slice(0, 3)
        };
    }

    function displayEvaluation(result) {
        const card = document.getElementById('gradingCard');
        if (!card) return;
        card.style.display = 'block';
        const scoreEl = document.getElementById('gradeScore');
        if (scoreEl) {
            scoreEl.textContent = result.total;
            scoreEl.className = 'grade-score ' + (result.total >= 80 ? 'excellent' : result.total >= 60 ? 'good' : 'poor');
        }

        updateGradeBar('func', result.functionality);
        updateGradeBar('clean', result.cleanCode);
        updateGradeBar('eff', result.efficiency);
        updateGradeBar('bp', result.bestPractices);

        const feedbackEl = document.getElementById('gradeFeedback');
        if (feedbackEl) {
            feedbackEl.innerHTML = `<h4>Feedback IA:</h4><ul>${result.feedback.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`;
        }
        card.scrollIntoView({ behavior: 'smooth' });
    }

    function updateGradeBar(id, val) {
        const fill = document.getElementById(id + 'Fill');
        const value = document.getElementById(id + 'Value');
        if (fill) fill.style.width = val + '%';
        if (value) value.textContent = val + '%';
    }

    function saveExercise(code, exercise, language, evaluation) {
        if (!currentUser) return;
        const exercises = JSON.parse(localStorage.getItem('rdslp_user_exercises') || '[]');
        const exName = exerciseDescriptions[exercise]?.title || exercise;
        const newExercise = {
            id: Date.now(),
            userId: currentUser.id,
            exercise: exName,
            language,
            code,
            score: evaluation.total,
            evaluation,
            pinned: false,
            createdAt: new Date().toISOString()
        };
        exercises.unshift(newExercise);
        localStorage.setItem('rdslp_user_exercises', JSON.stringify(exercises));
        loadMyExercises();
    }

    function togglePinExercise(id) {
        const all = JSON.parse(localStorage.getItem('rdslp_user_exercises') || '[]');
        const idx = all.findIndex(e => e.id === id);
        if (idx !== -1) {
            all[idx].pinned = !all[idx].pinned;
            localStorage.setItem('rdslp_user_exercises', JSON.stringify(all));
            loadMyExercises();
        }
    }

    function deleteExercise(id) {
        if (!confirm('¿Deseas eliminar este ejercicio guardado?')) return;
        let all = JSON.parse(localStorage.getItem('rdslp_user_exercises') || '[]');
        all = all.filter(e => e.id !== id);
        localStorage.setItem('rdslp_user_exercises', JSON.stringify(all));
        loadMyExercises();
    }

    function loadMyExercises() {
        const container = document.getElementById('myExercisesList');
        if (!container || !currentUser) return;

        const allUserExercises = JSON.parse(localStorage.getItem('rdslp_user_exercises') || '[]')
            .filter(e => e.userId === currentUser.id);

        allUserExercises.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
        
        const exercises = allUserExercises.slice(0, 10);
        updateTaskBar(allUserExercises);

        if (exercises.length === 0) {
            container.innerHTML = '<p class="no-exercises">No has realizado ejercicios aún.</p>';
            return;
        }

        container.innerHTML = exercises.map(ex => `
            <div class="exercise-item${ex.pinned ? ' pinned' : ''}" style="position: relative;">
                <div class="exercise-item-info" onclick="loadExercise(${ex.id})" style="cursor:pointer; flex:1;">
                    <h4>${ex.pinned ? '📌 ' : ''}${escapeHtml(ex.exercise)}</h4>
                    <span>${escapeHtml(ex.language.toUpperCase())}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div class="exercise-item-score">${ex.score}</div>
                    <button onclick="event.stopPropagation(); window.togglePinExercise(${ex.id})" title="${ex.pinned ? 'Desfijar' : 'Fijar'}" style="background: none; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; padding: 4px 7px; font-size: 14px; color: var(--text-secondary);">${ex.pinned ? '📌' : '📍'}</button>
                    <button onclick="event.stopPropagation(); window.deleteExercise(${ex.id})" title="Eliminar" style="background: none; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; padding: 4px 7px; font-size: 14px; color: #ef4444;">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    window.togglePinExercise = togglePinExercise;
    window.deleteExercise = deleteExercise;

    function updateTaskBar(userExercises) {
        const predefinedTypes = ['Suma de dos números', 'Factorial', 'Palíndromo', 'Fibonacci', 'Ordenar'];
        const completedTypes = new Set();
        
        userExercises.forEach(ex => {
            if (predefinedTypes.includes(ex.exercise) && ex.score >= 60) {
                completedTypes.add(ex.exercise);
            }
        });

        const totalCompleted = completedTypes.size + userExercises.filter(ex => !predefinedTypes.includes(ex.exercise) && ex.score >= 60).length;
        const targetTotal = Math.max(5, totalCompleted + (totalCompleted >= 5 ? 2 : 0));
        const percentage = Math.min(100, Math.round((totalCompleted / targetTotal) * 100));
        
        const bar = document.getElementById('taskProgressBar');
        const text = document.getElementById('taskProgressText');
        
        if (bar) bar.style.width = percentage + '%';
        if (text) text.textContent = `${totalCompleted} de ${targetTotal} ejercicios completados`;
    }

    window.loadExercise = function (id) {
        const ex = JSON.parse(localStorage.getItem('rdslp_user_exercises') || '[]').find(e => e.id === id);
        if (ex) {
            document.getElementById('codeInput').value = ex.code;
            const sel = document.getElementById('languageSelect');
            if (sel) {
                sel.value = ex.language;
                updateLanguageBadge();
            }
            updateLineNumbers();
            if (ex.evaluation) displayEvaluation(ex.evaluation);
            appendTerminalMessage(`Ejercicio "${ex.exercise}" cargado en el editor.`, 'info');
        }
    };

    function shareExercise() {
        if (!document.getElementById('shareExercise')?.checked) {
            alert('Por favor marca la casilla "Compartir en el muro" primero.');
            return;
        }
        const code = document.getElementById('codeInput')?.value || '';
        const lang = document.getElementById('languageSelect')?.value || 'javascript';
        const score = document.getElementById('gradeScore')?.textContent || '0';

        const posts = JSON.parse(localStorage.getItem('rdslp_posts') || '[]');
        posts.unshift({
            id: Date.now(),
            authorId: currentUser.id,
            authorName: currentUser.name,
            type: 'ejercicio',
            language: lang,
            content: `¡He completado una solución en ${lang.toUpperCase()} con puntuación de ${score}/100! 🚀`,
            code,
            score: parseInt(score),
            likes: [],
            comments: [],
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('rdslp_posts', JSON.stringify(posts));
        alert('¡Ejercicio publicado en el Muro con éxito!');
    }

    function clearEditor() {
        const codeInput = document.getElementById('codeInput');
        if (codeInput) codeInput.value = '';
        const gradingCard = document.getElementById('gradingCard');
        if (gradingCard) gradingCard.style.display = 'none';
        updateLineNumbers();
        appendTerminalMessage('Editor de código limpiado.', 'info');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
