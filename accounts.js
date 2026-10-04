document.addEventListener('DOMContentLoaded', () => {
    const accountsTabBtn = document.getElementById('navBtnAccounts');
    const accountsSection = document.getElementById('hq-tab-accounts');
    if (!accountsTabBtn || !accountsSection) return; // Uruchamia się tylko w admin.html

    // TYLKO MATEUSZ BUGAJSKI POSIADA UPRAWNIENIA ROOT ADMINA DO ZARZĄDZANIA KONTAMI
    const ROOT_ADMIN_EMAILS = [
        'mbugajski@wakethebrand.pl',
        'mateuszbugecik@gmail.com'
    ];

    const BARTEK_EMAIL = 'bkoczara@wakethebrand.pl';

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

        // 2. Jeśli zalogowany jest Pracownik (nie Mateusz i nie Bartek), dopasuj widoczność modułów
        if (!isRoot && email !== BARTEK_EMAIL) {
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
    }

    function colorBadgeHTML(colorKey, label) {
        if (colorKey === 'lime') return `<span class="hq-pill mateusz">🟢 ${label}</span>`;
        if (colorKey === 'blue') return `<span class="hq-pill bartek">🔵 ${label}</span>`;
        return `<span class="hq-pill wspolnie">🟠 ${label}</span>`;
    }

    // Automatyczna wysyłka wiadomości e-mail z hasłem startowym + linku do zmiany hasła z Firebase
    async function dispatchWelcomeEmailAndResetLink(name, email, startPassword, roleTitle) {
        let resetSent = false;

        // 1. Wysłanie oficjalnego e-maila z Firebase z bezpiecznym linkiem do zmiany hasła
        if (window.WTB_HQ && typeof window.WTB_HQ.sendResetPassword === 'function') {
            try {
                resetSent = await window.WTB_HQ.sendResetPassword(email);
            } catch (e) {}
        }

        // 2. Wysłanie wiadomości powitalnej z hasłem startowym przez FormSubmit (jeśli strona działa na serwerze/domenie)
        const loginUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', 'logowanie.html')}`;

        if (window.location.protocol !== 'file:') {
            try {
                await fetch(`https://formsubmit.co/ajax/${email}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        _subject: `⚡ Twoje konto w Panelu HQ Wake The Brand zostało utworzone!`,
                        Powitanie: `Cześć ${name}! Mateusz Bugajski utworzył dla Ciebie konto w Panelu HQ Wake The Brand.`,
                        Stanowisko: roleTitle,
                        Twoj_Login_Email: email,
                        Haslo_Startowe: startPassword,
                        Link_Do_Logowania: loginUrl,
                        Zmiana_Hasla: 'Równolegle otrzymasz wiadomość systemową z linkiem, za pomocą którego możesz w każdej chwili zmienić hasło startowe na własne.',
                        _template: 'table'
                    })
                });
            } catch (e) {}
        }

        return resetSent;
    }

    // Buduje gotowy boks z podsumowaniem utworzonego konta i przyciskami wysyłki/kopiowania
    function showCreatedCredentialsBox(name, email, startPassword, resetSent) {
        if (!accountFormFeedback) return;
        const loginUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', 'logowanie.html')}`;

        const mailSubject = encodeURIComponent('Twoje dane dostępowe do Panelu HQ | Wake The Brand');
        const mailBody = encodeURIComponent(
`Cześć ${name}!

Twoje konto w Wewnętrznym Panelu HQ Wake The Brand jest już aktywne.

🌐 Panel logowania: ${loginUrl}
📧 Twój login (E-mail): ${email}
🔑 Hasło startowe: ${startPassword}

🔒 Zmiana hasła na własne:
Na Twój adres e-mail (${email}) został również wysłany automatyczny link bezpieczeństwa, za pomocą którego możesz od razu zmienić hasło startowe na swoje własne (możesz też kliknąć "Resetuj hasło" na ekranie logowania).

Pozdrawiam,
Mateusz Bugajski | Wake The Brand`
        );

        accountFormFeedback.innerHTML = `
            <div style="margin-top:0.8rem; padding:1.1rem; border-radius:14px; background:rgba(212,255,0,0.08); border:1px solid rgba(212,255,0,0.4);">
                <div style="color:#d4ff00; font-weight:700; margin-bottom:0.4rem;">
                    ✅ Konto dla ${name} (${email}) zostało utworzone w Firebase!
                </div>
                <div style="font-size:0.82rem; color:#e5e7eb; margin-bottom:0.75rem; line-height:1.5;">
                    • Hasło startowe ustawione na: <strong>${startPassword}</strong><br>
                    • ${resetSent ? '📨 Na adres <strong>' + email + '</strong> wysłano już automatyczny link do zmiany hasła na własne!' : '⚠️ Konto aktywne – możesz wysłać dane powitalne przyciskiem poniżej.'}
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <a href="mailto:${email}?subject=${mailSubject}&body=${mailBody}" class="btn-mini btn-accent">
                        ✉️ Wyślij e-mail z hasłem startowym
                    </a>
                    <button type="button" class="btn-mini" id="copyCreatedCredsBtn">
                        📋 Kopiuj dane logowania
                    </button>
                </div>
            </div>
        `;

        const copyBtn = document.getElementById('copyCreatedCredsBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard?.writeText(decodeURIComponent(mailBody));
                copyBtn.innerText = '✓ Skopiowano do schowka!';
            });
        }
    }

    // =========================================================
    // 1. RENDEROWANIE LISTY KONT (ZAŁOŻYCIELE + PRACOWNICY)
    // =========================================================
    function renderAccountsList() {
        enforceRolePermissionsUI();
        if (!isRootAdminMateusz() || !accountsListContainer) return;

        const allEmployees = getEmployeesArray();
        const bartekRecord = allEmployees.find(e => e.email.toLowerCase() === BARTEK_EMAIL);
        const regularEmployees = allEmployees.filter(e => e.email.toLowerCase() !== BARTEK_EMAIL);

        const isBartekActivated = Boolean(bartekRecord);

        // Stałe konta założycielskie na górze listy (z opcją aktywacji konta Bartka w bazie!)
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
                        ${isBartekActivated
                            ? '<span class="badge-status done">✓ Aktywne w bazie</span>'
                            : '<span class="badge-status progress">⏳ Wymaga utworzenia w bazie</span>'}
                    </div>
                    <small>E-mail: <strong>bkoczara@wakethebrand.pl</strong> • Performance Ads, Allegro Ads & Strategia (bez zarządzania kontami)</small>
                </div>
                <div class="cookie-actions">
                    <button type="button" class="btn-mini btn-accent" id="quickSetupBartekBtn">
                        ${isBartekActivated ? '🔑 Nadaj nowe hasło' : '⚡ Aktywuj w bazie / Nadaj hasło'}
                    </button>
                    <button type="button" class="btn-mini" data-reset-emp="bkoczara@wakethebrand.pl">
                        📨 Wyślij link zmiany hasła
                    </button>
                </div>
            </li>
        `;

        const employeesHTML = regularEmployees.length === 0
            ? `<li class="dash-task-item"><span class="task-meta">Brak utworzonych kont pracowników. Wypełnij formularz obok, aby dodać pierwsze konto pracownicze.</span></li>`
            : regularEmployees.map(emp => {
                const isActive = emp.status !== 'suspended';
                const statusBadge = isActive
                    ? '<span class="badge-status done">🔓 Aktywne</span>'
                    : '<span class="badge-status progress">🔒 Zawieszone</span>';

                const perms = ['Kalendarz', 'Dysk Google', 'Messenger HQ'];
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
                                📨 Wyślij link zmiany hasła
                            </button>
                            <button type="button" class="btn-mini btn-danger" data-del-emp="${emp.id}">
                                🗑️ Usuń
                            </button>
                        </div>
                    </li>
                `;
            }).join('');

        accountsListContainer.innerHTML = foundersHTML + employeesHTML;

        // Szybkie wypełnienie formularza danymi Bartka Koczary
        const quickSetupBartekBtn = document.getElementById('quickSetupBartekBtn');
        if (quickSetupBartekBtn) {
            quickSetupBartekBtn.addEventListener('click', () => {
                if (empFullName) empFullName.value = 'Bartosz Koczara';
                if (empEmail) empEmail.value = BARTEK_EMAIL;
                if (empRoleTitle) empRoleTitle.value = 'Współzałożyciel • Performance & Allegro Ads';
                if (empColorSelect) empColorSelect.value = 'blue';
                if (empAccessLeads) empAccessLeads.checked = true;
                if (empAccessPricing) empAccessPricing.checked = true;
                if (empAccessDocs) empAccessDocs.checked = true;
                if (empPassword) {
                    empPassword.focus();
                }
                if (accountFormFeedback) {
                    accountFormFeedback.innerText = '💡 Dane Bartosza Koczary zostały wpisane do formularza powyżej. Wpisz dla niego hasło startowe i kliknij „Utwórz konto”!';
                }
            });
        }

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

        // Wysłanie maila z linkiem do zmiany hasła
        accountsListContainer.querySelectorAll('[data-reset-emp]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetEmail = btn.getAttribute('data-reset-emp');
                if (window.WTB_HQ && typeof window.WTB_HQ.sendResetPassword === 'function') {
                    const ok = await window.WTB_HQ.sendResetPassword(targetEmail);
                    if (accountFormFeedback) {
                        accountFormFeedback.innerText = ok
                            ? `📨 Wysłano na adres ${targetEmail} wiadomość e-mail z linkiem do zmiany hasła!`
                            : `⚠️ Aby wysłać link zmiany hasła dla ${targetEmail}, najpierw aktywuj to konto w bazie formularzem obok.`;
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
    // 2. TWORZENIE / AKTYWACJA KONTA (W TYM KONTA BKOCZARA) + WYSYŁKA E-MAILA
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
                    accountFormFeedback.innerText = '⚠️ Wpisz imię, poprawny e-mail oraz hasło startowe (min. 6 znaków).';
                }
                return;
            }

            // Blokujemy tylko nadpisanie własnego konta Root Admina (Mateusza)
            if (ROOT_ADMIN_EMAILS.includes(emailVal)) {
                if (accountFormFeedback) {
                    accountFormFeedback.innerText = '⚠️ To Twój własny adres Głównego Administratora (Root Admin).';
                }
                return;
            }

            if (accountFormFeedback) {
                accountFormFeedback.innerText = '⏳ Rejestrowanie konta w Firebase Auth i wysyłanie wiadomości e-mail...';
            }

            // 1. Utworzenie konta w Firebase Auth z hasłem startowym (bez wylogowywania Mateusza!)
            if (window.WTB_HQ && typeof window.WTB_HQ.registerEmployeeInFirebase === 'function') {
                await window.WTB_HQ.registerEmployeeInFirebase(emailVal, passVal);
            }

            // 2. Wysłanie wiadomości e-mail z hasłem startowym + oficjalnego linku Firebase do zmiany hasła
            const resetSent = await dispatchWelcomeEmailAndResetLink(nameVal, emailVal, passVal, roleVal);

            const now = new Date();
            const createdStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

            // 3. Zapisanie lub aktualizacja rekordu w bazie zespołu
            const currentEmployees = getEmployeesArray().filter(x => x.email.toLowerCase() !== emailVal);

            const newEmployee = {
                id: 'emp_' + Date.now(),
                name: nameVal,
                email: emailVal,
                roleTitle: emailVal === BARTEK_EMAIL ? 'Współzałożyciel • Ads & Strategia' : roleVal,
                color: emailVal === BARTEK_EMAIL ? 'blue' : colorVal,
                accessLeads: empAccessLeads ? empAccessLeads.checked : true,
                accessPricing: empAccessPricing ? empAccessPricing.checked : true,
                accessDocs: empAccessDocs ? empAccessDocs.checked : true,
                status: 'active',
                createdAt: createdStr
            };

            currentEmployees.unshift(newEmployee);
            saveEmployeesArray(currentEmployees);

            createAccountForm.reset();
            showCreatedCredentialsBox(nameVal, emailVal, passVal, resetSent);
            renderAccountsList();
        });
    }

    window.addEventListener('wtb:workspace-updated', () => {
        renderAccountsList();
    });

    renderAccountsList();
});
