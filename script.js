document.addEventListener('DOMContentLoaded', async () => {

    // 0. KONFIGURACJA FIREBASE (WAKE-THE-BRAND)
    const firebaseConfig = {
        apiKey: "AIzaSyBBPECw6qPYOd7g1NUFzHNQMzljUBOwL9I",
        authDomain: "wake-the-brand.firebaseapp.com",
        projectId: "wake-the-brand",
        storageBucket: "wake-the-brand.firebasestorage.app",
        messagingSenderId: "765483574565",
        appId: "1:765483574565:web:c898771abb393cf11526cc"
    };

    const CONTACT_RECEIVER_EMAIL = "kontakt@wakethebrand.pl";
    const ADMIN_EMAILS = [
        'kontakt@wakethebrand.pl',
        'contact@wakethebrand.pl',
        'mateuszbugecik@gmail.com'
    ];

    const STORAGE_KEY = 'wtb_portal_data_v4';
    const LEADS_STORAGE_KEY = 'wtb_leads_local_v1';
    const ACCOUNTS_CACHE_KEY = 'wtb_accounts_cache_v4';

    // CZYSTY SZABLON DLA NOWEGO KLIENTA (0% postępu, 0 zł budżetu, brak zadań, brak plików – wszystko ustala Admin)
    const defaultClientData = {
        clientName: 'Nowy Klient (Oczekuje na aktywację)',
        userName: 'Klient',
        email: 'klient@twojamarka.pl',
        isAdminRole: false,
        isBlocked: false,
        createdAt: 'Nowe konto',
        packageName: 'Oczekuje na wybór i opłacenie ⏳',
        progressPercent: 0,
        currentCost: '0 zł (Do ustalenia)',
        paymentStatus: '⏳ Oczekuje na płatność',
        adBudget: '0 zł',
        tasks: [],
        filePackages: [],
        finances: [],
        messages: [
            {
                sender: 'agency',
                author: 'Wake The Brand ⚡',
                text: 'Cześć! Witamy w Twoim Panelu Klienta. Twoje konto jest już aktywne. Po ustaleniu szczegółów i opłaceniu pakietu Administrator uruchomi tutaj Twój harmonogram zadań, pasek postępu oraz udostępni pliki do akceptacji.',
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

    // Pomocniczy konwerter małego pliku z dysku do DataURL (do bezpośredniego pobrania przez klienta)
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    // 1. MENU MOBILNE & COOKIES
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
        if (!localStorage.getItem('wtb_cookie_consent')) {
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
            openCookiesBtn.addEventListener('click', () => cookieBanner.classList.remove('hidden'));
        }
        if (resetCookiesBtn) {
            resetCookiesBtn.addEventListener('click', () => {
                localStorage.removeItem('wtb_cookie_consent');
                cookieBanner.classList.remove('hidden');
            });
        }
    }

    // 2. SYMULATOR MARKI, FAQ & KONCEPTY
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
                    card.style.display = (filterValue === 'all' || filterValue === cat) ? 'block' : 'none';
                });
            });
        });
    }

    const conceptDetails = {
        "1": {
            tag: "Strategia Zdalna #1: Turystyka & Noclegi",
            title: "System rezerwacji bezpośrednich bez prowizji pośredników",
            steps: [
                "<strong>Etap 1: Szybka strona WWW z bezpośrednim zapytaniem</strong> – projektujemy nowoczesną witrynę prezentującą pokoje, atuty okolicy i cennik.",
                "<strong>Etap 2: Krótkie formy wideo (Reels / TikTok)</strong> – z przesłanych nagrań montujemy klimatyczne rolki pokazujące atmosferę wypoczynku.",
                "<strong>Etap 3: Kampania przed sezonem</strong> – odpalamy celowane reklamy Meta & Google na osoby szukające noclegu."
            ]
        },
        "2": {
            tag: "Strategia Zdalna #2: Moda, Streetwear & Rękodzieło",
            title: "Budowa zaangażowanej społeczności wokół unikalnego produktu",
            steps: [
                "<strong>Etap 1: Wyrazista identyfikacja wizualna</strong> – tworzymy logo, dobieramy czcionki i estetykę wyróżniającą markę.",
                "<strong>Etap 2: Kulisy powstawania (Behind The Scenes)</strong> – montujemy dynamiczne Rolki z procesu projektowania i tworzenia.",
                "<strong>Etap 3: Komunikacja dropów i premier</strong> – budujemy napięcie wokół nowych kolekcji i kierujemy ruch na stronę."
            ]
        },
        "3": {
            tag: "Strategia Zdalna #3: Usługi & Gastronomia",
            title: "Magnes na klientów w promieniu 15 km od Twojej firmy",
            steps: [
                "<strong>Etap 1: Odświeżenie strony WWW i wizytówki Google</strong> – czytelny cennik, szybki formularz i efekty pracy.",
                "<strong>Etap 2: Wideo „Przed i Po”</strong> – dynamiczne rolki prezentujące rezultaty usług.",
                "<strong>Etap 3: Reklama lokalna</strong> – precyzyjna kampania reklamowa wyświetlana mieszkańcom Twojego miasta."
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
            const data = conceptDetails[btn.getAttribute('data-concept')];
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

    // 3. KALKULATOR WYCENY (wycena.html)
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
                    const price = Math.round(parseInt(box.value, 10) * currentDiscount);
                    total += price;
                    if (receiptList) {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${box.getAttribute('data-name')}</span><strong>${price} zł</strong>`;
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
            const selected = [];
            checkboxes.forEach(box => {
                if (box.checked) selected.push(box.getAttribute('data-name'));
            });
            const servicesText = selected.length > 0 ? selected.join(' + ') : 'Pakiet Indywidualny';
            return {
                servicesText,
                totalCost: `${totalPriceEl.innerText} zł`,
                adBudget: `${budgetSlider.value} zł`,
                fullText: `Cześć Wake The Brand! Wybieram z kalkulatora: ${servicesText}. Szacowany koszt prac: ${totalPriceEl.innerText} zł + proponowany budżet reklamowy ok. ${budgetSlider.value} zł.`
            };
        }

        if (transferQuoteBtn) {
            transferQuoteBtn.addEventListener('click', () => {
                localStorage.setItem('wakeTheBrandQuote', buildQuoteObject().fullText);
                window.location.href = 'kontakt.html';
            });
        }
        if (transferToPanelBtn) {
            transferToPanelBtn.addEventListener('click', () => {
                localStorage.setItem('wakeTheBrandQuoteObj', JSON.stringify(buildQuoteObject()));
                window.location.href = 'logowanie.html#rejestracja';
            });
        }
    }

    // 4. NAWIGACJA ZAKŁADEK PANELU
    const dashNavBtns = document.querySelectorAll('.dash-nav-btn');
    const dashTabContents = document.querySelectorAll('.dash-tab-content');
    const activeClientBanner = document.getElementById('activeClientBanner');
    const backToAccountsBtn = document.getElementById('backToAccountsBtn');

    function activateDashTab(targetId) {
        dashNavBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === targetId));
        dashTabContents.forEach(sec => {
            const isMatch = sec.id === targetId;
            sec.classList.toggle('hidden', !isMatch);
            sec.classList.toggle('active', isMatch);
        });
        if (activeClientBanner) {
            const editTabs = ['admin-tab-status', 'admin-tab-tasks', 'admin-tab-files', 'admin-tab-finances', 'admin-tab-chat'];
            activeClientBanner.classList.toggle('hidden', !editTabs.includes(targetId));
        }
    }

    dashNavBtns.forEach(btn => btn.addEventListener('click', () => activateDashTab(btn.getAttribute('data-tab'))));
    if (backToAccountsBtn) backToAccountsBtn.addEventListener('click', () => activateDashTab('admin-tab-accounts'));
    document.querySelectorAll('[data-go-tab]').forEach(btn => btn.addEventListener('click', () => activateDashTab(btn.getAttribute('data-go-tab'))));
    document.querySelectorAll('.switch-to-chat-btn').forEach(btn => btn.addEventListener('click', () => activateDashTab('tab-chat')));

    // 5. ZMIENNE GLOBALNE FIREBASE I POMOCNICZE
    let auth = null;
    let db = null;
    let fbFns = {};
    let firebaseReady = false;
    let currentLoggedInAdminEmail = localStorage.getItem('wtb_admin_email') || CONTACT_RECEIVER_EMAIL;

    const adminEmailLabelEl = document.getElementById('loggedInAdminEmail');
    if (adminEmailLabelEl) adminEmailLabelEl.innerText = currentLoggedInAdminEmail;

    function statusBadgeHTML(status) {
        if (status === 'done') return '<span class="badge-status done">✓ Zrobione</span>';
        if (status === 'progress') return '<span class="badge-status progress">⏳ W trakcie</span>';
        return '<span class="badge-status todo">📋 Zaplanowane</span>';
    }

    function fileStatusBadgeHTML(status) {
        if (status === 'approved') return '<span class="badge-status done">✓ Zaakceptowano</span>';
        return '<span class="badge-status progress">⏳ Czeka na akceptację</span>';
    }

    async function saveClientData(clientId, dataObj) {
        saveLocalData(dataObj);
        const cached = getCachedAccounts();
        const idx = cached.findIndex(a => a.id === clientId);
        if (idx >= 0) cached[idx] = { id: clientId, ...dataObj };
        else cached.push({ id: clientId, ...dataObj });
        saveCachedAccounts(cached);

        if (firebaseReady && db && clientId) {
            try {
                await fbFns.setDoc(fbFns.doc(db, 'clients', clientId), dataObj, { merge: true });
            } catch (e) {
                console.error('Błąd zapisu Firestore:', e);
            }
        }
    }

    // 6. RENDEROWANIE PANELU KLIENTA (W TYM OTWIERANE KONTENERY PLIKÓW DO POBRANIA)
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
    const clientFilesGrid = document.getElementById('clientFilesGrid');
    const clientFinanceTable = document.getElementById('clientFinanceTable');
    const clientChatBox = document.getElementById('clientChatBox');
    const clientChatForm = document.getElementById('clientChatForm');
    const clientChatInput = document.getElementById('clientChatInput');
    const latestMsgPreview = document.getElementById('latestMsgPreview');

    // Modal otwieranego kontenera plików u klienta
    const clientFileModal = document.getElementById('clientFileModal');
    const closeClientFileModal = document.getElementById('closeClientFileModal');
    const modalFileCategory = document.getElementById('modalFileCategory');
    const modalFileStatusBadge = document.getElementById('modalFileStatusBadge');
    const modalFileTitle = document.getElementById('modalFileTitle');
    const modalFileDate = document.getElementById('modalFileDate');
    const modalFileDescription = document.getElementById('modalFileDescription');
    const modalDownloadList = document.getElementById('modalDownloadList');
    const modalApprovePackageBtn = document.getElementById('modalApprovePackageBtn');
    const modalAskCorrectionBtn = document.getElementById('modalAskCorrectionBtn');

    let currentClientId = localStorage.getItem('wtb_active_uid') || 'demo_client';
    let currentClientCache = getLocalData();
    let openedFilePackageId = null;

    function openClientFilePackageModal(pkgId) {
        const packages = currentClientCache.filePackages || [];
        const pkg = packages.find(p => String(p.id) === String(pkgId));
        if (!pkg || !clientFileModal) return;

        openedFilePackageId = pkg.id;
        if (modalFileCategory) modalFileCategory.innerText = pkg.category || 'Materiały';
        if (modalFileStatusBadge) modalFileStatusBadge.innerHTML = fileStatusBadgeHTML(pkg.status);
        if (modalFileTitle) modalFileTitle.innerText = pkg.title || 'Bez tytułu';
        if (modalFileDate) modalFileDate.innerText = `Dodano przez Wake The Brand • ${pkg.createdAt || 'Teraz'}`;
        if (modalFileDescription) modalFileDescription.innerText = pkg.description || 'Brak dodatkowego opisu.';

        const files = pkg.files || [];
        if (modalDownloadList) {
            if (files.length === 0) {
                modalDownloadList.innerHTML = `
                    <div class="download-file-row">
                        <span style="color:var(--text-muted);">Brak załączonych plików bezpośrednich w tym kontenerze.</span>
                    </div>
                `;
            } else {
                modalDownloadList.innerHTML = files.map(f => `
                    <div class="download-file-row">
                        <div style="display:flex;align-items:center;gap:0.6rem;">
                            <span>📄</span>
                            <strong>${f.name || 'Plik do pobrania'}</strong>
                        </div>
                        <a href="${f.url || '#'}" download="${f.name || 'plik'}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
                            ⬇️ Pobierz / Otwórz plik
                        </a>
                    </div>
                `).join('');
            }
        }

        if (modalApprovePackageBtn) {
            if (pkg.status === 'approved') {
                modalApprovePackageBtn.innerText = '✓ Materiał został już zaakceptowany';
                modalApprovePackageBtn.disabled = true;
            } else {
                modalApprovePackageBtn.innerText = '✅ Akceptuję ten materiał';
                modalApprovePackageBtn.disabled = false;
            }
        }

        clientFileModal.classList.add('open');
    }

    if (closeClientFileModal && clientFileModal) {
        closeClientFileModal.addEventListener('click', () => clientFileModal.classList.remove('open'));
        clientFileModal.addEventListener('click', (e) => {
            if (e.target === clientFileModal) clientFileModal.classList.remove('open');
        });
    }

    if (modalApprovePackageBtn) {
        modalApprovePackageBtn.addEventListener('click', async () => {
            if (!openedFilePackageId) return;
            const packages = currentClientCache.filePackages || [];
            const pkg = packages.find(p => String(p.id) === String(openedFilePackageId));
            if (!pkg) return;

            pkg.status = 'approved';
            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `✅ Zaakceptowałem kontener plików: „${pkg.title}”. Możemy działać dalej!`,
                time: getCurrentTimeStr()
            });

            renderClientUI(currentClientCache);
            openClientFilePackageModal(openedFilePackageId);
            await saveClientData(currentClientId, currentClientCache);
        });
    }

    if (modalAskCorrectionBtn) {
        modalAskCorrectionBtn.addEventListener('click', () => {
            const packages = currentClientCache.filePackages || [];
            const pkg = packages.find(p => String(p.id) === String(openedFilePackageId));
            if (clientFileModal) clientFileModal.classList.remove('open');
            activateDashTab('tab-chat');
            if (clientChatInput && pkg) {
                clientChatInput.value = `Odnośnie kontenera „${pkg.title}”: `;
                clientChatInput.focus();
            }
        });
    }

    function renderClientUI(data) {
        if (!clientActivePackage) return;
        currentClientCache = data;
        saveLocalData(data);

        const progressVal = data.progressPercent ?? 0;
        if (clientTopName) clientTopName.innerText = data.clientName || 'Konto Klienta';
        if (clientWelcomeTitle) clientWelcomeTitle.innerText = `Cześć! Oto aktualny status dla: ${data.clientName} ⚡`;
        if (clientActivePackage) clientActivePackage.innerText = data.packageName || 'Oczekuje na ustalenie ⏳';
        if (clientProgressPercent) clientProgressPercent.innerText = progressVal;
        if (clientProgressBar) clientProgressBar.style.width = `${progressVal}%`;
        if (clientCurrentCost) clientCurrentCost.innerText = data.currentCost || '0 zł (Do ustalenia)';
        if (clientPaymentStatus) clientPaymentStatus.innerText = data.paymentStatus || '⏳ Oczekuje na płatność';
        if (clientAdBudget) clientAdBudget.innerText = data.adBudget || '0 zł';

        const tasks = data.tasks || [];
        const emptyTasksHTML = `
            <li class="dash-task-item">
                <div class="task-meta">
                    <strong>📋 Brak aktywnych zadań na koncie</strong>
                    <small>Harmonogram prac pojawi się tutaj po opłaceniu pakietu i aktywacji projektu przez Administratora.</small>
                </div>
                <span class="badge-status todo">Oczekuje na start</span>
            </li>
        `;

        if (overviewTaskList) {
            overviewTaskList.innerHTML = tasks.length > 0
                ? tasks.slice(0, 4).map(t => `<li class="dash-task-item"><div class="task-meta"><strong>${t.title}</strong><small>${t.category}</small></div>${statusBadgeHTML(t.status)}</li>`).join('')
                : emptyTasksHTML;
        }
        if (clientFullTaskList) {
            clientFullTaskList.innerHTML = tasks.length > 0
                ? tasks.map(t => `<li class="dash-task-item"><div class="task-meta"><strong>${t.title}</strong><small>Obszar: ${t.category}</small></div>${statusBadgeHTML(t.status)}</li>`).join('')
                : emptyTasksHTML;
        }

        // Renderowanie kontenerów plików do akceptacji (puste na starcie, dopóki Admin nie wgra)
        const filePackages = data.filePackages || [];
        if (clientFilesGrid) {
            if (filePackages.length === 0) {
                clientFilesGrid.innerHTML = `
                    <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;">
                        <span style="font-size: 2.4rem; display: block; margin-bottom: 0.8rem;">📁</span>
                        <h3>Brak materiałów oczekujących na akceptację</h3>
                        <p style="color: var(--text-muted); max-width: 520px; margin: 0.6rem auto 0;">
                            Gdy nasz zespół przygotuje dla Ciebie projekty graficzne, wideo lub podgląd strony WWW, Administrator udostępni je tutaj w formie gotowych kontenerów do pobrania.
                        </p>
                    </div>
                `;
            } else {
                clientFilesGrid.innerHTML = filePackages.map(pkg => {
                    const filesCount = (pkg.files || []).length;
                    const shortDesc = (pkg.description || '').length > 110
                        ? pkg.description.slice(0, 110) + '...'
                        : (pkg.description || '');

                    return `
                        <div class="service-card glass-card file-package-card" data-open-pkg="${pkg.id}">
                            <div>
                                <div class="file-package-header">
                                    <span class="section-tag" style="margin-bottom:0;">${pkg.category || 'Projekt'}</span>
                                    ${fileStatusBadgeHTML(pkg.status)}
                                </div>
                                <h3 style="margin-bottom:0.5rem;">${pkg.title}</h3>
                                <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.2rem;">${shortDesc}</p>
                            </div>
                            <div>
                                <div style="font-size:0.8rem;color:var(--accent-lime);margin-bottom:0.9rem;">
                                    📎 Załączone pliki do pobrania: <strong>${filesCount}</strong> • Dodano: ${pkg.createdAt || 'Teraz'}
                                </div>
                                <button type="button" class="btn btn-primary btn-sm btn-full" data-open-pkg-btn="${pkg.id}">
                                    📂 Otwórz kontener i pobierz pliki →
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                clientFilesGrid.querySelectorAll('[data-open-pkg]').forEach(card => {
                    card.addEventListener('click', () => {
                        openClientFilePackageModal(card.getAttribute('data-open-pkg'));
                    });
                });
            }
        }

        const finances = data.finances || [];
        if (clientFinanceTable) {
            clientFinanceTable.innerHTML = finances.length > 0
                ? finances.map(f => `<tr><td><strong>${f.period}</strong></td><td>${f.scope}</td><td>${f.docType}</td><td class="highlight-col">${f.amount}</td><td>${f.status}</td></tr>`).join('')
                : `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem;">Brak wystawionych rozliczeń. Po ustaleniu szczegółów współpracy tutaj pojawią się Twoje rachunki.</td></tr>`;
        }

        const messages = data.messages || [];
        if (latestMsgPreview && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            latestMsgPreview.innerHTML = `<strong>${lastMsg.author}</strong><p>„${lastMsg.text}”</p><span class="msg-time">${lastMsg.time}</span>`;
        }
        if (clientChatBox) {
            clientChatBox.innerHTML = messages.map(m => `<div class="chat-bubble ${m.sender === 'agency' ? 'from-agency' : 'from-client'}"><span class="chat-sender">${m.author} • ${m.time}</span><div>${m.text}</div></div>`).join('');
            clientChatBox.scrollTop = clientChatBox.scrollHeight;
        }
    }

    if (clientActivePackage) renderClientUI(currentClientCache);

    // 7. ELEMENTY I LOGIKA PANELU ADMINA (W TYM WGRYWANIE KONTENERÓW PLIKÓW)
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
    const adminAddFilePackageForm = document.getElementById('adminAddFilePackageForm');
    const adminFilePackagesList = document.getElementById('adminFilePackagesList');
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
        if (confirmAdminEmailLabel) confirmAdminEmailLabel.innerText = currentLoggedInAdminEmail;
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
        if (!allAccountsCache.some(a => a.id === selectedAdminClientId) && allAccountsCache.length > 0) {
            selectedAdminClientId = allAccountsCache[0].id;
        }
        adminClientSelector.value = selectedAdminClientId;
    }

    function renderAllAccountsList() {
        if (!adminAccountsList) return;
        const searchQuery = (adminAccountSearch ? adminAccountSearch.value : '').trim().toLowerCase();
        const roleFilter = adminRoleFilter ? adminRoleFilter.value : 'all';

        let adminsCount = 0;
        let clientsCount = 0;
        allAccountsCache.forEach(acc => {
            if (isOwnerEmail(acc.email) || acc.isAdminRole === true) adminsCount++;
            else clientsCount++;
        });

        if (statTotalAccounts) statTotalAccounts.innerText = allAccountsCache.length;
        if (statAdminAccounts) statAdminAccounts.innerText = adminsCount;
        if (statClientAccounts) statClientAccounts.innerText = clientsCount;

        const filtered = allAccountsCache.filter(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            const isBlocked = acc.isBlocked === true;
            if (roleFilter === 'admin' && !isAccAdmin) return false;
            if (roleFilter === 'client' && isAccAdmin) return false;
            if (roleFilter === 'blocked' && !isBlocked) return false;
            if (searchQuery) {
                const hay = `${acc.clientName || ''} ${acc.userName || ''} ${acc.email || ''} ${acc.packageName || ''}`.toLowerCase();
                if (!hay.includes(searchQuery)) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            adminAccountsList.innerHTML = `<div class="account-card-row"><span style="color:var(--text-muted);">Brak kont spełniających kryteria.</span></div>`;
            return;
        }

        adminAccountsList.innerHTML = filtered.map(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            const isProtectedOwner = isOwnerEmail(acc.email);
            const isBlocked = acc.isBlocked === true;
            const isSelected = acc.id === selectedAdminClientId;

            return `
                <div class="account-card-row ${isSelected ? 'selected-account' : ''}">
                    <div class="account-main-info">
                        <div class="account-title-line">
                            <strong style="font-size:1.05rem;">${acc.clientName || 'Bez nazwy'}</strong>
                            ${isAccAdmin ? '<span class="role-pill admin-role">👑 Administrator</span>' : '<span class="role-pill client-role">👤 Klient</span>'}
                            ${isBlocked ? '<span class="role-pill blocked-role">⛔ Zablokowane</span>' : ''}
                        </div>
                        <div class="account-meta-line">
                            <span>📧 ${acc.email || 'Brak e-maila'}</span>
                            <span>📦 ${acc.packageName || 'Brak pakietu'}</span>
                            <span>📊 Postęp: <strong>${acc.progressPercent ?? 0}%</strong></span>
                            <span>🧾 ${acc.currentCost || '0 zł'} (${acc.paymentStatus || 'Status'})</span>
                        </div>
                    </div>
                    <div class="account-actions">
                        <button type="button" class="btn-mini btn-manage" data-manage-uid="${acc.id}">🎛️ Otwórz panel klienta →</button>
                        ${!isProtectedOwner ? `
                            <button type="button" class="btn-mini" data-toggle-admin="${acc.id}">${isAccAdmin ? '👤 Odbierz Admina' : '👑 Nadaj Admina'}</button>
                            <button type="button" class="btn-mini" data-toggle-block="${acc.id}">${isBlocked ? '🔓 Odblokuj' : '⛔ Zablokuj'}</button>
                        ` : `<span style="font-size:0.75rem;color:var(--text-muted);padding:0 0.4rem;">Konto właściciela</span>`}
                        <button type="button" class="btn-mini" data-reset-pass="${acc.email || ''}">🔑 Reset hasła</button>
                        ${!isProtectedOwner && acc.id !== 'demo_client' ? `<button type="button" class="btn-mini btn-danger" data-delete-uid="${acc.id}">🗑️ Usuń</button>` : ''}
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
                const roleName = newAdminState ? 'ADMINISTRATOR' : 'KLIENT';
                openSecurityPrompt({
                    title: newAdminState ? '👑 Nadaj uprawnienia Admina' : '👤 Odbierz uprawnienia Admina',
                    description: `Zmienić uprawnienia konta „${targetAcc.clientName}” (${targetAcc.email}) na: ${roleName}? Wpisz swoje hasło Administratora.`,
                    onConfirm: async () => {
                        targetAcc.isAdminRole = newAdminState;
                        await saveClientData(uid, targetAcc);
                        if (adminAccountActionFeedback) {
                            adminAccountActionFeedback.style.color = '#d4ff00';
                            adminAccountActionFeedback.innerText = `✅ Zmieniono rolę konta ${targetAcc.clientName} na: ${roleName}!`;
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
                    title: newBlockedState ? '⛔ Zablokuj konto' : '🔓 Odblokuj konto',
                    description: `Czy chcesz ${newBlockedState ? 'ZABLOKOWAĆ' : 'ODBLOKOWAĆ'} konto „${targetAcc.clientName}”? Potwierdź hasłem Administratora.`,
                    onConfirm: async () => {
                        targetAcc.isBlocked = newBlockedState;
                        await saveClientData(uid, targetAcc);
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
                        adminAccountActionFeedback.innerText = `🔑 Wysłano link resetujący hasło na: ${targetEmail}`;
                    }
                } catch (e) {}
            });
        });

        adminAccountsList.querySelectorAll('[data-delete-uid]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.getAttribute('data-delete-uid');
                const targetAcc = allAccountsCache.find(a => a.id === uid);
                if (!targetAcc) return;
                openSecurityPrompt({
                    title: '🗑️ Usunięcie konta z bazy',
                    description: `Czy bezpowrotnie usunąć profil „${targetAcc.clientName}” (${targetAcc.email})? Potwierdź hasłem Administratora.`,
                    onConfirm: async () => {
                        allAccountsCache = allAccountsCache.filter(a => a.id !== uid);
                        saveCachedAccounts(allAccountsCache);
                        renderAllAccountsList();
                        if (firebaseReady && db) await fbFns.deleteDoc(fbFns.doc(db, 'clients', uid));
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
            <li class="dash-task-item" style="align-items:flex-start;">
                <div class="task-meta">
                    <strong>${lead.name} (${lead.email}) • <span style="color:var(--accent-lime);">${lead.topics}</span></strong>
                    <p style="margin:0.4rem 0;color:#d1d5db;">${lead.message}</p>
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
                    try { await fbFns.deleteDoc(fbFns.doc(db, 'contact_leads', leadId)); } catch (e) {}
                }
            });
        });
    }

    function renderAdminUI(data) {
        if (!adminStatusForm) return;
        selectedAdminClientData = data;
        const progressVal = data.progressPercent ?? 0;

        if (bannerClientName) bannerClientName.innerText = `${data.clientName || 'Konto'} (${data.email || 'brak e-maila'})`;
        adminClientName.value = data.clientName || '';
        adminPackageName.value = data.packageName || '';
        adminProgressSlider.value = progressVal;
        adminProgressVal.innerText = `${progressVal}%`;
        adminCurrentCost.value = data.currentCost || '0 zł (Do ustalenia)';
        adminPaymentStatus.value = data.paymentStatus || '⏳ Oczekuje na płatność';
        adminAdBudget.value = data.adBudget || '0 zł';

        // Lista zadań w Adminie
        const tasks = data.tasks || [];
        if (adminTaskList) {
            adminTaskList.innerHTML = tasks.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Brak zadań na koncie tego klienta. Dodaj pierwsze zadanie po opłaceniu pakietu.</span></li>`
                : tasks.map((t, idx) => `
                    <li class="dash-task-item">
                        <div class="task-meta"><strong>${t.title}</strong><small>${t.category}</small></div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <button type="button" class="btn-mini" data-cycle-task="${idx}">${statusBadgeHTML(t.status)}</button>
                            <button type="button" class="admin-action-btn" data-del-task="${idx}">Usuń</button>
                        </div>
                    </li>
                `).join('');

            adminTaskList.querySelectorAll('[data-cycle-task]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-cycle-task'), 10);
                    const cur = selectedAdminClientData.tasks[idx].status;
                    selectedAdminClientData.tasks[idx].status = cur === 'todo' ? 'progress' : (cur === 'progress' ? 'done' : 'todo');
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

        // Lista kontenerów plików w Adminie
        const filePackages = data.filePackages || [];
        if (adminFilePackagesList) {
            adminFilePackagesList.innerHTML = filePackages.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Brak udostępnionych kontenerów plików dla tego klienta.</span></li>`
                : filePackages.map((pkg, idx) => `
                    <li class="dash-task-item" style="align-items:flex-start;">
                        <div class="task-meta">
                            <strong>📁 ${pkg.title} <span style="color:var(--accent-lime);">(${pkg.category})</span></strong>
                            <p style="font-size:0.84rem;color:#d1d5db;margin:0.3rem 0;">${pkg.description}</p>
                            <small>Plików w kontenerze: ${(pkg.files || []).length} • Dodano: ${pkg.createdAt || 'Teraz'}</small>
                        </div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            ${fileStatusBadgeHTML(pkg.status)}
                            <button type="button" class="admin-action-btn" data-del-pkg="${idx}">Usuń</button>
                        </div>
                    </li>
                `).join('');

            adminFilePackagesList.querySelectorAll('[data-del-pkg]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-del-pkg'), 10);
                    selectedAdminClientData.filePackages.splice(idx, 1);
                    renderAdminUI(selectedAdminClientData);
                    await saveClientData(selectedAdminClientId, selectedAdminClientData);
                });
            });
        }

        // Lista finansów w Adminie
        const finances = data.finances || [];
        if (adminFinanceList) {
            adminFinanceList.innerHTML = finances.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Brak wystawionych rozliczeń dla tego klienta.</span></li>`
                : finances.map((f, idx) => `
                    <li class="dash-task-item">
                        <div class="task-meta"><strong>${f.period} – ${f.amount}</strong><small>${f.scope} (${f.docType}) • ${f.status}</small></div>
                        <button type="button" class="admin-action-btn" data-del-fin="${idx}">Usuń</button>
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
            adminChatBox.innerHTML = messages.map(m => `<div class="chat-bubble ${m.sender === 'agency' ? 'from-client' : 'from-agency'}"><span class="chat-sender">${m.author} • ${m.time}</span><div>${m.text}</div></div>`).join('');
            adminChatBox.scrollTop = adminChatBox.scrollHeight;
        }
    }

    function subscribeToSelectedClient(clientId) {
        selectedAdminClientId = clientId;
        localStorage.setItem('wtb_active_uid', clientId);
        const cachedMatch = allAccountsCache.find(a => a.id === clientId);
        if (cachedMatch) renderAdminUI(cachedMatch);
        renderAllAccountsList();

        if (unsubscribeAdminClient) unsubscribeAdminClient();
        if (firebaseReady && db) {
            unsubscribeAdminClient = fbFns.onSnapshot(fbFns.doc(db, 'clients', clientId), (snap) => {
                if (snap.exists()) renderAdminUI(snap.data());
            });
        }
    }

    if (adminStatusForm) {
        populateSelectorFromCache();
        renderAllAccountsList();
        renderAdminUI(selectedAdminClientData);
        renderLeadsListUI(getLocalLeads());
    }

    if (adminAccountSearch) adminAccountSearch.addEventListener('input', renderAllAccountsList);
    if (adminRoleFilter) adminRoleFilter.addEventListener('change', renderAllAccountsList);
    if (adminClientSelector) adminClientSelector.addEventListener('change', () => subscribeToSelectedClient(adminClientSelector.value));

    // 8. SZYBKIE POŁĄCZENIE Z FIREBASE (PROMISE.ALL + BRAVE LONG-POLLING)
    try {
        const [appMod, authMod, firestoreMod] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
        ]);

        const app = appMod.initializeApp(firebaseConfig);
        auth = authMod.getAuth(app);
        db = firestoreMod.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
        fbFns = { ...authMod, ...firestoreMod };
        firebaseReady = true;

        const statusEl = document.getElementById('firebaseStatusText');
        if (statusEl) {
            statusEl.style.color = '#d4ff00';
            statusEl.innerText = '● Połączono z Firebase (Turbo Sync)';
        }

        if (typeof auth.authStateReady === 'function') await auth.authStateReady();

        if (auth.currentUser && auth.currentUser.email) {
            currentLoggedInAdminEmail = auth.currentUser.email;
            localStorage.setItem('wtb_admin_email', auth.currentUser.email);
            if (adminEmailLabelEl) adminEmailLabelEl.innerText = currentLoggedInAdminEmail;
        }

        if (clientActivePackage) {
            if (auth.currentUser) {
                currentClientId = auth.currentUser.uid;
                localStorage.setItem('wtb_active_uid', currentClientId);
            }
            fbFns.onSnapshot(fbFns.doc(db, 'clients', currentClientId), (docSnap) => {
                if (docSnap.exists()) renderClientUI(docSnap.data());
            });
        }

        if (adminStatusForm) {
            fbFns.onSnapshot(fbFns.collection(db, 'clients'), async (colSnap) => {
                if (colSnap.empty) {
                    await saveClientData('demo_client', defaultClientData);
                    return;
                }
                const fresh = [];
                colSnap.forEach(docSnap => fresh.push({ id: docSnap.id, ...docSnap.data() }));
                allAccountsCache = fresh;
                saveCachedAccounts(fresh);
                populateSelectorFromCache();
                renderAllAccountsList();

                const activeDoc = fresh.find(a => a.id === selectedAdminClientId) || fresh[0];
                if (activeDoc) {
                    selectedAdminClientId = activeDoc.id;
                    renderAdminUI(activeDoc);
                }
            });

            if (adminLeadsList) {
                fbFns.onSnapshot(fbFns.collection(db, 'contact_leads'), (leadsSnap) => {
                    if (leadsSnap.empty) {
                        renderLeadsListUI(getLocalLeads());
                        return;
                    }
                    const arr = [];
                    leadsSnap.forEach(l => arr.push({ id: l.id, ...l.data() }));
                    arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(arr));
                    renderLeadsListUI(arr);
                });
            }
        }
    } catch (err) {
        console.warn('Tryb lokalny Cache:', err);
    }

    // 9. FORMULARZE: KONTAKT, LOGOWANIE, REJESTRACJA, AKCJE ADMINA
    const topicPills = document.querySelectorAll('.topic-pill');
    const contactForm = document.getElementById('contactForm');
    const messageInput = document.getElementById('message');
    const formFeedback = document.getElementById('formFeedback');

    topicPills.forEach(pill => pill.addEventListener('click', () => pill.classList.toggle('active')));
    if (messageInput && localStorage.getItem('wakeTheBrandQuote')) {
        messageInput.value = localStorage.getItem('wakeTheBrandQuote');
        localStorage.removeItem('wakeTheBrandQuote');
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const msgVal = document.getElementById('message').value.trim();
            const activeTopics = [];
            topicPills.forEach(p => { if (p.classList.contains('active')) activeTopics.push(p.innerText); });
            const topicsStr = activeTopics.join(', ') || 'Ogólne';

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
                try { await fbFns.addDoc(fbFns.collection(db, 'contact_leads'), leadObj); } catch (err) {}
            }
            if (window.location.protocol !== 'file:') {
                fetch(`https://formsubmit.co/ajax/${CONTACT_RECEIVER_EMAIL}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
            formFeedback.innerText = `Dzięki, ${name}! Zgłoszenie zostało zapisane i wysłane na ${CONTACT_RECEIVER_EMAIL} ⚡`;
            contactForm.reset();
        });
    }

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
        if (window.location.hash === '#rejestracja' || savedQuoteObjRaw) switchToRegisterTab();
        if (savedQuoteObjRaw && savedQuoteAlert && regPackage) {
            try {
                const q = JSON.parse(savedQuoteObjRaw);
                savedQuoteAlert.classList.remove('hidden');
                savedQuoteText.innerText = `Twoja kalkulacja: ${q.servicesText} (szacunkowo ${q.totalCost} + proponowany budżet Ads ${q.adBudget}). Załóż konto – prześlemy tę propozycję do zatwierdzenia przez Administratora.`;
                regPackage.value = q.servicesText;
            } catch (e) {}
        }
    }

    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', async () => {
            const emailVal = document.getElementById('loginEmail').value.trim();
            const loginFeedback = document.getElementById('loginFeedback');
            if (!emailVal) {
                loginFeedback.style.color = '#ffb074';
                loginFeedback.innerText = 'Wpisz najpierw swój adres e-mail powyżej.';
                return;
            }
            if (firebaseReady && auth) {
                try {
                    await fbFns.sendPasswordResetEmail(auth, emailVal);
                    loginFeedback.style.color = '#d4ff00';
                    loginFeedback.innerText = `Link do resetu hasła wysłano na: ${emailVal} ⚡`;
                } catch (err) {
                    loginFeedback.style.color = '#fca5a5';
                    loginFeedback.innerText = 'Nie znaleziono konta o tym adresie.';
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

                    if (isOwnerEmail(email) || (userDocData && userDocData.isAdminRole === true)) {
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

    // REJESTRACJA NOWEGO KLIENTA (0% postępu, 0 zł budżetu, pusta lista zadań i plików)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const brand = document.getElementById('regBrand').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;
            const requestedPkg = document.getElementById('regPackage').value.trim() || 'Do ustalenia z Administratorem';
            const registerFeedback = document.getElementById('registerFeedback');

            registerFeedback.style.color = '#d4ff00';
            registerFeedback.innerText = 'Tworzenie konta... ⚡';

            const isInitialAdmin = isOwnerEmail(email);

            const newClientDoc = {
                userName: name,
                clientName: `${brand} (${name})`,
                email: email,
                isAdminRole: isInitialAdmin,
                isBlocked: false,
                createdAt: getCurrentTimeStr(),
                packageName: `${requestedPkg} (Oczekuje na zatwierdzenie)`,
                progressPercent: 0,
                currentCost: '0 zł (Ustalany po opłaceniu)',
                paymentStatus: '⏳ Oczekuje na płatność',
                adBudget: '0 zł',
                tasks: [],
                filePackages: [],
                finances: [],
                messages: [
                    {
                        sender: 'agency',
                        author: 'Wake The Brand ⚡',
                        text: 'Cześć! Witamy w Twoim Panelu Klienta. Po opłaceniu i zatwierdzeniu pakietu Administrator uruchomi tutaj Twój pasek postępu, budżet, harmonogram zadań oraz udostępni pliki do akceptacji.',
                        time: getCurrentTimeStr()
                    }
                ]
            };

            let clientIntroMsg = `Cześć! Właśnie założyłem konto dla marki „${brand}”. Interesujący mnie zakres: ${requestedPkg}. Proszę o wycenę i aktywację pakietu.`;
            const savedQuoteObjRaw = localStorage.getItem('wakeTheBrandQuoteObj');
            if (savedQuoteObjRaw) {
                try {
                    const q = JSON.parse(savedQuoteObjRaw);
                    clientIntroMsg = `Cześć! Przesyłam moją wstępną konfigurację z kalkulatora do zatwierdzenia: ${q.servicesText} (wyliczony koszt: ${q.totalCost}, proponowany budżet Ads: ${q.adBudget}).`;
                    localStorage.removeItem('wakeTheBrandQuoteObj');
                } catch (err) {}
            }

            newClientDoc.messages.push({
                sender: 'client',
                author: `${name} (${brand})`,
                text: clientIntroMsg,
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
                    registerFeedback.innerText = err.code === 'auth/email-already-in-use'
                        ? 'Ten adres e-mail ma już konto! Przełącz się na zakładkę „Zaloguj się”.'
                        : `Błąd rejestracji: ${err.message}`;
                }
            } else {
                saveLocalData(newClientDoc);
                window.location.href = 'panel-klienta.html';
            }
        });
    }

    if (adminSecurityForm) {
        adminSecurityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredPass = confirmAdminPassInput.value;
            if (!enteredPass || !pendingSecurityAction) return;
            securityModalFeedback.style.color = '#d4ff00';
            securityModalFeedback.innerText = 'Weryfikacja hasła... ⚡';

            try {
                if (firebaseReady && auth) {
                    const emailToVerify = (auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : currentLoggedInAdminEmail;
                    await fbFns.signInWithEmailAndPassword(auth, emailToVerify, enteredPass);
                }
                await pendingSecurityAction();
                closeSecurityPrompt();
            } catch (err) {
                securityModalFeedback.style.color = '#fca5a5';
                securityModalFeedback.innerText = '❌ Błędne hasło Administratora!';
            }
        });
    }

    [document.getElementById('logoutBtn'), document.getElementById('adminLogoutBtn')].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (firebaseReady && auth) await fbFns.signOut(auth);
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
            currentClientCache.messages.push({ sender: 'client', author: currentClientCache.clientName, text, time: getCurrentTimeStr() });
            clientChatInput.value = '';
            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);
        });
    }

    if (adminProgressSlider && adminProgressVal) {
        adminProgressSlider.addEventListener('input', () => { adminProgressVal.innerText = `${adminProgressSlider.value}%`; });
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
            selectedAdminClientData.tasks = selectedAdminClientData.tasks || [];
            selectedAdminClientData.tasks.unshift({
                id: Date.now(),
                title: document.getElementById('newTaskTitle').value.trim(),
                category: document.getElementById('newTaskCategory').value.trim(),
                status: document.getElementById('newTaskStatus').value
            });
            adminAddTaskForm.reset();
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    // DODAWANIE KONTENERA PLIKÓW DO AKCEPTACJI PRZEZ ADMINA
    if (adminAddFilePackageForm) {
        adminAddFilePackageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('pkgTitle').value.trim();
            const category = document.getElementById('pkgCategory').value.trim();
            const description = document.getElementById('pkgDescription').value.trim();
            const rawLinks = document.getElementById('pkgLinksText').value.trim();
            const fileInput = document.getElementById('pkgLocalFile');

            const filesArray = [];

            if (rawLinks) {
                rawLinks.split('\n').forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    if (trimmed.includes('|')) {
                        const parts = trimmed.split('|');
                        filesArray.push({
                            name: parts[0].trim(),
                            url: parts.slice(1).join('|').trim()
                        });
                    } else {
                        filesArray.push({
                            name: trimmed.split('/').pop() || 'Plik projektu',
                            url: trimmed
                        });
                    }
                });
            }

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const f = fileInput.files[0];
                if (f.size <= 750 * 1024) {
                    try {
                        const dataUrl = await readFileAsDataURL(f);
                        filesArray.push({
                            name: f.name,
                            url: dataUrl
                        });
                    } catch (err) {}
                } else {
                    alert('Wybrany plik z dysku przekracza 750 KB. Dla większych plików wideo/ZIP wklej link (np. Google Drive) w polu powyżej.');
                }
            }

            selectedAdminClientData.filePackages = selectedAdminClientData.filePackages || [];
            selectedAdminClientData.filePackages.unshift({
                id: 'pkg_' + Date.now(),
                title,
                category,
                description,
                files: filesArray,
                status: 'pending',
                createdAt: getCurrentTimeStr()
            });

            selectedAdminClientData.messages = selectedAdminClientData.messages || [];
            selectedAdminClientData.messages.push({
                sender: 'agency',
                author: 'Wake The Brand ⚡ (Zespół)',
                text: `📁 Udostępniliśmy nowy kontener z materiałami w zakładce „Pliki do akceptacji”: „${title}”.`,
                time: getCurrentTimeStr()
            });

            adminAddFilePackageForm.reset();
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    if (adminAddFinanceForm) {
        adminAddFinanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            selectedAdminClientData.finances = selectedAdminClientData.finances || [];
            selectedAdminClientData.finances.unshift({
                id: Date.now(),
                period: document.getElementById('finPeriod').value.trim(),
                scope: document.getElementById('finScope').value.trim(),
                docType: document.getElementById('finDocType').value,
                amount: document.getElementById('finAmount').value.trim(),
                status: document.getElementById('finStatus').value
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
                text,
                time: getCurrentTimeStr()
            });
            adminChatInput.value = '';
            renderAdminUI(selectedAdminClientData);
            await saveClientData(selectedAdminClientId, selectedAdminClientData);
        });
    }

    if (resetDemoDataBtn) {
        resetDemoDataBtn.addEventListener('click', async () => {
            const cleanAccount = {
                ...selectedAdminClientData,
                packageName: 'Oczekuje na wybór i opłacenie ⏳',
                progressPercent: 0,
                currentCost: '0 zł (Do ustalenia)',
                paymentStatus: '⏳ Oczekuje na płatność',
                adBudget: '0 zł',
                tasks: [],
                filePackages: [],
                finances: []
            };
            renderAdminUI(cleanAccount);
            await saveClientData(selectedAdminClientId, cleanAccount);
        });
    }

});
