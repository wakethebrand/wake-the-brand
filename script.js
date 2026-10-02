document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 0. KONFIGURACJA FIREBASE & UPRAWNIENIA ZAŁOŻYCIELI (HQ)
    // =========================================================
    const firebaseConfig = {
        apiKey: "AIzaSyBBPECw6qPYOd7g1NUFzHNQMzljUBOwL9I",
        authDomain: "wake-the-brand.firebaseapp.com",
        projectId: "wake-the-brand",
        storageBucket: "wake-the-brand.firebasestorage.app",
        messagingSenderId: "765483574565",
        appId: "1:765483574565:web:c898771abb393cf11526cc"
    };

    const CONTACT_RECEIVER_EMAIL = "wakethebrand.kontakt@gmail.com";

    const ADMIN_EMAILS = [
        'mbugajski@wakethebrand.pl',
        'bkoczara@wakethebrand.pl',
        'kontakt@wakethebrand.pl',
        'contact@wakethebrand.pl',
        'wakethebrand.kontakt@gmail.com',
        'mateuszbugecik@gmail.com'
    ];

    const LEADS_STORAGE_KEY = 'wtb_hq_leads_v1';
    const WORKSPACE_STORAGE_KEY = 'wtb_hq_workspace_v1';

    const defaultWorkspace = {
        tasks: [
            {
                id: 't_start_1',
                title: 'Sprawdzić nowe zapytania z formularza i przygotować wyceny',
                project: 'Wake The Brand HQ',
                owner: 'Wspólnie',
                status: 'todo',
                createdAt: 'Start'
            }
        ],
        scratchpad: 'Tutaj możecie zapisywać szybkie ustalenia z briefingu, hasła pomocnicze lub pomysły na rolki...',
        driveFiles: [
            {
                id: 'd_start_1',
                title: 'Główny Folder Projektowy Wake The Brand',
                category: '📂 Folder Klienta',
                url: 'https://drive.google.com/',
                note: 'Główny dysk współdzielony założycieli',
                createdAt: 'Start'
            }
        ],
        savedQuotes: [],
        chatMessages: [
            {
                id: 'm_start_1',
                author: 'System HQ ⚡',
                senderKey: 'Mateusz',
                text: 'Wewnętrzny czat założycieli (Mateusz & Bartek) jest gotowy do pracy!',
                time: 'Start'
            }
        ]
    };

    function getCurrentTimeStr() {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${d}.${m}, ${h}:${min}`;
    }

    function isOwnerEmail(email) {
        return email ? ADMIN_EMAILS.includes(email.trim().toLowerCase()) : false;
    }

    function getLocalWorkspace() {
        const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        if (!raw) return JSON.parse(JSON.stringify(defaultWorkspace));
        try {
            return { ...defaultWorkspace, ...JSON.parse(raw) };
        } catch (e) {
            return JSON.parse(JSON.stringify(defaultWorkspace));
        }
    }

    function saveLocalWorkspace(data) {
        try { localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    }

    function getLocalLeads() {
        const raw = localStorage.getItem(LEADS_STORAGE_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
    }

    function saveLocalLeads(arr) {
        try { localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    // =========================================================
    // 1. UKRYTE WEJŚCIA DO PANELU LOGOWANIA (BOSS KEY + 3x KLIK)
    // =========================================================
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') || (e.altKey && e.key.toLowerCase() === 'l')) {
            e.preventDefault();
            window.location.href = 'logowanie.html';
        }
    });

    let secretClickCount = 0;
    let secretClickTimer = null;
    document.querySelectorAll('.logo .dot, .footer-bottom span').forEach(el => {
        el.addEventListener('click', (e) => {
            secretClickCount++;
            clearTimeout(secretClickTimer);
            secretClickTimer = setTimeout(() => { secretClickCount = 0; }, 900);
            if (secretClickCount >= 3) {
                e.preventDefault();
                window.location.href = 'logowanie.html';
            }
        });
    });

    // =========================================================
    // 2. MENU MOBILNE, BANER COOKIES, SYMULATOR & FAQ
    // =========================================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    const cookieBanner = document.getElementById('cookieBanner');
    const cookieEssentialBtn = document.getElementById('cookieEssentialBtn');
    const cookieAcceptAllBtn = document.getElementById('cookieAcceptAllBtn');
    const openCookiesBtn = document.getElementById('openCookiesBtn');
    const resetCookiesBtn = document.getElementById('resetCookiesBtn');

    if (cookieBanner) {
        if (!localStorage.getItem('wtb_cookie_consent')) cookieBanner.classList.remove('hidden');
        if (cookieEssentialBtn) {
            cookieEssentialBtn.addEventListener('click', () => {
                localStorage.setItem('wtb_cookie_consent', 'essential');
                cookieBanner.classList.add('hidden');
            });
        }
        if (cookieAcceptAllBtn) {
            cookieAcceptAllBtn.addEventListener('click', () => {
                localStorage.setItem('wtb_cookie_consent', 'all');
                cookieBanner.classList.add('hidden');
            });
        }
        if (openCookiesBtn) openCookiesBtn.addEventListener('click', () => cookieBanner.classList.remove('hidden'));
        if (resetCookiesBtn) {
            resetCookiesBtn.addEventListener('click', () => {
                localStorage.removeItem('wtb_cookie_consent');
                cookieBanner.classList.remove('hidden');
            });
        }
    }

    const btnSleep = document.getElementById('btnSleep');
    const btnAwake = document.getElementById('btnAwake');
    const stateSleep = document.getElementById('stateSleep');
    const stateAwake = document.getElementById('stateAwake');

    if (btnSleep && btnAwake && stateSleep && stateAwake) {
        btnSleep.addEventListener('click', () => {
            btnSleep.classList.add('active');
            btnAwake.classList.remove('active');
            stateSleep.classList.remove('hidden');
            stateAwake.classList.add('hidden');
        });
        btnAwake.addEventListener('click', () => {
            btnAwake.classList.add('active');
            btnSleep.classList.remove('active');
            stateAwake.classList.remove('hidden');
            stateSleep.classList.add('hidden');
        });
    }

    document.querySelectorAll('.faq-item').forEach(item => {
        const q = item.querySelector('.faq-question');
        if (q) q.addEventListener('click', () => item.classList.toggle('open'));
    });

    // =========================================================
    // 3. FILTRY PORTFOLIO & MODALE (koncepty.html + portfolio.html)
    // =========================================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    if (filterBtns.length > 0 && portfolioCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                portfolioCards.forEach(card => {
                    const cat = card.getAttribute('data-category');
                    card.style.display = (filterValue === 'all' || filterValue === cat) ? 'flex' : 'none';
                });
            });
        });
    }

    const modalDetailsMap = {
        "ecom-1": {
            tag: "Filar 01 • Budowa i Optymalizacja Sklepu Online",
            title: "Jak wdrażamy szybki sklep internetowy nastawiony na konwersję?",
            steps: [
                "<strong>Etap 1: Architektura UX/UI Mobile-First</strong> – projektujemy układ kart produktów i koszyka tak, aby zakup na smartfonie zajmował mniej niż 60 sekund.",
                "<strong>Etap 2: Wdrożenie płatności i logistyki</strong> – integrujemy szybkie płatności (BLIK, Apple Pay, Google Pay, karty) oraz mapy paczkomatów InPost / kurierów.",
                "<strong>Etap 3: Szybkość i techniczne SEO</strong> – optymalizujemy kod i grafikę, aby sklep ładował się błyskawicznie i wysoko pozycjonował w Google."
            ]
        },
        "ecom-2": {
            tag: "Filar 02 • Kreacja Wideo & Wizerunek Marki",
            title: "Rolki produktowe (Reels / TikTok), które sprzedają",
            steps: [
                "<strong>Etap 1: Koncepcja i Haki (Hooks)</strong> – przygotowujemy pomysły na krótkie wideo, które zatrzymują scrollowanie w pierwszych 3 sekundach.",
                "<strong>Etap 2: Dynamiczny montaż z Twoich nagrań</strong> – przesyłasz nam surowe ujęcia telefonu, a my robimy cięcia, napisy, sound design i korekcję barw.",
                "<strong>Etap 3: Spójny Branding</strong> – dbamy o to, by sklep, banery i rolki tworzyły jedną, rozpoznawalną markę."
            ]
        },
        "ecom-3": {
            tag: "Filar 03 • Skalowanie Sprzedaży & Ads",
            title: "System reklamowy dla E-commerce",
            steps: [
                "<strong>Etap 1: Analityka sprzedaży</strong> – wdrażamy Meta Pixel oraz Google Analytics 4 ze śledzeniem wartości koszyka i zakupów.",
                "<strong>Etap 2: Kampanie produktowe i wideo</strong> – docieramy z Twoją ofertą do nowej, precyzyjnie dobranej grupy odbiorców.",
                "<strong>Etap 3: Ratowanie porzuconych koszyków</strong> – uruchamiamy dynamiczny remarketing przypominający o dokończeniu zamówienia."
            ]
        },
        "port-1": {
            tag: "Case Study • Sklep Streetwear & Moda",
            title: "Vintage Drop Store – Sklep pod limitowane kolekcje",
            steps: [
                "<strong>Wyzwanie:</strong> Klient sprzedawał wcześniej wyłącznie przez wiadomości prywatne na Instagramie, tracąc klientów przy większych premierach.",
                "<strong>Rozwiązanie:</strong> Stworzyliśmy mroczny, nowoczesny sklep z licznikiem do dropu, automatycznymi stanami magazynowymi i płatnością BLIK jednym kliknięciem.",
                "<strong>Rezultat:</strong> Czas ładowania 0.8s na telefonie i pełna automatyzacja wysyłek od pierwszego dnia premiery."
            ]
        },
        "port-2": {
            tag: "Case Study • Wideo Reels & TikTok",
            title: "Clay & Craft Studio – Kampania wideo dla rękodzieła",
            steps: [
                "<strong>Wyzwanie:</strong> Statyczne zdjęcia produktów nie oddawały detali i nie budowały zasięgów organicznych.",
                "<strong>Rozwiązanie:</strong> Zmontowaliśmy serię 8 dynamicznych rolek z procesu tworzenia na żywo, pakowania paczek (ASMR) i prezentacji detali.",
                "<strong>Rezultat:</strong> Wyraźny wzrost zaangażowania na profilu i bezpośrednie przejścia z bio prosto do kart produktów."
            ]
        },
        "port-3": {
            tag: "Case Study • Redesign E-commerce",
            title: "Neon Gear E-Shop – Optymalizacja ścieżki zakupowej",
            steps: [
                "<strong>Wyzwanie:</strong> Duży odsetek porzuconych koszyków na smartfonach przez skomplikowany, 5-etapowy formularz zamówienia.",
                "<strong>Rozwiązanie:</strong> Przebudowaliśmy kartę produktu (dodając wideo-prezentację) i skróciliśmy koszyk do jednego przejrzystego ekranu.",
                "<strong>Rezultat:</strong> Znacznie szybsze finalizowanie zamówień na urządzeniach mobilnych i wyższa średnia wartość koszyka."
            ]
        },
        "port-4": {
            tag: "Case Study • Branding & Meta Ads",
            title: "Pulse Coffee Roasters – Rebranding i kampania zestawów",
            steps: [
                "<strong>Wyzwanie:</strong> Lokalna palarnia kawy chciała rozpocząć sprzedaż wysyłkową w całej Polsce.",
                "<strong>Rozwiązanie:</strong> Zaprojektowaliśmy nowe logo, paletę barw, kreacje reklamowe oraz uruchomiliśmy kampanię Meta Ads na zestawy startowe.",
                "<strong>Rezultat:</strong> Spójny wizerunek marki premium i regularny napływ nowych zamówień ze sklepu online."
            ]
        }
    };

    const modal = document.getElementById('conceptModal');
    const closeModal = document.getElementById('closeModal');
    const modalTag = document.getElementById('modalTag');
    const modalTitle = document.getElementById('modalTitle');
    const modalSteps = document.getElementById('modalSteps');

    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = modalDetailsMap[btn.getAttribute('data-concept')];
            if (data && modal) {
                modalTag.innerText = data.tag;
                modalTitle.innerText = data.title;
                modalSteps.innerHTML = data.steps.map(s => `<div class="modal-step-box">${s}</div>`).join('');
                modal.classList.add('open');
            }
        });
    });

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    }

    // =========================================================
    // 4. POŁĄCZENIE Z FIREBASE (LOGOWANIE, KONTAKT & PANEL HQ)
    // =========================================================
    let auth = null;
    let db = null;
    let fbFns = {};
    let firebaseReady = false;
    let workspaceCache = getLocalWorkspace();
    let leadsCache = getLocalLeads();

    const adminEmailLabelEl = document.getElementById('loggedInAdminEmail');
    const savedAdminEmail = localStorage.getItem('wtb_admin_email');
    if (adminEmailLabelEl && savedAdminEmail) {
        adminEmailLabelEl.innerText = savedAdminEmail;
    }

    async function syncWorkspaceToCloud(updatedWorkspace) {
        workspaceCache = updatedWorkspace;
        saveLocalWorkspace(updatedWorkspace);
        renderHQWorkspaceUI();

        if (firebaseReady && db) {
            try {
                await fbFns.setDoc(fbFns.doc(db, 'settings', 'hq_workspace'), updatedWorkspace, { merge: true });
            } catch (e) {
                console.warn('Zapis lokalny HQ:', e);
            }
        }
    }

    // =========================================================
    // 5. FORMULARZ KONTAKTOWY (kontakt.html)
    // =========================================================
    const topicPills = document.querySelectorAll('.topic-pill');
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    topicPills.forEach(pill => pill.addEventListener('click', () => pill.classList.toggle('active')));

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const msgVal = document.getElementById('message').value.trim();
            const activeTopics = [];
            topicPills.forEach(p => { if (p.classList.contains('active')) activeTopics.push(p.innerText); });
            const topicsStr = activeTopics.join(', ') || 'Ogólne zapytanie';

            formFeedback.innerText = 'Wysyłanie wiadomości... ⏳';

            const leadObj = {
                id: 'lead_' + Date.now(),
                name,
                email,
                topics: topicsStr,
                message: msgVal,
                crmStatus: 'new',
                createdAt: getCurrentTimeStr(),
                timestamp: Date.now()
            };

            const currentLeads = getLocalLeads();
            currentLeads.unshift(leadObj);
            saveLocalLeads(currentLeads);

            if (firebaseReady && db) {
                try {
                    await fbFns.setDoc(fbFns.doc(db, 'contact_leads', leadObj.id), leadObj);
                } catch (err) {}
            }

            if (window.location.protocol !== 'file:') {
                fetch(`https://formsubmit.co/ajax/${CONTACT_RECEIVER_EMAIL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: `⚡ Nowe zapytanie Wake The Brand od: ${name}`,
                        _replyto: email,
                        Imie_lub_Marka: name,
                        Kontakt_Klienta: email,
                        Wybrane_Obszary: topicsStr,
                        Wiadomosc: msgVal,
                        _template: 'table'
                    })
                }).catch(() => {});
            }

            formFeedback.innerText = `Dzięki, ${name}! Wiadomość została wysłana. Odezwiemy się maksymalnie w 24h ⚡`;
            contactForm.reset();
        });
    }

    // =========================================================
    // 6. LOGOWANIE ZAŁOŻYCIELI (logowanie.html)
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    const forgotPassBtn = document.getElementById('forgotPassBtn');

    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', async () => {
            const emailVal = document.getElementById('loginEmail').value.trim();
            const loginFeedback = document.getElementById('loginFeedback');
            if (!emailVal) {
                loginFeedback.innerText = 'Wpisz najpierw swój służbowy e-mail powyżej.';
                return;
            }
            if (firebaseReady && auth) {
                try {
                    await fbFns.sendPasswordResetEmail(auth, emailVal);
                    loginFeedback.innerText = `Link do resetu hasła wysłano na: ${emailVal} ⚡`;
                } catch (err) {
                    loginFeedback.innerText = 'Nie znaleziono konta o tym adresie w Firebase Auth.';
                }
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            const loginFeedback = document.getElementById('loginFeedback');

            if (!isOwnerEmail(email)) {
                loginFeedback.innerText = '⛔ Dostęp wyłącznie dla autoryzowanych adresów Założycieli Wake The Brand.';
                return;
            }

            loginFeedback.innerText = 'Weryfikacja dostępu HQ... ⚡';

            if (firebaseReady && auth) {
                try {
                    await fbFns.signInWithEmailAndPassword(auth, email, password);
                    localStorage.setItem('wtb_admin_email', email);
                    window.location.href = 'admin.html';
                } catch (err) {
                    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                        try {
                            await fbFns.createUserWithEmailAndPassword(auth, email, password);
                            localStorage.setItem('wtb_admin_email', email);
                            window.location.href = 'admin.html';
                            return;
                        } catch (createErr) {}
                    }
                    loginFeedback.innerText = 'Błędne hasło lub dane autoryzacji.';
                }
            } else {
                localStorage.setItem('wtb_admin_email', email);
                window.location.href = 'admin.html';
            }
        });
    }

    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async () => {
            if (firebaseReady && auth) {
                try { await fbFns.signOut(auth); } catch (e) {}
            }
            window.location.href = 'logowanie.html';
        });
    }

    // =========================================================
    // 7. WEWNĘTRZNY PANEL ADMINISTRACJI HQ (admin.html)
    // =========================================================
    const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
    const dashTabContents = document.querySelectorAll('.dash-tab-content');

    function activateHQTab(targetId) {
        dashNavBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === targetId));
        dashTabContents.forEach(sec => {
            const isMatch = sec.id === targetId;
            sec.classList.toggle('hidden', !isMatch);
            sec.classList.toggle('active', isMatch);
        });
    }

    dashNavBtns.forEach(btn => {
        btn.addEventListener('click', () => activateHQTab(btn.getAttribute('data-tab')));
    });

    // Elementy DOM w admin.html
    const statTotalLeads = document.getElementById('statTotalLeads');
    const sidebarLeadsCount = document.getElementById('sidebarLeadsCount');
    const statActiveTasks = document.getElementById('statActiveTasks');
    const statDriveFiles = document.getElementById('statDriveFiles');
    const statSavedQuotes = document.getElementById('statSavedQuotes');

    const adminLeadsList = document.getElementById('adminLeadsList');
    const hqPlannerForm = document.getElementById('hqPlannerForm');
    const hqPlannerList = document.getElementById('hqPlannerList');
    const planFilterOwner = document.getElementById('planFilterOwner');
    const hqScratchpadForm = document.getElementById('hqScratchpadForm');
    const hqScratchpadInput = document.getElementById('hqScratchpadInput');
    const scratchpadSavedInfo = document.getElementById('scratchpadSavedInfo');

    const hqDriveForm = document.getElementById('hqDriveForm');
    const hqDriveList = document.getElementById('hqDriveList');
    const driveSearchInput = document.getElementById('driveSearchInput');

    const calcClientName = document.getElementById('calcClientName');
    const hqCalcChecks = document.querySelectorAll('.hq-calc-check');
    const calcCustomAdd = document.getElementById('calcCustomAdd');
    const calcDiscountPercent = document.getElementById('calcDiscountPercent');
    const calcSuggestedAds = document.getElementById('calcSuggestedAds');
    const hqCalcTotal = document.getElementById('hqCalcTotal');
    const hqCalcSplit = document.getElementById('hqCalcSplit');
    const hqQuoteReadyText = document.getElementById('hqQuoteReadyText');
    const copyQuoteTextBtn = document.getElementById('copyQuoteTextBtn');
    const saveQuoteHistoryBtn = document.getElementById('saveQuoteHistoryBtn');
    const sendCalcToPrintBtn = document.getElementById('sendCalcToPrintBtn');
    const hqQuoteFeedback = document.getElementById('hqQuoteFeedback');
    const hqSavedQuotesList = document.getElementById('hqSavedQuotesList');

    // Elementy Generatora Druków A4
    const docTemplateSelect = document.getElementById('docTemplateSelect');
    const docDateInput = document.getElementById('docDateInput');
    const docOwnerInput = document.getElementById('docOwnerInput');
    const docClientName = document.getElementById('docClientName');
    const docClientNip = document.getElementById('docClientNip');
    const docClientContact = document.getElementById('docClientContact');
    const docClientIndustry = document.getElementById('docClientIndustry');
    const docMainGoal = document.getElementById('docMainGoal');
    const docScopeItems = document.getElementById('docScopeItems');
    const docTotalPrice = document.getElementById('docTotalPrice');
    const docDeadline = document.getElementById('docDeadline');
    const docExtraNotes = document.getElementById('docExtraNotes');
    const docClearAllBtn = document.getElementById('docClearAllBtn');
    const triggerPrintDocBtn = document.getElementById('triggerPrintDocBtn');
    const printableDocumentArea = document.getElementById('printableDocumentArea');

    const hqInternalChatBox = document.getElementById('hqInternalChatBox');
    const hqInternalChatForm = document.getElementById('hqInternalChatForm');
    const hqChatSenderSelect = document.getElementById('hqChatSenderSelect');
    const hqInternalChatInput = document.getElementById('hqInternalChatInput');

    function ownerPillHTML(owner) {
        if (owner === 'Mateusz') return '<span class="hq-pill mateusz">🟢 Mateusz</span>';
        if (owner === 'Bartek') return '<span class="hq-pill bartek">🔵 Bartek</span>';
        return '<span class="hq-pill wspolnie">⚡ Wspólnie</span>';
    }

    function taskStatusBadgeHTML(status) {
        if (status === 'done') return '<span class="badge-status done">✓ Gotowe</span>';
        if (status === 'progress') return '<span class="badge-status progress">⏳ W trakcie</span>';
        return '<span class="badge-status todo">📋 Do zrobienia</span>';
    }

    function leadStatusBadgeHTML(crmStatus) {
        if (crmStatus === 'client') return '<span class="badge-status done">✅ Dogadane</span>';
        if (crmStatus === 'contacted') return '<span class="badge-status progress">📞 W kontakcie</span>';
        return '<span class="hq-pill wspolnie">🔥 Nowe zapytanie</span>';
    }

    // 7A. Renderowanie wiadomości z formularza (Leady)
    function renderLeadsUI() {
        const count = leadsCache ? leadsCache.length : 0;
        if (statTotalLeads) statTotalLeads.innerText = count;
        if (sidebarLeadsCount) sidebarLeadsCount.innerText = count;
        if (!adminLeadsList) return;

        if (count === 0) {
            adminLeadsList.innerHTML = `<li class="dash-task-item"><span class="task-meta">Brak zapytań z formularza kontaktowego. Gdy klient wyśle formularz na stronie Kontakt, wiadomość pojawi się tutaj automatycznie.</span></li>`;
            return;
        }

        adminLeadsList.innerHTML = leadsCache.map(lead => `
            <li class="dash-task-item">
                <div class="task-meta">
                    <div>
                        <strong>${lead.name}</strong>
                        <span class="hq-pill mateusz">${lead.email}</span>
                        ${leadStatusBadgeHTML(lead.crmStatus)}
                    </div>
                    <small>Wybrane obszary: <strong>${lead.topics || 'Ogólne'}</strong> • Wysłano: ${lead.createdAt || ''}</small>
                    <p>„${lead.message}”</p>
                </div>
                <div class="cookie-actions">
                    <button type="button" class="btn-mini btn-accent" data-quote-lead="${lead.name}">🧮 Wycena</button>
                    <button type="button" class="btn-mini" data-print-lead="${lead.id}">🖨️ Karta do druku</button>
                    <button type="button" class="btn-mini" data-cycle-lead="${lead.id}">🔄 Status</button>
                    <a href="mailto:${lead.email}?subject=Oferta współpracy Wake The Brand" class="btn-mini">✉️ Odpisz</a>
                    <button type="button" class="btn-mini btn-danger" data-del-lead="${lead.id}">🗑️</button>
                </div>
            </li>
        `).join('');

        adminLeadsList.querySelectorAll('[data-quote-lead]').forEach(btn => {
            btn.addEventListener('click', () => {
                const clientName = btn.getAttribute('data-quote-lead');
                if (calcClientName) {
                    calcClientName.value = clientName;
                    recalculateInternalQuote();
                }
                activateHQTab('hq-tab-pricing');
            });
        });

        adminLeadsList.querySelectorAll('[data-print-lead]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-print-lead');
                const lead = leadsCache.find(l => l.id === id);
                if (!lead) return;
                if (docTemplateSelect) docTemplateSelect.value = 'brief';
                if (docClientName) docClientName.value = lead.name || '';
                if (docClientContact) docClientContact.value = lead.email || '';
                if (docClientIndustry) docClientIndustry.value = lead.topics || '';
                if (docMainGoal) docMainGoal.value = lead.message || '';
                renderPrintableDocument();
                activateHQTab('hq-tab-docs');
            });
        });

        adminLeadsList.querySelectorAll('[data-cycle-lead]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-cycle-lead');
                const target = leadsCache.find(l => l.id === id);
                if (!target) return;
                const cur = target.crmStatus || 'new';
                target.crmStatus = cur === 'new' ? 'contacted' : (cur === 'contacted' ? 'client' : 'new');
                saveLocalLeads(leadsCache);
                renderLeadsUI();
                if (firebaseReady && db) {
                    try { await fbFns.setDoc(fbFns.doc(db, 'contact_leads', id), { crmStatus: target.crmStatus }, { merge: true }); } catch (e) {}
                }
            });
        });

        adminLeadsList.querySelectorAll('[data-del-lead]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-del-lead');
                leadsCache = leadsCache.filter(l => l.id !== id);
                saveLocalLeads(leadsCache);
                renderLeadsUI();
                if (firebaseReady && db) {
                    try { await fbFns.deleteDoc(fbFns.doc(db, 'contact_leads', id)); } catch (e) {}
                }
            });
        });
    }

    // 7B. Renderowanie Planera, Dysku Google, Historii Wycen i Czatu
    function renderHQWorkspaceUI() {
        const tasks = workspaceCache.tasks || [];
        const driveFiles = workspaceCache.driveFiles || [];
        const savedQuotes = workspaceCache.savedQuotes || [];
        const chatMessages = workspaceCache.chatMessages || [];

        const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
        if (statActiveTasks) statActiveTasks.innerText = activeTasksCount;
        if (statDriveFiles) statDriveFiles.innerText = driveFiles.length;
        if (statSavedQuotes) statSavedQuotes.innerText = savedQuotes.length;

        if (hqScratchpadInput && !hqScratchpadInput.dataset.editing) {
            hqScratchpadInput.value = workspaceCache.scratchpad || '';
        }

        if (hqPlannerList) {
            const ownerFilter = planFilterOwner ? planFilterOwner.value : 'all';
            const filteredTasks = tasks.filter(t => ownerFilter === 'all' || t.owner === ownerFilter);

            hqPlannerList.innerHTML = filteredTasks.length === 0
                ? `<li class="dash-task-item"><span class="task-meta">Brak zadań dla wybranego filtra.</span></li>`
                : filteredTasks.map(t => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <div>
                                <strong>${t.title}</strong>
                                ${ownerPillHTML(t.owner)}
                            </div>
                            <small>${t.project || 'Ogólne'} • Dodano: ${t.createdAt || 'Teraz'}</small>
                        </div>
                        <div class="cookie-actions">
                            <button type="button" class="btn-mini" data-cycle-hq-task="${t.id}">${taskStatusBadgeHTML(t.status)}</button>
                            <button type="button" class="btn-mini btn-danger" data-del-hq-task="${t.id}">🗑️</button>
                        </div>
                    </li>
                `).join('');

            hqPlannerList.querySelectorAll('[data-cycle-hq-task]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-cycle-hq-task');
                    const task = workspaceCache.tasks.find(x => x.id === id);
                    if (!task) return;
                    task.status = task.status === 'todo' ? 'progress' : (task.status === 'progress' ? 'done' : 'todo');
                    syncWorkspaceToCloud(workspaceCache);
                });
            });

            hqPlannerList.querySelectorAll('[data-del-hq-task]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-del-hq-task');
                    workspaceCache.tasks = workspaceCache.tasks.filter(x => x.id !== id);
                    syncWorkspaceToCloud(workspaceCache);
                });
            });
        }

        if (hqDriveList) {
            const q = (driveSearchInput ? driveSearchInput.value : '').trim().toLowerCase();
            const filteredDrive = driveFiles.filter(d => {
                if (!q) return true;
                return `${d.title} ${d.category} ${d.note}`.toLowerCase().includes(q);
            });

            hqDriveList.innerHTML = filteredDrive.length === 0
                ? `<div class="drive-card-row"><span class="task-meta">Brak podpiętych plików pasujących do wyszukiwania.</span></div>`
                : filteredDrive.map(d => `
                    <div class="drive-card-row">
                        <div class="task-meta">
                            <div>
                                <span class="hq-pill mateusz">${d.category}</span>
                                <strong>${d.title}</strong>
                            </div>
                            <small>${d.note || 'Brak opisu'} • Dodano: ${d.createdAt}</small>
                        </div>
                        <div class="cookie-actions">
                            <a href="${d.url}" target="_blank" rel="noopener" class="btn-mini btn-accent">☁️ Otwórz w Drive →</a>
                            <button type="button" class="btn-mini btn-danger" data-del-drive="${d.id}">🗑️</button>
                        </div>
                    </div>
                `).join('');

            hqDriveList.querySelectorAll('[data-del-drive]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-del-drive');
                    workspaceCache.driveFiles = workspaceCache.driveFiles.filter(x => x.id !== id);
                    syncWorkspaceToCloud(workspaceCache);
                });
            });
        }

        if (hqSavedQuotesList) {
            hqSavedQuotesList.innerHTML = savedQuotes.length === 0
                ? `<li class="dash-task-item"><span class="task-meta">Brak zapisanych wycen. Użyj kalkulatora obok i kliknij „Zapisz wycenę na liście”.</span></li>`
                : savedQuotes.map(qItem => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${qItem.client} – ${qItem.total}</strong>
                            <small>${qItem.services} • Podział 50/50: ${qItem.split} • ${qItem.date}</small>
                        </div>
                        <button type="button" class="btn-mini btn-danger" data-del-quote="${qItem.id}">🗑️</button>
                    </li>
                `).join('');

            hqSavedQuotesList.querySelectorAll('[data-del-quote]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-del-quote');
                    workspaceCache.savedQuotes = workspaceCache.savedQuotes.filter(x => x.id !== id);
                    syncWorkspaceToCloud(workspaceCache);
                });
            });
        }

        if (hqInternalChatBox) {
            hqInternalChatBox.innerHTML = chatMessages.map(m => `
                <div class="chat-bubble ${m.senderKey === 'Bartek' ? 'from-agency' : 'from-client'}">
                    <span class="chat-sender">${m.author} • ${m.time}</span>
                    <div>${m.text}</div>
                </div>
            `).join('');
            hqInternalChatBox.scrollTop = hqInternalChatBox.scrollHeight;
        }
    }

    // 7C. Wewnętrzny Kalkulator Wyceny – obliczenia na żywo
    function recalculateInternalQuote() {
        if (!hqCalcTotal) return;
        let baseSum = 0;
        const selectedNames = [];
        const selectedWithPrices = [];

        hqCalcChecks.forEach(ch => {
            if (ch.checked) {
                const price = parseInt(ch.value, 10) || 0;
                const name = ch.getAttribute('data-name');
                baseSum += price;
                selectedNames.push(name);
                selectedWithPrices.push(`${name} - ${price} zł`);
            }
        });

        const customAdd = parseInt(calcCustomAdd?.value, 10) || 0;
        if (customAdd > 0) {
            selectedWithPrices.push(`Dodatkowe prace wdrożeniowe - ${customAdd} zł`);
        }

        const discountPct = Math.min(80, Math.max(0, parseInt(calcDiscountPercent?.value, 10) || 0));
        const suggestedAds = parseInt(calcSuggestedAds?.value, 10) || 0;

        const subtotal = Math.max(0, baseSum + customAdd);
        const finalTotal = Math.round(subtotal * (1 - discountPct / 100));
        const perOwner = Math.round(finalTotal / 2);

        hqCalcTotal.innerText = `${finalTotal.toLocaleString('pl-PL')} zł`;
        if (hqCalcSplit) hqCalcSplit.innerText = `po ${perOwner.toLocaleString('pl-PL')} zł (Mateusz / Bartek)`;

        const clientLabel = (calcClientName?.value || '').trim() || 'Twojej Marki';
        const servicesLines = selectedNames.length > 0
            ? selectedNames.map(s => `• ${s}`).join('\n')
            : '• Indywidualny zakres prac dopasowany do projektu';

        if (hqQuoteReadyText) {
            hqQuoteReadyText.value =
`Cześć! Przygotowaliśmy indywidualną propozycję współpracy dla ${clientLabel} w Wake The Brand ⚡

Zakres prac:
${servicesLines}

💰 Całkowity koszt realizacji: ${finalTotal.toLocaleString('pl-PL')} zł${discountPct > 0 ? ` (po uwzględnieniu ${discountPct}% rabatu)` : ''}
📈 Rekomendowany budżet reklamowy Ads: ok. ${suggestedAds.toLocaleString('pl-PL')} zł / mies.

Daj znać, czy taki zakres jest dla Ciebie odpowiedni – możemy startować od razu!
Zespół Wake The Brand`;
        }

        return {
            client: clientLabel,
            services: selectedNames.join(' + ') || 'Wycena indywidualna',
            scopeLines: selectedWithPrices.join('\n'),
            total: `${finalTotal.toLocaleString('pl-PL')} zł`,
            split: `po ${perOwner.toLocaleString('pl-PL')} zł`
        };
    }

    if (hqCalcTotal) {
        hqCalcChecks.forEach(ch => ch.addEventListener('change', recalculateInternalQuote));
        [calcClientName, calcCustomAdd, calcDiscountPercent, calcSuggestedAds].forEach(inp => {
            if (inp) inp.addEventListener('input', recalculateInternalQuote);
        });
        recalculateInternalQuote();
    }

    if (copyQuoteTextBtn && hqQuoteReadyText) {
        copyQuoteTextBtn.addEventListener('click', () => {
            navigator.clipboard?.writeText(hqQuoteReadyText.value);
            if (hqQuoteFeedback) {
                hqQuoteFeedback.innerText = '📋 Skopiowano gotową treść oferty do schowka!';
                setTimeout(() => { hqQuoteFeedback.innerText = ''; }, 2500);
            }
        });
    }

    if (saveQuoteHistoryBtn) {
        saveQuoteHistoryBtn.addEventListener('click', () => {
            const summary = recalculateInternalQuote();
            workspaceCache.savedQuotes = workspaceCache.savedQuotes || [];
            workspaceCache.savedQuotes.unshift({
                id: 'q_' + Date.now(),
                client: summary.client,
                services: summary.services,
                total: summary.total,
                split: summary.split,
                date: getCurrentTimeStr()
            });
            syncWorkspaceToCloud(workspaceCache);
            if (hqQuoteFeedback) {
                hqQuoteFeedback.innerText = '💾 Zapisano wycenę na liście poniżej!';
                setTimeout(() => { hqQuoteFeedback.innerText = ''; }, 2500);
            }
        });
    }

    if (sendCalcToPrintBtn) {
        sendCalcToPrintBtn.addEventListener('click', () => {
            const summary = recalculateInternalQuote();
            if (docTemplateSelect) docTemplateSelect.value = 'quote';
            if (docClientName) docClientName.value = (calcClientName?.value || '').trim();
            if (docScopeItems) docScopeItems.value = summary.scopeLines || '';
            if (docTotalPrice) docTotalPrice.value = summary.total || '';
            renderPrintableDocument();
            activateHQTab('hq-tab-docs');
        });
    }

    // =========================================================
    // 7D. GENERATOR DOKUMENTÓW DO DRUKU A4 / PDF
    // =========================================================
    function valOrBlankLine(val, placeholderDots = '........................................................................................') {
        const cleaned = (val || '').trim();
        return cleaned ? cleaned : placeholderDots;
    }

    function valOrNotesLines(val, linesCount = 4) {
        const cleaned = (val || '').trim();
        if (cleaned) {
            return `<div class="print-notes-box">${cleaned.replace(/\n/g, '<br>')}</div>`;
        }
        let linesHTML = '';
        for (let i = 0; i < linesCount; i++) {
            linesHTML += `<span class="print-dotted-line"></span>`;
        }
        return `<div class="print-notes-box">${linesHTML}</div>`;
    }

    function buildDocHeaderHTML(docCode, pageBadge = '') {
        const dateVal = valOrBlankLine(docDateInput?.value, '.........................');
        const ownerVal = valOrBlankLine(docOwnerInput?.value, '.......................................');

        return `
            <div class="print-doc-header">
                <div>
                    <div class="print-brand-title">WAKE THE BRAND.</div>
                    <div class="print-brand-sub">Kreatywne Studio Digital & E-commerce • kontakt@wakethebrand.pl</div>
                </div>
                <div class="print-meta-box">
                    <div><strong>Dokument:</strong> ${docCode} ${pageBadge}</div>
                    <div><strong>Data:</strong> ${dateVal}</div>
                    <div><strong>Sporządził:</strong> ${ownerVal}</div>
                </div>
            </div>
        `;
    }

    function renderPrintableDocument() {
        if (!printableDocumentArea) return;
        const tpl = docTemplateSelect ? docTemplateSelect.value : 'brief';

        const cName = valOrBlankLine(docClientName?.value);
        const cNip = valOrBlankLine(docClientNip?.value);
        const cContact = valOrBlankLine(docClientContact?.value);
        const cIndustry = valOrBlankLine(docClientIndustry?.value);
        const totalPrice = valOrBlankLine(docTotalPrice?.value, '....................................... PLN');
        const deadline = valOrBlankLine(docDeadline?.value, '.......................................');

        const rawScope = (docScopeItems?.value || '').trim();
        const scopeArr = rawScope ? rawScope.split('\n').map(s => s.trim()).filter(Boolean) : [];

        // SZABLON 1: KARTA BRIEFU I INFORMACJI OD KLIENTA (1 STRONA A4)
        if (tpl === 'brief') {
            const scopeBlockHTML = scopeArr.length > 0
                ? `<div class="print-notes-box">${scopeArr.map(item => `• ${item}`).join('<br>')}</div>`
                : `
                    <div class="print-check-grid">
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Budowa Sklepu Internetowego (E-commerce)</div>
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Nowoczesna Strona WWW / Landing Page</div>
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Montaż Wideo (Rolki Reels / TikTok)</div>
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Branding & Identyfikacja Wizualna</div>
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Kampanie Meta Ads / Google Ads</div>
                        <div class="print-check-item"><span class="print-checkbox-square"></span> Inne: .........................................................</div>
                    </div>
                `;

            printableDocumentArea.innerHTML = `
                <div class="print-page-a4">
                    ${buildDocHeaderHTML('WTB / BRIEF KLIENTA')}

                    <div class="print-doc-banner">
                        <h2>Karta Briefu i Informacji od Klienta</h2>
                        <p>Arkusz ustaleń projektowych, celów marki oraz wymagań wdrożeniowych</p>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">1. Dane Klienta / Marki</div>
                        <div class="print-grid-2">
                            <div class="print-field-row">
                                <span class="print-field-label">Nazwa Klienta / Marki / Firmy</span>
                                <span class="print-field-value">${cName}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">NIP / Adres / Obecna strona WWW</span>
                                <span class="print-field-value">${cNip}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">E-mail / Telefon kontaktowy</span>
                                <span class="print-field-value">${cContact}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">Branża / Profil działalności</span>
                                <span class="print-field-value">${cIndustry}</span>
                            </div>
                        </div>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">2. Obszary Współpracy & Zakres Zainteresowania</div>
                        ${scopeBlockHTML}
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">3. Główny Cel Projektu & Informacje od Klienta</div>
                        ${valOrNotesLines(docMainGoal?.value, 4)}
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">4. Szacowany Budżet & Planowany Termin</div>
                        <div class="print-grid-2">
                            <div class="print-field-row">
                                <span class="print-field-label">Ustalony / Deklarowany budżet</span>
                                <span class="print-field-value">${totalPrice}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">Oczekiwany termin realizacji / Startu</span>
                                <span class="print-field-value">${deadline}</span>
                            </div>
                        </div>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">5. Dodatkowe Notatki z Rozmowy / Inspiracje / Dostępy</div>
                        ${valOrNotesLines(docExtraNotes?.value, 4)}
                    </div>

                    <div class="print-signatures-row">
                        <div class="print-sign-box">Podpis Przedstawiciela Wake The Brand</div>
                        <div class="print-sign-box">Podpis Klienta (opcjonalnie)</div>
                    </div>

                    <div class="print-footer-note">
                        <span>Wake The Brand — Kreatywne Studio Digital & E-commerce</span>
                        <span>Strona 1 z 1</span>
                    </div>
                </div>
            `;
            return;
        }

        // SZABLON 2: KOSZTORYS, WYCENA I ZAKRES PRAC (2 STRONY A4)
        if (tpl === 'quote') {
            let tableRowsHTML = '';
            if (scopeArr.length > 0) {
                tableRowsHTML = scopeArr.map((line, idx) => {
                    const parts = line.split('-');
                    const itemName = parts[0] ? parts[0].trim() : line;
                    const itemPrice = parts.length > 1 ? parts.slice(1).join('-').trim() : 'W cenie pakietu';
                    return `
                        <tr>
                            <td>${idx + 1}.</td>
                            <td><strong>${itemName}</strong></td>
                            <td>${itemPrice}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                for (let i = 1; i <= 7; i++) {
                    tableRowsHTML += `
                        <tr>
                            <td>${i}.</td>
                            <td><span class="print-dotted-line"></span></td>
                            <td><span class="print-dotted-line"></span></td>
                        </tr>
                    `;
                }
            }

            printableDocumentArea.innerHTML = `
                <!-- STRONA 1 Z 2: DANE KLIENTA I TABELA KOSZTORYSU -->
                <div class="print-page-a4 page-break-after">
                    ${buildDocHeaderHTML('WTB / KOSZTORYS', '(Strona 1/2)')}

                    <div class="print-doc-banner">
                        <h2>Kosztorys, Wycena i Zakres Prac</h2>
                        <p>Indywidualna specyfikacja usług oraz wycena realizacji dla klienta</p>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">1. Zamawiający (Klient)</div>
                        <div class="print-grid-2">
                            <div class="print-field-row">
                                <span class="print-field-label">Nazwa Klienta / Marki / Firmy</span>
                                <span class="print-field-value">${cName}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">NIP / Adres / Strona WWW</span>
                                <span class="print-field-value">${cNip}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">Dane kontaktowe (E-mail / Telefon)</span>
                                <span class="print-field-value">${cContact}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">Branża / Projekt</span>
                                <span class="print-field-value">${cIndustry}</span>
                            </div>
                        </div>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">2. Opis Projektu i Cel Wdrożenia</div>
                        ${valOrNotesLines(docMainGoal?.value, 3)}
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">3. Szczegółowe Zestawienie Kosztorysu</div>
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th style="width: 45px;">Lp.</th>
                                    <th>Nazwa usługi / Etap prac wdrożeniowych</th>
                                    <th style="width: 160px;">Wycena / Koszt</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>

                        <div class="print-total-bar">
                            <span>CAŁKOWITA KWOTA REALIZACJI:</span>
                            <span>${totalPrice}</span>
                        </div>
                    </div>

                    <div class="print-footer-note">
                        <span>Wake The Brand — Kosztorys Indywidualny</span>
                        <span>Strona 1 z 2 (Ciąg dalszy na stronie 2)</span>
                    </div>
                </div>

                <!-- STRONA 2 Z 2: HARMONOGRAM, ZAŁĄCZONE DOKUMENTY (RĘCZNIE) I PODPISY -->
                <div class="print-page-a4">
                    ${buildDocHeaderHTML('WTB / KOSZTORYS', '(Strona 2/2)')}

                    <div class="print-section-block">
                        <div class="print-section-heading">4. Harmonogram, Termin Realizacji i Warunki Płatności</div>
                        <div class="print-grid-2">
                            <div class="print-field-row">
                                <span class="print-field-label">Przewidywany czas realizacji</span>
                                <span class="print-field-value">${deadline}</span>
                            </div>
                            <div class="print-field-row">
                                <span class="print-field-label">Sposób rozliczenia (np. zaliczka / etapy)</span>
                                <span class="print-field-value">........................................................................................</span>
                            </div>
                        </div>
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">5. Dodatkowe Ustalenia Techniczne i Uwagi</div>
                        ${valOrNotesLines(docExtraNotes?.value, 5)}
                    </div>

                    <div class="print-section-block">
                        <div class="print-section-heading">6. Załączone Dokumenty (Do wpisania ręcznego)</div>
                        <div class="print-notes-box">
                            <span class="print-dotted-line"></span>
                            <span class="print-dotted-line"></span>
                            <span class="print-dotted-line"></span>
                            <span class="print-dotted-line"></span>
                        </div>
                    </div>

                    <div class="print-signatures-row">
                        <div class="print-sign-box">Podpis Wykonawcy (Wake The Brand)</div>
                        <div class="print-sign-box">Akceptacja i Podpis Zamawiającego (Klienta)</div>
                    </div>

                    <div class="print-footer-note">
                        <span>Wake The Brand — Kreatywne Studio Digital & E-commerce</span>
                        <span>Strona 2 z 2</span>
                    </div>
                </div>
            `;
            return;
        }

        // SZABLON 3: KARTA PROJEKTU & CHECKLISTA WDROŻENIOWA (1 STRONA A4)
        const checklistRowsHTML = scopeArr.length > 0
            ? scopeArr.map(item => `<div class="print-check-item"><span class="print-checkbox-square"></span> ${item}</div>`).join('')
            : `
                <div class="print-check-item"><span class="print-checkbox-square"></span> Zebranie materiałów (logo, zdjęcia, wideo) od klienta</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Konfiguracja domeny, hostingu i certyfikatu SSL</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Projekt UX/UI sklepu lub strony WWW (Mobile-First)</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Wdrożenie koszyka, płatności BLIK oraz dostaw</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Montaż i akceptacja rolek produktowych (Reels / TikTok)</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Instalacja Meta Pixel oraz Google Analytics 4</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> Testy szybkości ładowania i odbiór końcowy projektu</div>
                <div class="print-check-item"><span class="print-checkbox-square"></span> ................................................................................................</div>
            `;

        printableDocumentArea.innerHTML = `
            <div class="print-page-a4">
                ${buildDocHeaderHTML('WTB / KARTA WDROŻENIA')}

                <div class="print-doc-banner">
                    <h2>Karta Projektu & Checklista Wdrożeniowa</h2>
                    <p>Wewnętrzny arkusz kontrolny realizacji projektu w Wake The Brand</p>
                </div>

                <div class="print-section-block">
                    <div class="print-section-heading">1. Informacje o Projekcie</div>
                    <div class="print-grid-2">
                        <div class="print-field-row">
                            <span class="print-field-label">Klient / Marka</span>
                            <span class="print-field-value">${cName}</span>
                        </div>
                        <div class="print-field-row">
                            <span class="print-field-label">Adres docelowej domeny / WWW</span>
                            <span class="print-field-value">${cNip}</span>
                        </div>
                        <div class="print-field-row">
                            <span class="print-field-label">Kontakt do klienta</span>
                            <span class="print-field-value">${cContact}</span>
                        </div>
                        <div class="print-field-row">
                            <span class="print-field-label">Termin oddania projektu</span>
                            <span class="print-field-value">${deadline}</span>
                        </div>
                    </div>
                </div>

                <div class="print-section-block">
                    <div class="print-section-heading">2. Lista Kontrolna Etapów Wdrożenia (Checklista)</div>
                    <div class="print-notes-box">
                        ${checklistRowsHTML}
                    </div>
                </div>

                <div class="print-section-block">
                    <div class="print-section-heading">3. Specyfikacja Techniczna / Notatki Zespołu</div>
                    ${valOrNotesLines(docMainGoal?.value, 4)}
                </div>

                <div class="print-section-block">
                    <div class="print-section-heading">4. Uwagi Końcowe & Potwierdzenie Odbioru</div>
                    ${valOrNotesLines(docExtraNotes?.value, 3)}
                </div>

                <div class="print-signatures-row">
                    <div class="print-sign-box">Zatwierdził (Mateusz Bugajski / Bartek Koczara)</div>
                    <div class="print-sign-box">Potwierdzenie odbioru</div>
                </div>

                <div class="print-footer-note">
                    <span>Wake The Brand — Wewnętrzna Dokumentacja Wdrożeniowa</span>
                    <span>Strona 1 z 1</span>
                </div>
            </div>
        `;
    }

    if (printableDocumentArea) {
        [
            docTemplateSelect,
            docDateInput,
            docOwnerInput,
            docClientName,
            docClientNip,
            docClientContact,
            docClientIndustry,
            docMainGoal,
            docScopeItems,
            docTotalPrice,
            docDeadline,
            docExtraNotes
        ].forEach(el => {
            if (el) {
                el.addEventListener('input', renderPrintableDocument);
                el.addEventListener('change', renderPrintableDocument);
            }
        });

        if (docClearAllBtn) {
            docClearAllBtn.addEventListener('click', () => {
                [
                    docDateInput,
                    docOwnerInput,
                    docClientName,
                    docClientNip,
                    docClientContact,
                    docClientIndustry,
                    docMainGoal,
                    docScopeItems,
                    docTotalPrice,
                    docDeadline,
                    docExtraNotes
                ].forEach(el => { if (el) el.value = ''; });
                renderPrintableDocument();
            });
        }

        if (triggerPrintDocBtn) {
            triggerPrintDocBtn.addEventListener('click', () => {
                renderPrintableDocument();
                window.print();
            });
        }

        renderPrintableDocument();
    }

    // =========================================================
    // 7E. OBSŁUGA FORMULARZY W ADMIN.HTML (PLANER, DRIVE, CZAT)
    // =========================================================
    if (hqPlannerForm) {
        hqPlannerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            workspaceCache.tasks = workspaceCache.tasks || [];
            workspaceCache.tasks.unshift({
                id: 'task_' + Date.now(),
                title: document.getElementById('planTaskTitle').value.trim(),
                project: document.getElementById('planTaskProject').value.trim() || 'Wake The Brand',
                owner: document.getElementById('planTaskOwner').value,
                status: document.getElementById('planTaskPriority').value,
                createdAt: getCurrentTimeStr()
            });
            hqPlannerForm.reset();
            syncWorkspaceToCloud(workspaceCache);
        });
    }

    if (planFilterOwner) {
        planFilterOwner.addEventListener('change', renderHQWorkspaceUI);
    }

    if (hqScratchpadForm && hqScratchpadInput) {
        hqScratchpadInput.addEventListener('focus', () => { hqScratchpadInput.dataset.editing = '1'; });
        hqScratchpadInput.addEventListener('blur', () => { delete hqScratchpadInput.dataset.editing; });
        hqScratchpadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            workspaceCache.scratchpad = hqScratchpadInput.value;
            syncWorkspaceToCloud(workspaceCache);
            if (scratchpadSavedInfo) {
                scratchpadSavedInfo.innerText = '✓ Zapisano!';
                setTimeout(() => { scratchpadSavedInfo.innerText = 'Notatnik HQ'; }, 2000);
            }
        });
    }

    if (hqDriveForm) {
        hqDriveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            workspaceCache.driveFiles = workspaceCache.driveFiles || [];
            workspaceCache.driveFiles.unshift({
                id: 'drive_' + Date.now(),
                title: document.getElementById('driveItemTitle').value.trim(),
                category: document.getElementById('driveItemCategory').value,
                url: document.getElementById('driveItemUrl').value.trim(),
                note: document.getElementById('driveItemNote').value.trim(),
                createdAt: getCurrentTimeStr()
            });
            hqDriveForm.reset();
            syncWorkspaceToCloud(workspaceCache);
        });
    }

    if (driveSearchInput) {
        driveSearchInput.addEventListener('input', renderHQWorkspaceUI);
    }

    if (hqInternalChatForm && hqInternalChatInput) {
        hqInternalChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = hqInternalChatInput.value.trim();
            if (!text) return;
            const senderKey = hqChatSenderSelect ? hqChatSenderSelect.value : 'Mateusz';
            workspaceCache.chatMessages = workspaceCache.chatMessages || [];
            workspaceCache.chatMessages.push({
                id: 'msg_' + Date.now(),
                senderKey,
                author: senderKey === 'Bartek' ? '🔵 Bartek Koczara' : '🟢 Mateusz Bugajski',
                text,
                time: getCurrentTimeStr()
            });
            hqInternalChatInput.value = '';
            syncWorkspaceToCloud(workspaceCache);
        });
    }

    if (adminLeadsList || hqPlannerList) {
        renderLeadsUI();
        renderHQWorkspaceUI();
    }

    // =========================================================
    // 8. INICJALIZACJA FIREBASE W TLE (REALTIME SYNC)
    // =========================================================
    try {
        const [appMod, authMod, firestoreMod] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
        ]);

        const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
        auth = authMod.getAuth(app);
        db = firestoreMod.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
        fbFns = { ...authMod, ...firestoreMod };
        firebaseReady = true;

        const statusEl = document.getElementById('firebaseStatusText');
        if (statusEl) {
            statusEl.innerText = '● Połączono z chmurą Firebase HQ';
        }

        if (typeof auth.authStateReady === 'function') await auth.authStateReady();

        if (auth.currentUser && auth.currentUser.email) {
            const email = auth.currentUser.email.toLowerCase();
            localStorage.setItem('wtb_admin_email', email);
            if (adminEmailLabelEl) adminEmailLabelEl.innerText = email;
            if (hqChatSenderSelect && email.includes('bkoczara')) {
                hqChatSenderSelect.value = 'Bartek';
            }
        }

        if (adminLeadsList || hqPlannerList) {
            fbFns.onSnapshot(fbFns.doc(db, 'settings', 'hq_workspace'), (docSnap) => {
                if (docSnap.exists()) {
                    workspaceCache = { ...defaultWorkspace, ...docSnap.data() };
                    saveLocalWorkspace(workspaceCache);
                    renderHQWorkspaceUI();
                } else {
                    syncWorkspaceToCloud(workspaceCache);
                }
            });

            fbFns.onSnapshot(fbFns.collection(db, 'contact_leads'), (colSnap) => {
                if (!colSnap.empty) {
                    const arr = [];
                    colSnap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                    arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    leadsCache = arr;
                    saveLocalLeads(arr);
                    renderLeadsUI();
                }
            });
        }
    } catch (err) {
        console.warn('Praca w trybie pamięci lokalnej:', err);
    }

});
