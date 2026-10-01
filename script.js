document.addEventListener('DOMContentLoaded', async () => {

    // =========================================================
    // 0. KONFIGURACJA FIREBASE (PROJEKT: WAKE-THE-BRAND)
    // =========================================================
    const firebaseConfig = {
        apiKey: "AIzaSyBBPECw6qPYOd7g1NUFzHNQMzljUBOwL9I",
        authDomain: "wake-the-brand.firebaseapp.com",
        projectId: "wake-the-brand",
        storageBucket: "wake-the-brand.firebasestorage.app",
        messagingSenderId: "765483574565",
        appId: "1:765483574565:web:c898771abb393cf11526cc"
    };

    // Główny mail, na który przychodzą wiadomości z formularza kontaktowego (kontakt.html)
    const CONTACT_RECEIVER_EMAIL = "kontakt@wakethebrand.pl";

    // Główne adresy e-mail Właściciela (mają zawsze uprawnienia Administratora)
    const ADMIN_EMAILS = [
        'kontakt@wakethebrand.pl',
        'contact@wakethebrand.pl',
        'mateuszbugecik@gmail.com'
    ];

    const STORAGE_KEY = 'wtb_portal_data_v1';
    const LEADS_STORAGE_KEY = 'wtb_leads_local_v1';
    const ACCOUNTS_CACHE_KEY = 'wtb_accounts_cache_v1';

    // Domyślny szablon danych dla nowego klienta
    const defaultClientData = {
        clientName: 'Marka Klienta (Konto Testowe)',
        userName: 'Klient',
        email: 'klient@twojamarka.pl',
        isAdminRole: false,
        isBlocked: false,
        createdAt: 'Październik 2026',
        packageName: 'Podwójny Shot ⚡',
        progressPercent: 65,
        currentCost: '2 100 zł',
        paymentStatus: '● Opłacone',
        adBudget: '1 000 zł',
        tasks: [
            { id: 1, title: 'Audyt profilu i odświeżenie sekcji BIO na Instagramie', category: 'Social Media', status: 'done' },
            { id: 2, title: 'Projekt palety kolorystycznej i szablonów graficznych', category: 'Branding', status: 'done' },
            { id: 3, title: 'Montaż pierwszych 4 dynamicznych Rolek (Reels)', category: 'Wideo & Reels', status: 'progress' },
            { id: 4, title: 'Kodowanie responsywnej strony głównej i kalkulatora', category: 'Strona WWW', status: 'progress' },
            { id: 5, title: 'Konfiguracja kampanii retargetingowej Meta Ads', category: 'Kampanie Ads', status: 'todo' }
        ],
        finances: [
            { id: 1, period: 'Październik 2026', scope: 'Pakiet Podwójny Shot (-30% Partner)', docType: 'Rachunek (0% VAT)', amount: '2 100 zł', status: 'Opłacone ✓' },
            { id: 2, period: 'Październik 2026 (Budżet Ads)', scope: 'Doładowanie konta Meta Ads', docType: 'Bezpośrednio w Meta', amount: '1 000 zł', status: 'Opłacone ✓' }
        ],
        messages: [
            { sender: 'agency', author: 'Wake The Brand ⚡', text: 'Cześć! Witamy w Twoim Panelu Klienta. Tutaj będziesz widzieć postęp wszystkich naszych prac na żywo.', time: 'Start współpracy' },
            { sender: 'agency', author: 'Wake The Brand ⚡', text: 'Wrzuciliśmy do zakładki „Pliki do akceptacji” pierwsze projekty. Daj znać na czacie, jak Ci się podobają!', time: 'Dzisiaj' }
        ]
    };

    function getCurrentTimeStr() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        return `${day}.${month}, ${hours}:${mins}`;
    }

    function isOwnerEmail(email) {
        if (!email) return false;
        return ADMIN_EMAILS.includes(email.trim().toLowerCase());
    }

    function getLocalData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClientData));
            return JSON.parse(JSON.stringify(defaultClientData));
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            return JSON.parse(JSON.stringify(defaultClientData));
        }
    }

    function saveLocalData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getCachedAccounts() {
        const raw = localStorage.getItem(ACCOUNTS_CACHE_KEY);
        if (!raw) return [{ id: 'demo_client', ...getLocalData() }];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ id: 'demo_client', ...getLocalData() }];
        } catch (e) {
            return [{ id: 'demo_client', ...getLocalData() }];
        }
    }

    function saveCachedAccounts(arr) {
        try {
            localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(arr));
        } catch (e) {}
    }

    function getLocalLeads() {
        const raw = localStorage.getItem(LEADS_STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    function saveLocalLead(leadObj) {
        const current = getLocalLeads();
        current.unshift(leadObj);
        localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(current));
    }

    // =========================================================
    // 1. MENU MOBILNE (HAMBURGER) & BANER COOKIES
    // =========================================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    const cookieBanner = document.getElementById('cookieBanner');
    const cookieEssentialBtn = document.getElementById('cookieEssentialBtn');
    const cookieAcceptAllBtn = document.getElementById('cookieAcceptAllBtn');
    const openCookiesBtn = document.getElementById('openCookiesBtn');
    const resetCookiesBtn = document.getElementById('resetCookiesBtn');

    if (cookieBanner) {
        const savedConsent = localStorage.getItem('wtb_cookie_consent');
        if (!savedConsent) {
            cookieBanner.classList.remove('hidden');
        }

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

        if (openCookiesBtn) {
            openCookiesBtn.addEventListener('click', () => {
                cookieBanner.classList.remove('hidden');
            });
        }

        if (resetCookiesBtn) {
            resetCookiesBtn.addEventListener('click', () => {
                localStorage.removeItem('wtb_cookie_consent');
                cookieBanner.classList.remove('hidden');
            });
        }
    }

    // =========================================================
    // 2. SYMULATOR MARKI (index.html), FAQ & KONCEPTY (koncepty.html)
    // =========================================================
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
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                item.classList.toggle('open');
            });
        }
    });

    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    if (filterBtns.length > 0 && portfolioCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');

                portfolioCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    card.style.display = (filterValue === 'all' || filterValue === category) ? 'block' : 'none';
                });
            });
        });
    }

    const conceptDetails = {
        "1": {
            tag: "Strategia Zdalna #1: Turystyka & Noclegi",
            title: "System rezerwacji bezpośrednich bez prowizji pośredników",
            steps: [
                "<strong>Etap 1: Szybka strona WWW z bezpośrednim zapytaniem</strong> – projektujemy nowoczesną witrynę prezentującą pokoje, atuty okolicy i cennik, która zachęca do kontaktu bezpośredniego.",
                "<strong>Etap 2: Krótkie formy wideo (Reels / TikTok)</strong> – z przesłanych przez Ciebie nagrań montujemy klimatyczne rolki pokazujące atmosferę wypoczynku.",
                "<strong>Etap 3: Kampania przed sezonem</strong> – odpalamy celowane reklamy Meta & Google na osoby szukające noclegu, z bonusem za rezerwację bezpośrednią."
            ]
        },
        "2": {
            tag: "Strategia Zdalna #2: Moda, Streetwear & Rękodzieło",
            title: "Budowa zaangażowanej społeczności wokół unikalnego produktu",
            steps: [
                "<strong>Etap 1: Wyrazista identyfikacja wizualna</strong> – tworzymy logo, dobieramy czcionki i estetykę (np. retro / nowoczesny minimalizm), która wyróżnia markę od pierwszej sekundy.",
                "<strong>Etap 2: Kulisy powstawania (Behind The Scenes)</strong> – montujemy dynamiczne Rolki z procesu projektowania, tworzenia i pakowania zamówień.",
                "<strong>Etap 3: Komunikacja dropów i premier</strong> – budujemy napięcie wokół nowych kolekcji i kierujemy ruch prosto na Twoją stronę."
            ]
        },
        "3": {
            tag: "Strategia Zdalna #3: Usługi & Gastronomia",
            title: "Magnes na klientów w promieniu 15 km od Twojej firmy",
            steps: [
                "<strong>Etap 1: Odświeżenie strony WWW i wizytówki Google</strong> – czytelny cennik, szybki formularz i pokazanie efektów Twojej pracy.",
                "<strong>Etap 2: Wideo „Przed i Po”</strong> – dynamiczne rolki prezentujące rezultaty usług lub proces przygotowania flagowego produktu.",
                "<strong>Etap 3: Reklama lokalna</strong> – precyzyjna kampania reklamowa wyświetlana wyłącznie mieszkańcom Twojego miasta i okolic."
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
            const id = btn.getAttribute('data-concept');
            const data = conceptDetails[id];
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
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }

    // =========================================================
    // 3. KALKULATOR WYCENY (wycena.html)
    // =========================================================
    const checkboxes = document.querySelectorAll('.service-checkbox');
    const budgetSlider = document.getElementById('adBudget');
    const budgetValue = document.getElementById('budgetValue');
    const summaryBudget = document.getElementById('summaryBudget');
    const totalPriceEl = document.getElementById('totalPrice');
    const receiptList = document.getElementById('receiptList');
    const billingBtns = document.querySelectorAll('.billing-btn');
    const transferQuoteBtn = document.getElementById('transferQuoteBtn');
    const transferToPanelBtn = document.getElementById('transferToPanelBtn');
    let currentDiscount = 1;

    if (checkboxes.length > 0 && budgetSlider) {
        function calculateTotal() {
            let total = 0;
            if (receiptList) receiptList.innerHTML = '';

            checkboxes.forEach(box => {
                if (box.checked) {
                    const rawPrice = parseInt(box.value, 10);
                    const discountedPrice = Math.round(rawPrice * currentDiscount);
                    total += discountedPrice;

                    if (receiptList) {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${box.getAttribute('data-name')}</span><strong>${discountedPrice} zł</strong>`;
                        receiptList.appendChild(li);
                    }
                }
            });

            if (total === 0 && receiptList) {
                receiptList.innerHTML = '<li><span>Brak wybranych usług</span><strong>0 zł</strong></li>';
            }

            if (totalPriceEl) totalPriceEl.innerText = total;
            if (budgetValue) budgetValue.innerText = `${budgetSlider.value} zł`;
            if (summaryBudget) summaryBudget.innerText = budgetSlider.value;
        }

        billingBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                billingBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDiscount = parseFloat(btn.getAttribute('data-discount'));
                calculateTotal();
            });
        });

        checkboxes.forEach(box => box.addEventListener('change', calculateTotal));
        budgetSlider.addEventListener('input', calculateTotal);
        calculateTotal();

        function buildQuoteObject() {
            const selectedServices = [];
            checkboxes.forEach(box => {
                if (box.checked) selectedServices.push(box.getAttribute('data-name'));
            });
            const servicesText = selectedServices.length > 0 ? selectedServices.join(' + ') : 'Pakiet Indywidualny';
            return {
                servicesText,
                totalCost: `${totalPriceEl.innerText} zł`,
                adBudget: `${budgetSlider.value} zł`,
                fullText: `Cześć Wake The Brand! Wybieram z kalkulatora: ${servicesText}. Szacowany koszt prac: ${totalPriceEl.innerText} zł + budżet reklamowy ok. ${budgetSlider.value} zł.`
            };
        }

        if (transferQuoteBtn) {
            transferQuoteBtn.addEventListener('click', () => {
                const quote = buildQuoteObject();
                localStorage.setItem('wakeTheBrandQuote', quote.fullText);
                window.location.href = 'kontakt.html';
            });
        }

        if (transferToPanelBtn) {
            transferToPanelBtn.addEventListener('click', () => {
                const quote = buildQuoteObject();
                localStorage.setItem('wakeTheBrandQuoteObj', JSON.stringify(quote));
                window.location.href = 'logowanie.html#rejestracja';
            });
        }
    }

    // =========================================================
    // 4. PRZEŁĄCZANIE ZAKŁADEK BOCZNYCH (PANEL KLIENTA / ADMINA)
    // =========================================================
    const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
    const dashTabContents = document.querySelectorAll('.dash-tab-content');
    const activeClientBanner = document.getElementById('activeClientBanner');
    const backToAccountsBtn = document.getElementById('backToAccountsBtn');

    function activateDashTab(targetId) {
        dashNavBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
        });
        dashTabContents.forEach(sec => {
            const isMatch = sec.id === targetId;
            sec.classList.toggle('hidden', !isMatch);
            sec.classList.toggle('active', isMatch);
        });

        if (activeClientBanner) {
            const clientEditTabs = ['admin-tab-status', 'admin-tab-tasks', 'admin-tab-finances', 'admin-tab-chat'];
            if (clientEditTabs.includes(targetId)) {
                activeClientBanner.classList.remove('hidden');
            } else {
                activeClientBanner.classList.add('hidden');
            }
        }
    }

    dashNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activateDashTab(btn.getAttribute('data-tab'));
        });
    });

    if (backToAccountsBtn) {
        backToAccountsBtn.addEventListener('click', () => {
            activateDashTab('admin-tab-accounts');
        });
    }

    document.querySelectorAll('[data-go-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            activateDashTab(btn.getAttribute('data-go-tab'));
        });
    });

    document.querySelectorAll('.switch-to-chat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activateDashTab('tab-chat');
        });
    });

    // =========================================================
    // 5. NATYCHMIASTOWE RENDEROWANIE UI Z PAMIĘCI PODRĘCZNEJ (0.01s)
    // =========================================================
    let auth = null;
    let db = null;
    let fbFns = {};
    let firebaseReady = false;
    let currentLoggedInAdminEmail = localStorage.getItem('wtb_admin_email') || CONTACT_RECEIVER_EMAIL;

    const adminEmailLabelEl = document.getElementById('loggedInAdminEmail');
    if (adminEmailLabelEl) {
        adminEmailLabelEl.innerText = currentLoggedInAdminEmail;
    }

    function statusBadgeHTML(status) {
        if (status === 'done') return '<span class="badge-status done">✓ Zrobione</span>';
        if (status === 'progress') return '<span class="badge-status progress">⏳ W trakcie</span>';
        return '<span class="badge-status todo">📋 Zaplanowane</span>';
    }

    async function saveClientData(clientId, dataObj) {
        saveLocalData(dataObj);
        // Zaktualizuj również szybki cache wszystkich kont
        const cached = getCachedAccounts();
        const idx = cached.findIndex(a => a.id === clientId);
        if (idx >= 0) {
            cached[idx] = { id: clientId, ...dataObj };
        } else {
            cached.push({ id: clientId, ...dataObj });
        }
        saveCachedAccounts(cached);

        if (firebaseReady && db && clientId) {
            try {
                const docRef = fbFns.doc(db, 'clients', clientId);
                await fbFns.setDoc(docRef, dataObj, { merge: true });
            } catch (e) {
                console.error('Błąd zapisu do Firestore:', e);
            }
        }
    }

    // =========================================================
    // 6. ELEMENTY PANELU KLIENTA I ADMINA (PRZYGOTOWANIE PRZED POŁĄCZENIEM)
    // =========================================================
    const clientTopName = document.getElementById('clientTopName');
    const clientWelcomeTitle = document.getElementById('clientWelcomeTitle');
    const clientActivePackage = document.getElementById('clientActivePackage');
    const clientProgressPercent = document.getElementById('clientProgressPercent');
    const clientProgressBar = document.getElementById('clientProgressBar');
    const clientCurrentCost = document.getElementById('clientCurrentCost');
    const clientPaymentStatus = document.getElementById('clientPaymentStatus');
    const clientAdBudget = document.getElementById('clientAdBudget');
    const overviewTaskList = document.getElementById('overviewTaskList');
    const clientFullTaskList = document.getElementById('clientFullTaskList');
    const clientFinanceTable = document.getElementById('clientFinanceTable');
    const clientChatBox = document.getElementById('clientChatBox');
    const clientChatForm = document.getElementById('clientChatForm');
    const clientChatInput = document.getElementById('clientChatInput');
    const latestMsgPreview = document.getElementById('latestMsgPreview');

    let currentClientId = localStorage.getItem('wtb_active_uid') || 'demo_client';
    let currentClientCache = getLocalData();

    function renderClientUI(data) {
        if (!clientActivePackage) return;
        currentClientCache = data;
        saveLocalData(data);

        if (clientTopName) clientTopName.innerText = data.clientName || 'Konto Klienta';
        if (clientWelcomeTitle) clientWelcomeTitle.innerText = `Cześć! Oto aktualny status dla: ${data.clientName} ⚡`;
        if (clientActivePackage) clientActivePackage.innerText = data.packageName;
        if (clientProgressPercent) clientProgressPercent.innerText = data.progressPercent;
        if (clientProgressBar) clientProgressBar.style.width = `${data.progressPercent}%`;
        if (clientCurrentCost) clientCurrentCost.innerText = data.currentCost;
        if (clientPaymentStatus) clientPaymentStatus.innerText = data.paymentStatus;
        if (clientAdBudget) clientAdBudget.innerText = data.adBudget;

        const tasks = data.tasks || [];
        if (overviewTaskList) {
            overviewTaskList.innerHTML = tasks.slice(0, 4).map(t => `
                <li class="dash-task-item">
                    <div class="task-meta">
                        <strong>${t.title}</strong>
                        <small>${t.category}</small>
                    </div>
                    ${statusBadgeHTML(t.status)}
                </li>
            `).join('');
        }

        if (clientFullTaskList) {
            clientFullTaskList.innerHTML = tasks.map(t => `
                <li class="dash-task-item">
                    <div class="task-meta">
                        <strong>${t.title}</strong>
                        <small>Obszar: ${t.category}</small>
                    </div>
                    ${statusBadgeHTML(t.status)}
                </li>
            `).join('');
        }

        const finances = data.finances || [];
        if (clientFinanceTable) {
            clientFinanceTable.innerHTML = finances.map(f => `
                <tr>
                    <td><strong>${f.period}</strong></td>
                    <td>${f.scope}</td>
                    <td>${f.docType}</td>
                    <td class="highlight-col">${f.amount}</td>
                    <td>${f.status}</td>
                </tr>
            `).join('');
        }

        const messages = data.messages || [];
        if (latestMsgPreview && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            latestMsgPreview.innerHTML = `
                <strong>${lastMsg.author}</strong>
                <p>„${lastMsg.text}”</p>
                <span class="msg-time">${lastMsg.time}</span>
            `;
        }

        if (clientChatBox) {
            clientChatBox.innerHTML = messages.map(m => `
                <div class="chat-bubble ${m.sender === 'agency' ? 'from-agency' : 'from-client'}">
                    <span class="chat-sender">${m.author} • ${m.time}</span>
                    <div>${m.text}</div>
                </div>
            `).join('');
            clientChatBox.scrollTop = clientChatBox.scrollHeight;
        }
    }

    // Natychmiastowe wyrenderowanie Panelu Klienta przed połączeniem z siecią
    if (clientActivePackage) {
        renderClientUI(currentClientCache);
    }

    // Elementy Panelu Admina
    const adminStatusForm = document.getElementById('adminStatusForm');
    const adminClientSelector = document.getElementById('adminClientSelector');
    const bannerClientName = document.getElementById('bannerClientName');
    const adminClientName = document.getElementById('adminClientName');
    const adminPackageName = document.getElementById('adminPackageName');
    const adminProgressSlider = document.getElementById('adminProgressSlider');
    const adminProgressVal = document.getElementById('adminProgressVal');
    const adminCurrentCost = document.getElementById('adminCurrentCost');
    const adminPaymentStatus = document.getElementById('adminPaymentStatus');
    const adminAdBudget = document.getElementById('adminAdBudget');
    const adminStatusFeedback = document.getElementById('adminStatusFeedback');

    const adminAccountsList = document.getElementById('adminAccountsList');
    const adminAccountSearch = document.getElementById('adminAccountSearch');
    const adminRoleFilter = document.getElementById('adminRoleFilter');
    const adminAccountActionFeedback = document.getElementById('adminAccountActionFeedback');

    const statTotalAccounts = document.getElementById('statTotalAccounts');
    const statClientAccounts = document.getElementById('statClientAccounts');
    const statAdminAccounts = document.getElementById('statAdminAccounts');
    const statTotalLeads = document.getElementById('statTotalLeads');

    const adminAddTaskForm = document.getElementById('adminAddTaskForm');
    const adminTaskList = document.getElementById('adminTaskList');
    const adminAddFinanceForm = document.getElementById('adminAddFinanceForm');
    const adminFinanceList = document.getElementById('adminFinanceList');
    const adminChatBox = document.getElementById('adminChatBox');
    const adminChatForm = document.getElementById('adminChatForm');
    const adminChatInput = document.getElementById('adminChatInput');
    const adminLeadsList = document.getElementById('adminLeadsList');
    const resetDemoDataBtn = document.getElementById('resetDemoDataBtn');

    const adminSecurityModal = document.getElementById('adminSecurityModal');
    const closeSecurityModal = document.getElementById('closeSecurityModal');
    const cancelSecurityBtn = document.getElementById('cancelSecurityBtn');
    const adminSecurityForm = document.getElementById('adminSecurityForm');
    const confirmAdminPassInput = document.getElementById('confirmAdminPassInput');
    const confirmAdminEmailLabel = document.getElementById('confirmAdminEmailLabel');
    const securityModalTitle = document.getElementById('securityModalTitle');
    const securityModalDesc = document.getElementById('securityModalDesc');
    const securityModalFeedback = document.getElementById('securityModalFeedback');

    let allAccountsCache = getCachedAccounts();
    let selectedAdminClientId = localStorage.getItem('wtb_active_uid') || allAccountsCache[0].id || 'demo_client';
    let selectedAdminClientData = allAccountsCache.find(a => a.id === selectedAdminClientId) || getLocalData();
    let unsubscribeAdminClient = null;
    let pendingSecurityAction = null;

    function openSecurityPrompt({ title, description, onConfirm }) {
        if (!adminSecurityModal) return;
        securityModalTitle.innerText = title;
        securityModalDesc.innerText = description;
        if (confirmAdminEmailLabel) {
            confirmAdminEmailLabel.innerText = currentLoggedInAdminEmail;
        }
        confirmAdminPassInput.value = '';
        securityModalFeedback.innerText = '';
        pendingSecurityAction = onConfirm;
        adminSecurityModal.classList.add('open');
        confirmAdminPassInput.focus();
    }

    function closeSecurityPrompt() {
        if (adminSecurityModal) adminSecurityModal.classList.remove('open');
        pendingSecurityAction = null;
    }

    if (closeSecurityModal) closeSecurityModal.addEventListener('click', closeSecurityPrompt);
    if (cancelSecurityBtn) cancelSecurityBtn.addEventListener('click', closeSecurityPrompt);

    function populateSelectorFromCache() {
        if (!adminClientSelector) return;
        adminClientSelector.innerHTML = '';
        allAccountsCache.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.innerText = `${acc.clientName || acc.id} (${acc.packageName || 'Pakiet'})`;
            adminClientSelector.appendChild(opt);
        });
        const exists = allAccountsCache.some(a => a.id === selectedAdminClientId);
        if (!exists && allAccountsCache.length > 0) {
            selectedAdminClientId = allAccountsCache[0].id;
        }
        adminClientSelector.value = selectedAdminClientId;
    }

    function renderAllAccountsList() {
        if (!adminAccountsList) return;

        const searchQuery = (adminAccountSearch ? adminAccountSearch.value : '').trim().toLowerCase();
        const roleFilter = adminRoleFilter ? adminRoleFilter.value : 'all';

        let totalCount = allAccountsCache.length;
        let adminsCount = 0;
        let clientsCount = 0;

        allAccountsCache.forEach(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            if (isAccAdmin) adminsCount++;
            else clientsCount++;
        });

        if (statTotalAccounts) statTotalAccounts.innerText = totalCount;
        if (statAdminAccounts) statAdminAccounts.innerText = adminsCount;
        if (statClientAccounts) statClientAccounts.innerText = clientsCount;

        const filtered = allAccountsCache.filter(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            const isBlocked = acc.isBlocked === true;

            if (roleFilter === 'admin' && !isAccAdmin) return false;
            if (roleFilter === 'client' && isAccAdmin) return false;
            if (roleFilter === 'blocked' && !isBlocked) return false;

            if (searchQuery) {
                const haystack = `${acc.clientName || ''} ${acc.userName || ''} ${acc.email || ''} ${acc.packageName || ''}`.toLowerCase();
                if (!haystack.includes(searchQuery)) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            adminAccountsList.innerHTML = `
                <div class="account-card-row">
                    <span style="color: var(--text-muted);">Brak kont spełniających kryteria wyszukiwania.</span>
                </div>
            `;
            return;
        }

        adminAccountsList.innerHTML = filtered.map(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            const isProtectedOwner = isOwnerEmail(acc.email);
            const isBlocked = acc.isBlocked === true;
            const isSelected = acc.id === selectedAdminClientId;

            const roleBadge = isAccAdmin
                ? '<span class="role-pill admin-role">👑 Administrator</span>'
                : '<span class="role-pill client-role">👤 Klient</span>';

            const blockedBadge = isBlocked
                ? '<span class="role-pill blocked-role">⛔ Zablokowane</span>'
                : '';

            const toggleRoleBtnText = isAccAdmin ? '👤 Odbierz Admina' : '👑 Nadaj Admina';
            const toggleBlockBtnText = isBlocked ? '🔓 Odblokuj' : '⛔ Zablokuj';

            return `
                <div class="account-card-row ${isSelected ? 'selected-account' : ''}">
                    <div class="account-main-info">
                        <div class="account-title-line">
                            <strong style="font-size: 1.05rem;">${acc.clientName || 'Bez nazwy'}</strong>
                            ${roleBadge}
                            ${blockedBadge}
                        </div>
                        <div class="account-meta-line">
                            <span>📧 ${acc.email || 'Brak e-maila'}</span>
                            <span>📦 ${acc.packageName || 'Brak pakietu'}</span>
                            <span>📊 Postęp: <strong>${acc.progressPercent ?? 0}%</strong></span>
                            <span>🧾 ${acc.currentCost || '0 zł'} (${acc.paymentStatus || 'Status'})</span>
                        </div>
                    </div>

                    <div class="account-actions">
                        <button type="button" class="btn-mini btn-manage" data-manage-uid="${acc.id}">
                            🎛️ Otwórz panel klienta →
                        </button>
                        ${!isProtectedOwner ? `
                            <button type="button" class="btn-mini" data-toggle-admin="${acc.id}">
                                ${toggleRoleBtnText}
                            </button>
                            <button type="button" class="btn-mini" data-toggle-block="${acc.id}">
                                ${toggleBlockBtnText}
                            </button>
                        ` : `
                            <span style="font-size: 0.75rem; color: var(--text-muted); padding: 0 0.4rem;">Główne konto właściciela</span>
                        `}
                        <button type="button" class="btn-mini" data-reset-pass="${acc.email || ''}">
                            🔑 Reset hasła
                        </button>
                        ${!isProtectedOwner && acc.id !== 'demo_client' ? `
                            <button type="button" class="btn-mini btn-danger" data-delete-uid="${acc.id}">
                                🗑️ Usuń
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        adminAccountsList.querySelectorAll('[data-manage-uid]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.getAttribute('data-manage-uid');
                if (adminClientSelector) adminClientSelector.value = uid;
                subscribeToSelectedClient(uid);
                activateDashTab('admin-tab-status');
            });
        });

        adminAccountsList.querySelectorAll('[data-toggle-admin]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.getAttribute('data-toggle-admin');
                const targetAcc = allAccountsCache.find(a => a.id === uid);
                if (!targetAcc) return;

                const newAdminState = !targetAcc.isAdminRole;
                const roleName = newAdminState ? 'ADMINISTRATOR (pełny dostęp do HQ)' : 'KLIENT (zwykłe konto)';

                openSecurityPrompt({
                    title: newAdminState ? '👑 Nadaj uprawnienia Admina' : '👤 Odbierz uprawnienia Admina',
                    description: `Czy na pewno chcesz zmienić uprawnienia konta „${targetAcc.clientName}” (${targetAcc.email}) na: ${roleName}? Potwierdź swoim hasłem Administratora.`,
                    onConfirm: async () => {
                        targetAcc.isAdminRole = newAdminState;
                        await saveClientData(uid, targetAcc);
                        if (adminAccountActionFeedback) {
                            adminAccountActionFeedback.style.color = '#d4ff00';
                            adminAccountActionFeedback.innerText = `✅ Zaktualizowano uprawnienia konta ${targetAcc.clientName} na: ${roleName}!`;
                        }
                        renderAllAccountsList();
                    }
                });
            });
        });

        adminAccountsList.querySelectorAll('[data-toggle-block]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.getAttribute('data-toggle-block');
                const targetAcc = allAccountsCache.find(a => a.id === uid);
                if (!targetAcc) return;

                const newBlockedState = !targetAcc.isBlocked;

                openSecurityPrompt({
                    title: newBlockedState ? '⛔ Zablokuj dostęp do konta' : '🔓 Odblokuj konto klienta',
                    description: `Czy na pewno chcesz ${newBlockedState ? 'ZABLOKOWAĆ' : 'ODBLOKOWAĆ'} konto „${targetAcc.clientName}” (${targetAcc.email})? Potwierdź swoim hasłem Administratora.`,
                    onConfirm: async () => {
                        targetAcc.isBlocked = newBlockedState;
                        await saveClientData(uid, targetAcc);
                        if (adminAccountActionFeedback) {
                            adminAccountActionFeedback.style.color = '#d4ff00';
                            adminAccountActionFeedback.innerText = `✅ Konto ${targetAcc.clientName} zostało ${newBlockedState ? 'zablokowane' : 'odblokowane'}.`;
                        }
                        renderAllAccountsList();
                    }
                });
            });
        });

        adminAccountsList.querySelectorAll('[data-reset-pass]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetEmail = btn.getAttribute('data-reset-pass');
                if (!targetEmail || !firebaseReady || !auth) return;
                try {
                    await fbFns.sendPasswordResetEmail(auth, targetEmail);
                    if (adminAccountActionFeedback) {
                        adminAccountActionFeedback.style.color = '#d4ff00';
                        adminAccountActionFeedback.innerText = `🔑 Wysłano link do resetowania hasła na adres: ${targetEmail}`;
                    }
                } catch (e) {
                    if (adminAccountActionFeedback) {
                        adminAccountActionFeedback.style.color = '#fca5a5';
                        adminAccountActionFeedback.innerText = `Nie udało się wysłać linku na ${targetEmail}.`;
                    }
                }
            });
        });

        adminAccountsList.querySelectorAll('[data-delete-uid]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.getAttribute('data-delete-uid');
                const targetAcc = allAccountsCache.find(a => a.id === uid);
                if (!targetAcc) return;

                openSecurityPrompt({
                    title: '🗑️ Trwałe usunięcie konta z bazy',
                    description: `Czy na pewno chcesz bezpowrotnie usunąć profil „${targetAcc.clientName}” (${targetAcc.email})? Potwierdź hasłem Administratora.`,
                    onConfirm: async () => {
                        allAccountsCache = allAccountsCache.filter(a => a.id !== uid);
                        saveCachedAccounts(allAccountsCache);
                        renderAllAccountsList();
                        if (firebaseReady && db) {
                            await fbFns.deleteDoc(fbFns.doc(db, 'clients', uid));
                        }
                        if (adminAccountActionFeedback) {
                            adminAccountActionFeedback.style.color = '#d4ff00';
                            adminAccountActionFeedback.innerText = `🗑️ Usunięto konto ${targetAcc.clientName} z bazy danych.`;
                        }
                    }
                });
            });
        });
    }

    function renderLeadsListUI(leadsArray) {
        if (statTotalLeads) statTotalLeads.innerText = leadsArray ? leadsArray.length : 0;
        if (!adminLeadsList) return;
        if (!leadsArray || leadsArray.length === 0) {
            adminLeadsList.innerHTML = '<li class="dash-task-item"><span>Brak zapytań z formularza kontaktowego.</span></li>';
            return;
        }
        adminLeadsList.innerHTML = leadsArray.map(lead => `
            <li class="dash-task-item" style="align-items: flex-start;">
                <div class="task-meta">
                    <strong>${lead.name} (${lead.email}) • <span style="color: var(--accent-lime);">${lead.topics}</span></strong>
                    <p style="margin: 0.4rem 0; color: #d1d5db;">${lead.message}</p>
                    <small>Wysłano: ${lead.createdAt}</small>
                </div>
                <button type="button" class="admin-action-btn" data-del-lead="${lead.id}">Usuń</button>
            </li>
        `).join('');

        adminLeadsList.querySelectorAll('[data-del-lead]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const leadId = btn.getAttribute('data-del-lead');
                const localFiltered = getLocalLeads().filter(l => l.id !== leadId);
                localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(localFiltered));
                renderLeadsListUI(localFiltered);

                if (firebaseReady && db) {
                    try {
                        await fbFns.deleteDoc(fbFns.doc(db, 'contact_leads', leadId));
                    } catch (e) {}
                }
            });
        });
    }

    function renderAdminUI(data) {
        if (!adminStatusForm) return;
        selectedAdminClientData = data;

        if (bannerClientName) bannerClientName.innerText = `${data.clientName || 'Konto'} (${data.email || 'brak e-maila'})`;
        adminClientName.value = data.clientName || '';
        adminPackageName.value = data.packageName || '';
        adminProgressSlider.value = data.progressPercent ?? 50;
        adminProgressVal.innerText = `${data.progressPercent ?? 50}%`;
        adminCurrentCost.value = data.currentCost || '';
        adminPaymentStatus.value = data.paymentStatus || '● Opłacone';
        adminAdBudget.value = data.adBudget || '';

        const tasks = data.tasks || [];
        if (adminTaskList) {
            adminTaskList.innerHTML = tasks.map((t, index) => `
                <li class="dash-task-item">
                    <div class="task-meta">
                        <strong>${t.title}</strong>
                        <small>${t.category}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button type="button" class="btn-mini" data-cycle-task="${index}" title="Kliknij, aby zmienić status">
                            ${statusBadgeHTML(t.status)}
                        </button>
                        <button type="button" class="admin-action-btn" data-del-task="${index}">Usuń</button>
                    </div>
                </li>
            `).join('');

            adminTaskList.querySelectorAll('[data-cycle-task]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-cycle-task'), 10);
                    const currentStatus = selectedAdminClientData.tasks[idx].status;
                    const nextStatus = currentStatus === 'todo' ? 'progress' : (currentStatus === 'progress' ? 'done' : 'todo');
                    selectedAdminClientData.tasks[idx].status = nextStatus;
                    renderAdminUI(selectedAdminClientData);
                    await saveClientData(selectedAdminClientId, selectedAdminClientData);
                });
            });

            adminTaskList.querySelectorAll('[data-del-task]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-del-task'), 10);
                    selectedAdminClientData.tasks.splice(idx, 1);
                    renderAdminUI(selectedAdminClientData);
                    await saveClientData(selectedAdminClientId, selectedAdminClientData);
                });
            });
        }

        const finances = data.finances || [];
        if (adminFinanceList) {
            adminFinanceList.innerHTML = finances.map((f, index) => `
                <li class="dash-task-item">
                    <div class="task-meta">
                        <strong>${f.period} – ${f.amount}</strong>
                        <small>${f.scope} (${f.docType}) • ${f.status}</small>
                    </div>
                    <button type="button" class="admin-action-btn" data-del-fin="${index}">Usuń</button>
                </li>
            `).join('');

            adminFinanceList.querySelectorAll('[data-del-fin]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-del-fin'), 10);
                    selectedAdminClientData.finances.splice(idx, 1);
                    renderAdminUI(selectedAdminClientData);
                    await saveClientData(selectedAdminClientId, selectedAdminClientData);
                });
            });
        }

        const messages = data.messages || [];
        if (adminChatBox) {
            adminChatBox.innerHTML = messages.map(m => `
                <div class="chat-bubble ${m.sender === 'agency' ? 'from-client' : 'from-agency'}">
                    <span class="chat-sender">${m.author} • ${m.time}</span>
                    <div>${m.text}</div>
                </div>
            `).join('');
            adminChatBox.scrollTop = adminChatBox.scrollHeight;
        }
    }

    function subscribeToSelectedClient(clientId) {
        selectedAdminClientId = clientId;
        localStorage.setItem('wtb_active_uid', clientId);

        const cachedMatch = allAccountsCache.find(a => a.id === clientId);
        if (cachedMatch) {
            renderAdminUI(cachedMatch);
        }
        renderAllAccountsList();

        if (unsubscribeAdminClient) {
            unsubscribeAdminClient();
        }

        if (firebaseReady && db) {
            const docRef = fbFns.doc(db, 'clients', clientId);
            unsubscribeAdminClient = fbFns.onSnapshot(docRef, (snap) => {
                if (snap.exists()) {
                    renderAdminUI(snap.data());
                }
            });
        }
    }

    // Natychmiastowe wyrenderowanie Panelu Admina z pamięci podręcznej (0.01s)
    if (adminStatusForm) {
        populateSelectorFromCache();
        renderAllAccountsList();
        renderAdminUI(selectedAdminClientData);
        renderLeadsListUI(getLocalLeads());
    }

    if (adminAccountSearch) {
        adminAccountSearch.addEventListener('input', renderAllAccountsList);
    }
    if (adminRoleFilter) {
        adminRoleFilter.addEventListener('change', renderAllAccountsList);
    }
    if (adminClientSelector) {
        adminClientSelector.addEventListener('change', () => {
            subscribeToSelectedClient(adminClientSelector.value);
        });
    }

    // =========================================================
    // 7. SZYBKA RÓWNOLEGŁA INICJALIZACJA FIREBASE (PROMISE.ALL + BRAVE FIX)
    // =========================================================
    try {
        // Pobieramy wszystkie 3 biblioteki RÓWNOLEGLE (3x szybciej niż po kolei!)
        const [appMod, authMod, firestoreMod] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
        ]);

        const app = appMod.initializeApp(firebaseConfig);
        auth = authMod.getAuth(app);

        // Specjalna optymalizacja dla przeglądarki Brave i szybkiego łączenia (omija wieszanie się WebChannel)
        db = firestoreMod.initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true
        });

        fbFns = {
            ...authMod,
            ...firestoreMod
        };
        firebaseReady = true;

        const statusEl = document.getElementById('firebaseStatusText');
        if (statusEl) {
            statusEl.style.color = '#d4ff00';
            statusEl.innerText = '● Połączono z Firebase (Turbo Sync)';
        }

        // Poczekaj ułamek sekundy na gotowość sesji Auth przed odpytaniem bazy
        if (typeof auth.authStateReady === 'function') {
            await auth.authStateReady();
        }

        if (auth.currentUser && auth.currentUser.email) {
            currentLoggedInAdminEmail = auth.currentUser.email;
            localStorage.setItem('wtb_admin_email', auth.currentUser.email);
            if (adminEmailLabelEl) adminEmailLabelEl.innerText = currentLoggedInAdminEmail;
        }

        // A) Jeśli jesteśmy w Panelu Klienta – podłącz strumień na żywo
        if (clientActivePackage) {
            if (auth.currentUser) {
                currentClientId = auth.currentUser.uid;
                localStorage.setItem('wtb_active_uid', currentClientId);
            }
            const docRef = fbFns.doc(db, 'clients', currentClientId);
            fbFns.onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    renderClientUI(docSnap.data());
                }
            });
        }

        // B) Jeśli jesteśmy w Panelu Admina – pobierz wszystkie konta i zgłoszenia w tle
        if (adminStatusForm) {
            const clientsCol = fbFns.collection(db, 'clients');
            fbFns.onSnapshot(clientsCol, async (colSnap) => {
                if (colSnap.empty) {
                    await saveClientData('demo_client', defaultClientData);
                    return;
                }

                const freshAccounts = [];
                colSnap.forEach(docSnap => {
                    freshAccounts.push({ id: docSnap.id, ...docSnap.data() });
                });

                allAccountsCache = freshAccounts;
                saveCachedAccounts(freshAccounts);
                populateSelectorFromCache();
                renderAllAccountsList();

                const activeDoc = freshAccounts.find(a => a.id === selectedAdminClientId) || freshAccounts[0];
                if (activeDoc) {
                    selectedAdminClientId = activeDoc.id;
                    renderAdminUI(activeDoc);
                }
            });

            if (adminLeadsList) {
                const leadsCol = fbFns.collection(db, 'contact_leads');
                fbFns.onSnapshot(leadsCol, (leadsSnap) => {
                    if (leadsSnap.empty) {
                        renderLeadsListUI(getLocalLeads());
                        return;
                    }
                    const leadsArr = [];
                    leadsSnap.forEach(l => leadsArr.push({ id: l.id, ...l.data() }));
                    leadsArr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leadsArr));
                    renderLeadsListUI(leadsArr);
                });
            }
        }
    } catch (err) {
        console.warn('Praca w trybie lokalnym Cache:', err);
        const statusEl = document.getElementById('firebaseStatusText');
        if (statusEl) {
            statusEl.innerText = '● Tryb lokalny Cache';
        }
    }

    // =========================================================
    // 8. OBSŁUGA FORMULARZY (KONTAKT, LOGOWANIE, REJESTRACJA, AKCJE ADMINA)
    // =========================================================
    const topicPills = document.querySelectorAll('.topic-pill');
    const contactForm = document.getElementById('contactForm');
    const messageInput = document.getElementById('message');
    const formFeedback = document.getElementById('formFeedback');

    topicPills.forEach(pill => {
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
        });
    });

    if (messageInput) {
        const savedQuote = localStorage.getItem('wakeTheBrandQuote');
        if (savedQuote) {
            messageInput.value = savedQuote;
            localStorage.removeItem('wakeTheBrandQuote');
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const msgVal = document.getElementById('message').value.trim();

            const activeTopics = [];
            topicPills.forEach(pill => {
                if (pill.classList.contains('active')) activeTopics.push(pill.innerText);
            });
            const topicsStr = activeTopics.join(', ') || 'Ogólne';

            formFeedback.style.color = '#d4ff00';
            formFeedback.innerText = 'Wysyłanie wiadomości... ⏳';

            const leadObj = {
                id: 'lead_' + Date.now(),
                name,
                email,
                topics: topicsStr,
                message: msgVal,
                createdAt: getCurrentTimeStr(),
                timestamp: Date.now()
            };

            saveLocalLead(leadObj);

            if (firebaseReady && db) {
                try {
                    await fbFns.addDoc(fbFns.collection(db, 'contact_leads'), leadObj);
                } catch (err) {
                    console.error('Błąd zapisu formularza w Firebase:', err);
                }
            }

            if (window.location.protocol !== 'file:') {
                fetch(`https://formsubmit.co/ajax/${CONTACT_RECEIVER_EMAIL}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        _subject: `⚡ Nowe zapytanie Wake The Brand od: ${name}`,
                        _replyto: email,
                        Imie_lub_Firma: name,
                        Kontakt_Klienta: email,
                        Wybrane_Tematy: topicsStr,
                        Wiadomosc: msgVal,
                        _template: 'table'
                    })
                }).catch(() => {});
            }

            formFeedback.style.color = '#d4ff00';
            formFeedback.innerText = `Dzięki, ${name}! Twoje zgłoszenie zostało zapisane w bazie i wysłane na ${CONTACT_RECEIVER_EMAIL} ⚡ Odpowiemy w ciągu 24h!`;
            contactForm.reset();
        });
    }

    // Logowanie i Rejestracja
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const savedQuoteAlert = document.getElementById('savedQuoteAlert');
    const savedQuoteText = document.getElementById('savedQuoteText');
    const regPackage = document.getElementById('regPackage');
    const forgotPassBtn = document.getElementById('forgotPassBtn');

    function switchToRegisterTab() {
        if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    function switchToLoginTab() {
        if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        }
    }

    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener('click', switchToLoginTab);
        tabRegisterBtn.addEventListener('click', switchToRegisterTab);

        const savedQuoteObjRaw = localStorage.getItem('wakeTheBrandQuoteObj');
        if (window.location.hash === '#rejestracja' || savedQuoteObjRaw) {
            switchToRegisterTab();
        }

        if (savedQuoteObjRaw && savedQuoteAlert && regPackage) {
            try {
                const quoteObj = JSON.parse(savedQuoteObjRaw);
                savedQuoteAlert.classList.remove('hidden');
                savedQuoteText.innerText = `Wybrano: ${quoteObj.servicesText} (${quoteObj.totalCost} + budżet Ads ${quoteObj.adBudget}). Załóż konto poniżej, aby zapisać ten pakiet w swoim Panelu Klienta.`;
                regPackage.value = `${quoteObj.servicesText} (${quoteObj.totalCost})`;
            } catch (e) {}
        }
    }

    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', async () => {
            const emailVal = document.getElementById('loginEmail').value.trim();
            const loginFeedback = document.getElementById('loginFeedback');
            if (!emailVal) {
                loginFeedback.style.color = '#ffb074';
                loginFeedback.innerText = 'Wpisz najpierw swój adres e-mail w polu powyżej, aby zresetować hasło.';
                return;
            }
            if (firebaseReady && auth) {
                try {
                    await fbFns.sendPasswordResetEmail(auth, emailVal);
                    loginFeedback.style.color = '#d4ff00';
                    loginFeedback.innerText = `Link do resetu hasła został wysłany na adres: ${emailVal} ⚡`;
                } catch (err) {
                    loginFeedback.style.color = '#fca5a5';
                    loginFeedback.innerText = 'Nie znaleziono konta o tym adresie e-mail.';
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

            loginFeedback.style.color = '#d4ff00';
            loginFeedback.innerText = 'Logowanie... ⚡';

            if (firebaseReady && auth && db) {
                try {
                    const userCred = await fbFns.signInWithEmailAndPassword(auth, email, password);
                    const uid = userCred.user.uid;
                    localStorage.setItem('wtb_active_uid', uid);

                    let userDocData = null;
                    try {
                        const snap = await fbFns.getDoc(fbFns.doc(db, 'clients', uid));
                        if (snap.exists()) {
                            userDocData = snap.data();
                            saveLocalData(userDocData);
                        }
                    } catch (e) {}

                    if (userDocData && userDocData.isBlocked) {
                        await fbFns.signOut(auth);
                        loginFeedback.style.color = '#fca5a5';
                        loginFeedback.innerText = '⛔ To konto zostało zawieszone przez Administratora.';
                        return;
                    }

                    const hasAdminRights = isOwnerEmail(email) || (userDocData && userDocData.isAdminRole === true);

                    if (hasAdminRights) {
                        localStorage.setItem('wtb_admin_email', email);
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'panel-klienta.html';
                    }
                } catch (err) {
                    loginFeedback.style.color = '#fca5a5';
                    loginFeedback.innerText = 'Błędny e-mail lub hasło.';
                }
            } else {
                window.location.href = isOwnerEmail(email) ? 'admin.html' : 'panel-klienta.html';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const brand = document.getElementById('regBrand').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;
            const pkg = document.getElementById('regPackage').value.trim() || 'Pakiet Startowy ⚡';
            const registerFeedback = document.getElementById('registerFeedback');

            registerFeedback.style.color = '#d4ff00';
            registerFeedback.innerText = 'Tworzenie konta... ⚡';

            const isInitialAdmin = isOwnerEmail(email);

            const newClientDoc = JSON.parse(JSON.stringify(defaultClientData));
            newClientDoc.userName = name;
            newClientDoc.clientName = `${brand} (${name})`;
            newClientDoc.email = email;
            newClientDoc.isAdminRole = isInitialAdmin;
            newClientDoc.isBlocked = false;
            newClientDoc.createdAt = getCurrentTimeStr();
            newClientDoc.packageName = pkg;
            newClientDoc.progressPercent = 15;

            const savedQuoteObjRaw = localStorage.getItem('wakeTheBrandQuoteObj');
            if (savedQuoteObjRaw) {
                try {
                    const quoteObj = JSON.parse(savedQuoteObjRaw);
                    newClientDoc.currentCost = quoteObj.totalCost;
                    newClientDoc.adBudget = quoteObj.adBudget;
                    localStorage.removeItem('wakeTheBrandQuoteObj');
                } catch (err) {}
            }

            newClientDoc.messages.push({
                sender: 'client',
                author: `${name} (${brand})`,
                text: `Cześć! Właśnie utworzyłem konto w Strefie Klienta. Mój wybrany pakiet/cel: ${pkg}.`,
                time: getCurrentTimeStr()
            });

            if (firebaseReady && auth && db) {
                try {
                    const userCred = await fbFns.createUserWithEmailAndPassword(auth, email, password);
                    const uid = userCred.user.uid;
                    localStorage.setItem('wtb_active_uid', uid);

                    await saveClientData(uid, newClientDoc);

                    if (isInitialAdmin) {
                        localStorage.setItem('wtb_admin_email', email);
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'panel-klienta.html';
                    }
                } catch (err) {
                    registerFeedback.style.color = '#fca5a5';
                    if (err.code === 'auth/email-already-in-use') {
                        registerFeedback.innerText = 'Ten adres e-mail ma już konto! Przełącz się na zakładkę „Zaloguj się”.';
                    } else {
                        registerFeedback.innerText = `Błąd rejestracji: ${err.message}`;
                    }
                }
            } else {
                saveLocalData(newClientDoc);
                window.location.href = 'panel-klienta.html';
            }
        });
    }

    // Potwierdzenie hasłem Admina w modalu bezpieczeństwa
    if (adminSecurityForm) {
        adminSecurityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredPass = confirmAdminPassInput.value;
            if (!enteredPass || !pendingSecurityAction) return;

            securityModalFeedback.style.color = '#d4ff00';
            securityModalFeedback.innerText = 'Weryfikacja hasła... ⚡';

            try {
                if (firebaseReady && auth) {
                    const emailToVerify = (auth.currentUser && auth.currentUser.email)
                        ? auth.currentUser.email
                        : currentLoggedInAdminEmail;

                    await fbFns.signInWithEmailAndPassword(auth, emailToVerify, enteredPass);
                }

                await pendingSecurityAction();
                closeSecurityPrompt();
            } catch (err) {
                securityModalFeedback.style.color = '#fca5a5';
                securityModalFeedback.innerText = '❌ Błędne hasło Administratora! Operacja odrzucona.';
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    [logoutBtn, adminLogoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (firebaseReady && auth) {
                    await fbFns.signOut(auth);
                }
                localStorage.removeItem('wtb_active_uid');
                window.location.href = 'logowanie.html';
            });
        }
    });

    if (clientChatForm && clientChatInput) {
        clientChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = clientChatInput.value.trim();
            if (!text) return;

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: text,
                time: getCurrentTimeStr()
            });

            clientChatInput.value = '';
            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);
        });
    }

    document.querySelectorAll('.approve-file-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const cardTitle = btn.closest('.service-card').querySelector('h3').innerText;
            btn.innerText = 'Zaakceptowano ✓';
            btn.disabled = true;

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `✅ Zaakceptowałem materiał w panelu: „${cardTitle}”. Możemy działać dalej!`,
                time: getCurrentTimeStr()
            });

            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);
        });
    });

    if (adminProgressSlider && adminProgressVal) {
        adminProgressSlider.addEventListener('input', () => {
            adminProgressVal.innerText = `${adminProgressSlider.value}%`;
        });
    }

    if (adminStatusForm) {
        adminStatusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            selectedAdminClientData.clientName = adminClientName.value.trim();
            selectedAdminClientData.packageName = adminPackageName.value.trim();
            selectedAdminClientData.progressPercent = parseInt(adminProgressSlider.value, 10);
            selectedAdminClientData.currentCost = adminCurrentCost.value.trim();
            selectedAdminClientData.paymentStatus = adminPaymentStatus.value;
            selectedAdminClientData.adBudget = adminAdBudget.value.trim();

            await saveClientData(selectedAdminClientId, selectedAdminClientData);
            adminStatusFeedback.style.color = '#d4ff00';
            adminStatusFeedback.innerText = 'Zapisano błyskawicznie! ⚡';
            setTimeout(() => { adminStatusFeedback.innerText = ''; }, 3000);
        });
    }

    if (adminAddTaskForm) {
        adminAddTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('newTaskTitle').value.trim();
            const category = document.getElementById('newTaskCategory').value.trim();
            const status = document.getElementById('newTaskStatus').value;

            selectedAdminClientData.tasks = selectedAdminClientData.tasks || [];
            selectedAdminClientData.tasks.unshift({
                id: Date.now(),
                title,
                category,
                status
            });

            adminAddTaskForm.reset();
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    if (adminAddFinanceForm) {
        adminAddFinanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const period = document.getElementById('finPeriod').value.trim();
            const scope = document.getElementById('finScope').value.trim();
            const docType = document.getElementById('finDocType').value;
            const amount = document.getElementById('finAmount').value.trim();
            const status = document.getElementById('finStatus').value;

            selectedAdminClientData.finances = selectedAdminClientData.finances || [];
            selectedAdminClientData.finances.unshift({
                id: Date.now(),
                period,
                scope,
                docType,
                amount,
                status
            });

            adminAddFinanceForm.reset();
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    if (adminChatForm && adminChatInput) {
        adminChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = adminChatInput.value.trim();
            if (!text) return;

            selectedAdminClientData.messages = selectedAdminClientData.messages || [];
            selectedAdminClientData.messages.push({
                sender: 'agency',
                author: 'Wake The Brand ⚡ (Zespół)',
                text: text,
                time: getCurrentTimeStr()
            });

            adminChatInput.value = '';
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    if (resetDemoDataBtn) {
        resetDemoDataBtn.addEventListener('click', async () => {
            const freshCopy = JSON.parse(JSON.stringify(defaultClientData));
            renderAdminUI(freshCopy);
            await saveClientData(selectedAdminClientId, freshCopy);
        });
    }

});
