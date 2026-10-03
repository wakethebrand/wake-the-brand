document.addEventListener('DOMContentLoaded', () => {
    const accountsTabBtn = document.getElementById('navBtnAccounts');
    const accountsSection = document.getElementById('hq-tab-accounts');
    if (!accountsTabBtn || !accountsSection) return; // Uruchamia się tylko w admin.html

    // TYLKO MATEUSZ BUGAJSKI POSIADA UPRAWNIENIA ROOT ADMINA DO ZARZĄDZANIA KONTAMI
    const ROOT_ADMIN_EMAILS = [
        'mbugajski@wakethebrand.pl',
        'mateuszbugecik@gmail.com'
    ];

    // Elementy DOM zakładki Konta & Zespół
    const createAccountForm = document.getElementById('hqCreateAccountForm');
    const empFullName = document.getElementById('empFullName');
    const empEmail = document.getElementById('empEmail');
    const empPassword = document.getElementById('empPassword');
    const empRoleTitle = document.getElementById('empRoleTitle');
    const empColorSelect = document.getElementById('empColorSelect');
    const empAccessLeads = document.getElementById('empAccessLeads');
    const empAccessPricing = document.getElementById('empAccessPricing');
    const empAccessDocs = document.getElementById('empAccessDocs');
    const accountFormFeedback = document.getElementById('accountFormFeedback');
    const accountsListContainer = document.getElementById('hqAccountsList');

    function getLoggedInEmail() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getLoggedInEmail === 'function') {
            return window.WTB_HQ.getLoggedInEmail();
        }
        return (localStorage.getItem('wtb_admin_email') || '').trim().toLowerCase();
    }

    function isRootAdminMateusz() {
        const email = getLoggedInEmail();
        return ROOT_ADMIN_EMAILS.includes(email);
    }

    function getEmployeesArray() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getEmployees === 'function') {
            return window.WTB_HQ.getEmployees();
        }
        return [];
    }

    function saveEmployeesArray(updatedArr) {
        if (window.WTB_HQ && typeof window.WTB_HQ.saveEmployees === 'function') {
            window.WTB_HQ.saveEmployees(updatedArr);
        }
    }

    // Weryfikuje uprawnienia zalogowanego użytkownika i ukrywa/pokazuje odpowiednie zakładki
    function enforceRolePermissionsUI() {
        const email = getLoggedInEmail();
        const isRoot = isRootAdminMateusz();

        // 1. Zakładka "Konta & Zespół" widoczna WYŁĄCZNIE dla Mateusza Bugajskiego
        if (isRoot) {
            accountsTabBtn.classList.remove('hidden');
        } else {
            accountsTabBtn.classList.add('hidden');
            accountsSection.classList.add('hidden');
            accountsSection.classList.remove('active');
        }

        // 2. Jeśli zalogowany jest Pracownik, dopasuj widoczność modułów wg nadanych uprawnień
        const employees = getEmployeesArray();
        const empRecord = employees.find(e => e.email.toLowerCase() === email);

        if (empRecord) {
            const btnLeads = document.querySelector('[data-tab="hq-tab-leads"]');
            const btnPricing = document.querySelector('[data-tab="hq-tab-pricing"]');
            const btnDocs = document.querySelector('[data-tab="hq-tab-docs"]');

            if (btnLeads) btnLeads.classList.toggle('hidden', !empRecord.accessLeads);
            if (btnPricing) btnPricing.classList.toggle('hidden', !empRecord.accessPricing);
            if (btnDocs) btnDocs.classList.toggle('hidden', !empRecord.accessDocs);

            if (!empRecord.accessLeads && btnLeads?.classList.contains('active')) {
                const plannerBtn = document.querySelector('[data-tab="hq-tab-planner"]');
                if (plannerBtn) plannerBtn.click();
            }
        }
    }

    function colorBadgeHTML(colorKey, label) {
        if (colorKey === 'lime') return `<span class="hq-pill mateusz">🟢 ${label}</span>`;
        if (colorKey === 'blue') return `<span class="hq-pill bartek">🔵 ${label}</span>`;
        return `<span class="hq-pill wspolnie">🟠 ${label}</span>`;
    }

    // =========================================================
    // 1. RENDEROWANIE LISTY KONT (ZAŁOŻYCIELE + PRACOWNICY)
    // =========================================================
    function renderAccountsList() {
        enforceRolePermissionsUI();
        if (!isRootAdminMateusz() || !accountsListContainer) return;

        const employees = getEmployeesArray();

        // Stałe konta założycielskie na górze listy
        const foundersHTML = `
            <li class="dash-task-item">
                <div class="task-meta">
                    <div>
                        <strong>Mateusz Bugajski</strong>
                        <span class="hq-pill mateusz">👑 ROOT ADMIN (Właściciel Strony)</span>
                        <span class="badge-status done">✓ Pełny dostęp</span>
                    </div>
                    <small>E-mail: <strong>mbugajski@wakethebrand.pl</strong> • Zarządzanie stroną, ruchem, SEO, Web & Kontami</small>
                </div>
                <div class="cookie-actions">
                    <span class="hq-pill mateusz">Główny Administrator</span>
                </div>
            </li>
            <li class="dash-task-item">
                <div class="task-meta">
                    <div>
                        <strong>Bartosz Koczara</strong>
                        <span class="hq-pill bartek">⚡ Współzałożyciel</span>
                        <span class="badge-status done">✓ Aktywne</span>
                    </div>
                    <small>E-mail: <strong>bkoczara@wakethebrand.pl</strong> • Performance Ads, Allegro Ads & Strategia (bez zarządzania kontami)</small>
                </div>
                <div class="cookie-actions">
                    <span class="hq-pill bartek">Współzałożyciel</span>
                </div>
            </li>
        `;

        const employeesHTML = employees.length === 0
            ? `<li class="dash-task-item"><span class="task-meta">Brak utworzonych kont pracowników. Wypełnij formularz obok, aby dodać pierwsze konto pracownicze.</span></li>`
            : employees.map(emp => {
                const isActive = emp.status !== 'suspended';
                const statusBadge = isActive
                    ? '<span class="badge-status done">🔓 Aktywne</span>'
                    : '<span class="badge-status progress">🔒 Zawieszone</span>';

                const perms = ['Kalendarz', 'Dysk Google', 'Czat HQ'];
                if (emp.accessLeads) perms.push('Wiadomości');
                if (emp.accessPricing) perms.push('Wyceny');
                if (emp.accessDocs) perms.push('Druki A4');

                return `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <div>
                                <strong>${emp.name}</strong>
                                ${colorBadgeHTML(emp.color || 'orange', emp.roleTitle || 'Pracownik')}
                                ${statusBadge}
                            </div>
                            <small>Login: <strong>${emp.email}</strong> • Dodano: ${emp.createdAt || 'Teraz'}</small>
                            <small>Uprawnienia: <strong>${perms.join(', ')}</strong></small>
                        </div>
                        <div class="cookie-actions">
                            <button type="button" class="btn-mini" data-toggle-emp="${emp.id}">
                                ${isActive ? '🔒 Zawieś' : '🔓 Odblokuj'}
                            </button>
                            <button type="button" class="btn-mini" data-reset-emp="${emp.email}">
                                🔑 Reset hasła
                            </button>
                            <button type="button" class="btn-mini btn-danger" data-del-emp="${emp.id}">
                                🗑️ Usuń
                            </button>
                        </div>
                    </li>
                `;
            }).join('');

        accountsListContainer.innerHTML = foundersHTML + employeesHTML;

        // Zawieszanie / Odblokowywanie pracownika
        accountsListContainer.querySelectorAll('[data-toggle-emp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-toggle-emp');
                const current = getEmployeesArray();
                const target = current.find(x => x.id === id);
                if (!target) return;
                target.status = target.status === 'suspended' ? 'active' : 'suspended';
                saveEmployeesArray(current);
                renderAccountsList();
            });
        });

        // Wysłanie maila z resetem hasła
        accountsListContainer.querySelectorAll('[data-reset-emp]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetEmail = btn.getAttribute('data-reset-emp');
                if (window.WTB_HQ && typeof window.WTB_HQ.sendResetPassword === 'function') {
                    const ok = await window.WTB_HQ.sendResetPassword(targetEmail);
                    if (accountFormFeedback) {
                        accountFormFeedback.innerText = ok
                            ? `📨 Wysłano link do resetu hasła na adres: ${targetEmail}`
                            : `⚠️ Nie udało się wysłać linku resetującego dla ${targetEmail}.`;
                    }
                }
            });
        });

        // Usuwanie konta pracownika
        accountsListContainer.querySelectorAll('[data-del-emp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-del-emp');
                const updated = getEmployeesArray().filter(x => x.id !== id);
                saveEmployeesArray(updated);
                renderAccountsList();
            });
        });
    }

    // =========================================================
    // 2. DODAWANIE NOWEGO KONTA PRACOWNIKA
    // =========================================================
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isRootAdminMateusz()) {
                if (accountFormFeedback) {
                    accountFormFeedback.innerText = '⛔ Brak uprawnień. Tylko Mateusz Bugajski może zarządzać kontami.';
                }
                return;
            }

            const nameVal = (empFullName?.value || '').trim();
            const emailVal = (empEmail?.value || '').trim().toLowerCase();
            const passVal = (empPassword?.value || '').trim();
            const roleVal = (empRoleTitle?.value || '').trim() || 'Specjalista WTB';
            const colorVal = empColorSelect ? empColorSelect.value : 'orange';

            if (!nameVal || !emailVal || passVal.length < 6) {
                if (accountFormFeedback) {
                    accountFormFeedback.innerText = '⚠️ Wpisz imię, poprawny e-mail oraz hasło (min. 6 znaków).';
                }
                return;
            }

            const currentEmployees = getEmployeesArray();
            if (currentEmployees.some(x => x.email.toLowerCase() === emailVal) || ROOT_ADMIN_EMAILS.includes(emailVal) || emailVal === 'bkoczara@wakethebrand.pl') {
                if (accountFormFeedback) {
                    accountFormFeedback.innerText = '⚠️ Konto z tym adresem e-mail już istnieje w systemie.';
                }
                return;
            }

            if (accountFormFeedback) {
                accountFormFeedback.innerText = '⏳ Tworzenie konta pracownika w bazie...';
            }

            if (window.WTB_HQ && typeof window.WTB_HQ.registerEmployeeInFirebase === 'function') {
                await window.WTB_HQ.registerEmployeeInFirebase(emailVal, passVal);
            }

            const now = new Date();
            const createdStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

            const newEmployee = {
                id: 'emp_' + Date.now(),
                name: nameVal,
                email: emailVal,
                roleTitle: roleVal,
                color: colorVal,
                accessLeads: empAccessLeads ? empAccessLeads.checked : true,
                accessPricing: empAccessPricing ? empAccessPricing.checked : true,
                accessDocs: empAccessDocs ? empAccessDocs.checked : true,
                status: 'active',
                createdAt: createdStr
            };

            currentEmployees.unshift(newEmployee);
            saveEmployeesArray(currentEmployees);

            createAccountForm.reset();
            if (accountFormFeedback) {
                accountFormFeedback.innerText = `✅ Utworzono konto dla: ${nameVal} (${emailVal}). Pracownik może się już zalogować!`;
            }
            renderAccountsList();
        });
    }

    window.addEventListener('wtb:workspace-updated', () => {
        renderAccountsList();
    });

    renderAccountsList();
});
