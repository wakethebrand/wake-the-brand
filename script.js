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

    const CONTACT_RECEIVER_EMAIL = "wakethebrand.kontakt@gmail.com";
    const ADMIN_EMAILS = [
        'mbugajski@wakethebrand.pl',
        'bkoczara@wakethebrand.pl',
        'kontakt@wakethebrand.pl',
        'contact@wakethebrand.pl',
        'wakethebrand.kontakt@gmail.com',
        'mateuszbugecik@gmail.com'
    ];

    const STORAGE_KEY = 'wtb_portal_data_v7';
    const LEADS_STORAGE_KEY = 'wtb_leads_local_v2';
    const ACCOUNTS_CACHE_KEY = 'wtb_accounts_cache_v7';
    const ANNOUNCEMENT_KEY = 'wtb_global_announcement_v1';

    // CZYSTY SZABLON DLA NOWEGO KLIENTA (Wszystko ustala Admin po opłaceniu)
    const defaultClientData = {
        clientName: 'Nowy Klient (Oczekuje na aktywację)',
        userName: 'Klient',
        email: 'klient@twojamarka.pl',
        isAdminRole: false,
        isBlocked: false,
        guardian: 'Wspólny',
        internalNotes: '',
        createdAt: 'Nowe konto',
        packageName: 'Oczekuje na wybór i opłacenie ⏳',
        progressPercent: 0,
        currentCost: '0 zł (Do ustalenia)',
        paymentStatus: '⏳ Oczekuje na płatność',
        adBudget: '0 zł',
        brandboard: {
            primaryColor: '#D4FF00',
            accentColor: '#FF6B00',
            fonts: 'Ustalane przez zespół Wake The Brand',
            website: 'W trakcie konfiguracji',
            socials: 'Do uzupełnienia',
            tone: 'Nowoczesny, wyrazisty'
        },
        brief: null,
        clientUploads: [],
        tasks: [],
        filePackages: [],
        finances: [],
        messages: [
            {
                sender: 'agency',
                author: 'Wake The Brand ⚡',
                text: 'Cześć! Witamy w Twoim Panelu Klienta. Zachęcamy do wypełnienia krótkiej Ankiety Startowej w zakładce „Moja Marka & Brief”. Po opłaceniu pakietu uruchomimy tutaj Twój harmonogram zadań oraz pasek postępu.',
                time: 'Start'
            }
        ]
    };

    // Gotowe szablony zadań 1-Click dla Admina
    const TASK_TEMPLATES = {
        www: [
            { title: 'Architektura informacji i makieta UX strony głównej', category: 'Strona WWW', assignee: 'Mateusz', status: 'todo' },
            { title: 'Projekt graficzny UI w ciemnej stylistyce nowoczesnej', category: 'Strona WWW', assignee: 'Mateusz', status: 'todo' },
            { title: 'Kodowanie responsywnego frontendu (Mobile + Desktop)', category: 'Strona WWW', assignee: 'Mateusz', status: 'todo' },
            { title: 'Optymalizacja szybkości, SEO i podpięcie domeny klienta', category: 'Strona WWW', assignee: 'Wspólnie', status: 'todo' }
        ],
        social: [
            { title: 'Audyt profilu, optymalizacja BIO i wyróżnionych relacji', category: 'Social Media', assignee: 'Bartek', status: 'todo' },
            { title: 'Scenariusze i dobór haczyków (Hooks) do 4 Rolek', category: 'Wideo & Reels', assignee: 'Bartek', status: 'todo' },
            { title: 'Dynamiczny montaż wideo, napisy i udźwiękowienie Rolek', category: 'Wideo & Reels', assignee: 'Wspólnie', status: 'todo' },
            { title: 'Przygotowanie harmonogramu publikacji i copywritingu', category: 'Social Media', assignee: 'Bartek', status: 'todo' }
        ],
        branding: [
            { title: 'Moodboard i kierunek estetyczny identyfikacji wizualnej', category: 'Branding', assignee: 'Mateusz', status: 'todo' },
            { title: 'Projekt głównego sygnetu i logotypu w wersjach jasnej/ciemnej', category: 'Branding', assignee: 'Mateusz', status: 'todo' },
            { title: 'Dobór palety barw HEX, typografii i przygotowanie Karty Marki', category: 'Branding', assignee: 'Wspólnie', status: 'todo' }
        ],
        ads: [
            { title: 'Konfiguracja Menedżera Reklam, Pixela i grup odbiorców', category: 'Kampanie Ads', assignee: 'Bartek', status: 'todo' },
            { title: 'Przygotowanie kreacji reklamowych i tekstów sprzedażowych', category: 'Kampanie Ads', assignee: 'Wspólnie', status: 'todo' },
            { title: 'Uruchomienie kampanii i optymalizacja kosztu pozyskania klienta', category: 'Kampanie Ads', assignee: 'Bartek', status: 'todo' }
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

    // Wyciąganie liczby złotych z tekstu typu "2 100 zł" do Kalkulatora Przychodu HQ
    function parseAmountPLN(str) {
        if (!str) return 0;
        const cleaned = String(str).replace(/\s+/g, '').replace(',', '.');
        const match = cleaned.match(/(\d+(\.\d+)?)/);
        return match ? Math.round(parseFloat(match[1])) : 0;
    }

    function formatPLN(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł';
    }

    function getLocalData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClientData));
            return JSON.parse(JSON.stringify(defaultClientData));
        }
        try { return JSON.parse(raw); } catch (e) { return JSON.parse(JSON.stringify(defaultClientData)); }
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
        try { localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function getLocalLeads() {
        const raw = localStorage.getItem(LEADS_STORAGE_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
    }

    function saveLocalLeadsList(arr) {
        try { localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function getLocalAnnouncement() {
        const raw = localStorage.getItem(ANNOUNCEMENT_KEY);
        if (!raw) return { text: '', active: false };
        try { return JSON.parse(raw); } catch (e) { return { text: '', active: false }; }
    }

    function saveLocalAnnouncement(obj) {
        try { localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(obj)); } catch (e) {}
    }

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
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
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
            checkboxes.forEach(box => { if (box.checked) selected.push(box.getAttribute('data-name')); });
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
            const editTabs = ['admin-tab-status', 'admin-tab-tasks', 'admin-tab-files', 'admin-tab-brand', 'admin-tab-finances', 'admin-tab-chat'];
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
    let currentLoggedInAdminEmail = (localStorage.getItem('wtb_admin_email') || 'mbugajski@wakethebrand.pl').toLowerCase();

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

    function leadStatusBadgeHTML(status) {
        if (status === 'client') return '<span class="badge-status done">✅ Klient</span>';
        if (status === 'contacted') return '<span class="badge-status progress">📞 W kontakcie</span>';
        return '<span class="role-pill admin-role">🔥 Nowe zapytanie</span>';
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

    // FUNKCJA #1: WYSYŁKA POWIADOMIENIA E-MAIL DO KLIENTA
    async function sendEmailNotificationToClient(clientData, subjectLine, customMessage) {
        const targetEmail = (clientData.email || '').trim();
        if (!targetEmail || targetEmail === 'klient@twojamarka.pl') {
            alert('Ten profil nie ma jeszcze przypisanego prawdziwego adresu e-mail klienta.');
            return;
        }

        if (window.location.protocol !== 'file:') {
            try {
                await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: subjectLine,
                        Nadawca: 'Wake The Brand ⚡ (Centrum Klienta)',
                        Marka_Klienta: clientData.clientName || '',
                        Komunikat: customMessage,
                        Link_do_Panelu: window.location.origin + '/panel-klienta.html',
                        _template: 'table'
                    })
                });
            } catch (e) {}
        }

        // Otwórz dodatkowo gotowe okno mailto lub potwierdź na czacie
        clientData.messages = clientData.messages || [];
        clientData.messages.push({
            sender: 'agency',
            author: 'Wake The Brand ⚡ (Powiadomienie E-mail)',
            text: `📧 Wysłaliśmy powiadomienie na Twój adres e-mail (${targetEmail}): ${customMessage}`,
            time: getCurrentTimeStr()
        });
        await saveClientData(selectedAdminClientId, clientData);
        renderAdminUI(clientData);
        alert(`✅ Wysłano powiadomienie e-mail do klienta (${targetEmail}) oraz dodano informację na czacie!`);
    }

    // 6. PANEL KLIENTA (Z PASKIEM OGŁOSZEŃ, KARTĄ MARKI, ANKIETĄ BRIEF I WGRYWANIEM MATERIAŁÓW)
    const clientGlobalAnnouncement = document.getElementById('clientGlobalAnnouncement');
    const clientGlobalAnnouncementText = document.getElementById('clientGlobalAnnouncementText');
    const clientGuardianBadge = document.getElementById('clientGuardianBadge');
    const clientOverviewGuardian = document.getElementById('clientOverviewGuardian');

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

    // Elementy Karty Marki (#4) i Briefu (#5) u Klienta
    const clientBrandPrimarySwatch = document.getElementById('clientBrandPrimarySwatch');
    const clientBrandPrimaryText = document.getElementById('clientBrandPrimaryText');
    const clientBrandAccentSwatch = document.getElementById('clientBrandAccentSwatch');
    const clientBrandAccentText = document.getElementById('clientBrandAccentText');
    const clientCopyPrimaryColor = document.getElementById('clientCopyPrimaryColor');
    const clientCopyAccentColor = document.getElementById('clientCopyAccentColor');
    const clientBrandFonts = document.getElementById('clientBrandFonts');
    const clientBrandWebsite = document.getElementById('clientBrandWebsite');
    const clientBrandSocials = document.getElementById('clientBrandSocials');
    const clientBrandTone = document.getElementById('clientBrandTone');

    const clientBriefForm = document.getElementById('clientBriefForm');
    const briefIndustry = document.getElementById('briefIndustry');
    const briefAudience = document.getElementById('briefAudience');
    const briefInspiration = document.getElementById('briefInspiration');
    const briefGoal = document.getElementById('briefGoal');
    const clientBriefFeedback = document.getElementById('clientBriefFeedback');

    // Elementy Repozytorium materiałów OD Klienta (#6)
    const clientUploadMaterialForm = document.getElementById('clientUploadMaterialForm');
    const clientUploadedMaterialsList = document.getElementById('clientUploadedMaterialsList');
    const clientUploadFeedback = document.getElementById('clientUploadFeedback');

    // Modal otwieranego kontenera plików
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

    function renderAnnouncementBanner(annObj) {
        if (!clientGlobalAnnouncement) return;
        if (annObj && annObj.active && annObj.text && annObj.text.trim() !== '') {
            clientGlobalAnnouncementText.innerText = annObj.text;
            clientGlobalAnnouncement.classList.remove('hidden');
        } else {
            clientGlobalAnnouncement.classList.add('hidden');
        }
    }

    renderAnnouncementBanner(getLocalAnnouncement());

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
            modalDownloadList.innerHTML = files.length === 0
                ? `<div class="download-file-row"><span style="color:var(--text-muted);">Brak załączonych plików bezpośrednich.</span></div>`
                : files.map(f => `
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

        if (modalApprovePackageBtn) {
            modalApprovePackageBtn.innerText = pkg.status === 'approved' ? '✓ Materiał został już zaakceptowany' : '✅ Akceptuję ten materiał';
            modalApprovePackageBtn.disabled = pkg.status === 'approved';
        }
        clientFileModal.classList.add('open');
    }

    if (closeClientFileModal && clientFileModal) {
        closeClientFileModal.addEventListener('click', () => clientFileModal.classList.remove('open'));
        clientFileModal.addEventListener('click', (e) => { if (e.target === clientFileModal) clientFileModal.classList.remove('open'); });
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

    // Kopiowanie kolorów HEX z Karty Marki po kliknięciu
    if (clientCopyPrimaryColor) {
        clientCopyPrimaryColor.addEventListener('click', () => {
            const hex = clientBrandPrimaryText ? clientBrandPrimaryText.innerText : '#D4FF00';
            navigator.clipboard.writeText(hex).catch(() => {});
            clientBrandPrimaryText.innerText = `${hex} (Skopiowano!)`;
            setTimeout(() => { clientBrandPrimaryText.innerText = hex; }, 1500);
        });
    }
    if (clientCopyAccentColor) {
        clientCopyAccentColor.addEventListener('click', () => {
            const hex = clientBrandAccentText ? clientBrandAccentText.innerText : '#FF6B00';
            navigator.clipboard.writeText(hex).catch(() => {});
            clientBrandAccentText.innerText = `${hex} (Skopiowano!)`;
            setTimeout(() => { clientBrandAccentText.innerText = hex; }, 1500);
        });
    }

    // Zapis Ankiety Startowej (Briefu #5) przez Klienta
    if (clientBriefForm) {
        clientBriefForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentClientCache.brief = {
                industry: briefIndustry.value.trim(),
                audience: briefAudience.value.trim(),
                inspiration: briefInspiration.value.trim(),
                goal: briefGoal.value.trim(),
                updatedAt: getCurrentTimeStr()
            };

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `📋 Wypełniłem Ankietę Startową (Brief Marki) w panelu! Cel na najbliższe 30 dni: ${currentClientCache.brief.goal}.`,
                time: getCurrentTimeStr()
            });

            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);

            if (clientBriefFeedback) {
                clientBriefFeedback.style.color = '#d4ff00';
                clientBriefFeedback.innerText = '✅ Twój Brief został zapisany i przekazany opiekunowi projektu!';
            }
        });
    }

    // Przesyłanie surowych materiałów OD Klienta (#6)
    if (clientUploadMaterialForm) {
        clientUploadMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('clientMatTitle').value.trim();
            const link = document.getElementById('clientMatLink').value.trim();
            const notes = document.getElementById('clientMatNotes').value.trim();
            const fileInput = document.getElementById('clientMatFile');

            let finalUrl = link;
            let fileNameLabel = link ? 'Link zewnętrzny' : 'Brak linku';

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const f = fileInput.files[0];
                if (f.size <= 750 * 1024) {
                    try {
                        finalUrl = await readFileAsDataURL(f);
                        fileNameLabel = f.name;
                    } catch (err) {}
                } else {
                    alert('Plik z urządzenia przekracza 750 KB. Dla dużych wideo/zdjęć wklej link do Dysku Google lub WeTransfera powyżej.');
                    return;
                }
            }

            currentClientCache.clientUploads = currentClientCache.clientUploads || [];
            currentClientCache.clientUploads.unshift({
                id: 'up_' + Date.now(),
                title,
                url: finalUrl || '#',
                fileName: fileNameLabel,
                notes,
                createdAt: getCurrentTimeStr()
            });

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `📤 Przesłałem nowe materiały do realizacji w zakładce „Prześlij Materiały”: „${title}”.`,
                time: getCurrentTimeStr()
            });

            clientUploadMaterialForm.reset();
            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);

            if (clientUploadFeedback) {
                clientUploadFeedback.style.color = '#d4ff00';
                clientUploadFeedback.innerText = '✅ Materiały zostały przekazane zespołowi Wake The Brand!';
            }
        });
    }

    function renderClientUI(data) {
        if (!clientActivePackage) return;
        currentClientCache = data;
        saveLocalData(data);

        const progressVal = data.progressPercent ?? 0;
        const guardianName = data.guardian || 'Wspólny (Mateusz & Bartek)';

        if (clientTopName) clientTopName.innerText = data.clientName || 'Konto Klienta';
        if (clientGuardianBadge) clientGuardianBadge.innerText = `🤝 Opiekun: ${guardianName}`;
        if (clientOverviewGuardian) clientOverviewGuardian.innerText = `Opiekun projektu: ${guardianName}`;
        if (clientWelcomeTitle) clientWelcomeTitle.innerText = `Cześć! Oto aktualny status dla: ${data.clientName} ⚡`;
        if (clientActivePackage) clientActivePackage.innerText = data.packageName || 'Oczekuje na ustalenie ⏳';
        if (clientProgressPercent) clientProgressPercent.innerText = progressVal;
        if (clientProgressBar) clientProgressBar.style.width = `${progressVal}%`;
        if (clientCurrentCost) clientCurrentCost.innerText = data.currentCost || '0 zł (Do ustalenia)';
        if (clientPaymentStatus) clientPaymentStatus.innerText = data.paymentStatus || '⏳ Oczekuje na płatność';
        if (clientAdBudget) clientAdBudget.innerText = data.adBudget || '0 zł';

        // Zadania z plakietką wykonawcy
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
                ? tasks.slice(0, 4).map(t => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${t.title}</strong>
                            <small>${t.category} ${t.assignee ? `<span class="assignee-mini-tag">👤 ${t.assignee}</span>` : ''}</small>
                        </div>
                        ${statusBadgeHTML(t.status)}
                    </li>
                `).join('')
                : emptyTasksHTML;
        }
        if (clientFullTaskList) {
            clientFullTaskList.innerHTML = tasks.length > 0
                ? tasks.map(t => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${t.title}</strong>
                            <small>Obszar: ${t.category} ${t.assignee ? `<span class="assignee-mini-tag">Wykonawca: ${t.assignee}</span>` : ''}</small>
                        </div>
                        ${statusBadgeHTML(t.status)}
                    </li>
                `).join('')
                : emptyTasksHTML;
        }

        // Pliki do akceptacji
        const filePackages = data.filePackages || [];
        if (clientFilesGrid) {
            if (filePackages.length === 0) {
                clientFilesGrid.innerHTML = `
                    <div class="glass-card" style="grid-column:1/-1;text-align:center;padding:3rem 1.5rem;">
                        <span style="font-size:2.4rem;display:block;margin-bottom:0.8rem;">📁</span>
                        <h3>Brak materiałów oczekujących na akceptację</h3>
                        <p style="color:var(--text-muted);max-width:520px;margin:0.6rem auto 0;">
                            Gdy nasz zespół przygotuje dla Ciebie projekty graficzne, wideo lub podgląd strony WWW, Administrator udostępni je tutaj w formie gotowych kontenerów do pobrania.
                        </p>
                    </div>
                `;
            } else {
                clientFilesGrid.innerHTML = filePackages.map(pkg => {
                    const filesCount = (pkg.files || []).length;
                    const shortDesc = (pkg.description || '').length > 110 ? pkg.description.slice(0, 110) + '...' : (pkg.description || '');
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
                                    📎 Załączone pliki: <strong>${filesCount}</strong> • Dodano: ${pkg.createdAt || 'Teraz'}
                                </div>
                                <button type="button" class="btn btn-primary btn-sm btn-full">
                                    📂 Otwórz kontener i pobierz pliki →
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                clientFilesGrid.querySelectorAll('[data-open-pkg]').forEach(card => {
                    card.addEventListener('click', () => openClientFilePackageModal(card.getAttribute('data-open-pkg')));
                });
            }
        }

        // Karta Marki (Mini Brandboard #4) u Klienta
        const bb = data.brandboard || defaultClientData.brandboard;
        if (clientBrandPrimarySwatch) clientBrandPrimarySwatch.style.background = bb.primaryColor || '#D4FF00';
        if (clientBrandPrimaryText) clientBrandPrimaryText.innerText = bb.primaryColor || '#D4FF00';
        if (clientBrandAccentSwatch) clientBrandAccentSwatch.style.background = bb.accentColor || '#FF6B00';
        if (clientBrandAccentText) clientBrandAccentText.innerText = bb.accentColor || '#FF6B00';
        if (clientBrandFonts) clientBrandFonts.innerText = bb.fonts || 'Ustalane przez zespół Wake The Brand';
        if (clientBrandWebsite) clientBrandWebsite.innerText = bb.website || 'W trakcie konfiguracji';
        if (clientBrandSocials) clientBrandSocials.innerText = bb.socials || 'Do uzupełnienia';
        if (clientBrandTone) clientBrandTone.innerText = bb.tone || 'Nowoczesny, wyrazisty';

        // Wypełnienie pól Briefu (#5), jeśli już wcześniej istniał
        if (data.brief && briefIndustry && !briefIndustry.matches(':focus')) {
            briefIndustry.value = data.brief.industry || '';
            briefAudience.value = data.brief.audience || '';
            briefInspiration.value = data.brief.inspiration || '';
            briefGoal.value = data.brief.goal || '';
        }

        // Lista materiałów przesłanych przez klienta (#6)
        const uploads = data.clientUploads || [];
        if (clientUploadedMaterialsList) {
            clientUploadedMaterialsList.innerHTML = uploads.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Nie przesłałeś jeszcze żadnych paczek materiałów.</span></li>`
                : uploads.map(u => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>📤 ${u.title}</strong>
                            <small>${u.notes || 'Brak dodatkowych uwag'} • Wysłano: ${u.createdAt}</small>
                        </div>
                        ${u.url && u.url !== '#' ? `<a href="${u.url}" target="_blank" download="${u.fileName || 'material'}" class="btn btn-outline btn-sm">Otwórz / Pobierz</a>` : ''}
                    </li>
                `).join('');
        }

        // Tabela rozliczeń z linkiem do opłacenia
        const finances = data.finances || [];
        if (clientFinanceTable) {
            clientFinanceTable.innerHTML = finances.length > 0
                ? finances.map(f => `
                    <tr>
                        <td><strong>${f.period}</strong></td>
                        <td>${f.scope}</td>
                        <td>${f.docType}</td>
                        <td class="highlight-col">${f.amount}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
                                <span>${f.status}</span>
                                ${f.paymentLink ? `<a href="${f.paymentLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="padding:0.3rem 0.7rem;font-size:0.75rem;">💳 Opłać / Pobierz →</a>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')
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

    // 7. PANEL ADMINISTRATORA (WSZYSTKIE 9 NOWYCH FUNKCJI)
    const adminStatusForm = document.getElementById('adminStatusForm');
    const adminClientSelector = document.getElementById('adminClientSelector');
    const bannerClientName = document.getElementById('bannerClientName');
    const adminClientName = document.getElementById('adminClientName');
    const adminProjectGuardian = document.getElementById('adminProjectGuardian');
    const adminPackageName = document.getElementById('adminPackageName');
    const adminProgressSlider = document.getElementById('adminProgressSlider');
    const adminProgressVal = document.getElementById('adminProgressVal');
    const adminCurrentCost = document.getElementById('adminCurrentCost');
    const adminPaymentStatus = document.getElementById('adminPaymentStatus');
    const adminAdBudget = document.getElementById('adminAdBudget');
    const adminStatusFeedback = document.getElementById('adminStatusFeedback');

    // Prywatne notatki wewnętrzne (#2)
    const adminInternalNotesForm = document.getElementById('adminInternalNotesForm');
    const adminInternalNotesInput = document.getElementById('adminInternalNotesInput');
    const adminNotesFeedback = document.getElementById('adminNotesFeedback');

    // Powiadomienia mailowe (#1)
    const sendEmailNotifyQuickBtn = document.getElementById('sendEmailNotifyQuickBtn');
    const notifyClientStatusBtn = document.getElementById('notifyClientStatusBtn');
    const notifyClientFilesBtn = document.getElementById('notifyClientFilesBtn');
    const notifyClientFinanceBtn = document.getElementById('notifyClientFinanceBtn');

    // Kalkulator przychodu (#7) & Wyszukiwarka kont
    const statPaidRevenue = document.getElementById('statPaidRevenue');
    const statSplitPerOwner = document.getElementById('statSplitPerOwner');
    const statPendingRevenue = document.getElementById('statPendingRevenue');
    const statTotalAccounts = document.getElementById('statTotalAccounts');
    const statClientAccounts = document.getElementById('statClientAccounts');
    const statAdminAccounts = document.getElementById('statAdminAccounts');
    const statTotalLeads = document.getElementById('statTotalLeads');
    const sidebarLeadsCount = document.getElementById('sidebarLeadsCount');

    // Ogłoszenie globalne (#9)
    const globalAnnouncementForm = document.getElementById('globalAnnouncementForm');
    const globalAnnouncementInput = document.getElementById('globalAnnouncementInput');
    const globalAnnouncementActive = document.getElementById('globalAnnouncementActive');
    const globalAnnouncementFeedback = document.getElementById('globalAnnouncementFeedback');

    const adminAccountsList = document.getElementById('adminAccountsList');
    const adminAccountSearch = document.getElementById('adminAccountSearch');
    const adminGuardianFilter = document.getElementById('adminGuardianFilter');
    const adminRoleFilter = document.getElementById('adminRoleFilter');
    const adminAccountActionFeedback = document.getElementById('adminAccountActionFeedback');

    const adminAddTaskForm = document.getElementById('adminAddTaskForm');
    const adminTaskList = document.getElementById('adminTaskList');
    const adminAddFilePackageForm = document.getElementById('adminAddFilePackageForm');
    const adminFilePackagesList = document.getElementById('adminFilePackagesList');

    // Karta Marki (#4), Brief (#5) i Materiały od Klienta (#6) w Adminie
    const adminBrandboardForm = document.getElementById('adminBrandboardForm');
    const brandPrimaryColor = document.getElementById('brandPrimaryColor');
    const brandAccentColor = document.getElementById('brandAccentColor');
    const previewPrimarySwatch = document.getElementById('previewPrimarySwatch');
    const previewAccentSwatch = document.getElementById('previewAccentSwatch');
    const brandFonts = document.getElementById('brandFonts');
    const brandWebsite = document.getElementById('brandWebsite');
    const brandSocialLinks = document.getElementById('brandSocialLinks');
    const brandTone = document.getElementById('brandTone');
    const adminBrandFeedback = document.getElementById('adminBrandFeedback');
    const adminClientBriefView = document.getElementById('adminClientBriefView');
    const adminClientUploadsList = document.getElementById('adminClientUploadsList');

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

    // Inicjalizacja pól ogłoszenia globalnego w Adminie
    if (globalAnnouncementInput) {
        const savedAnn = getLocalAnnouncement();
        globalAnnouncementInput.value = savedAnn.text || '';
        if (globalAnnouncementActive) globalAnnouncementActive.checked = Boolean(savedAnn.active);
    }

    if (globalAnnouncementForm) {
        globalAnnouncementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const annObj = {
                text: globalAnnouncementInput.value.trim(),
                active: globalAnnouncementActive ? globalAnnouncementActive.checked : true,
                updatedAt: getCurrentTimeStr()
            };
            saveLocalAnnouncement(annObj);
            if (firebaseReady && db) {
                try {
                    await fbFns.setDoc(fbFns.doc(db, 'settings', 'global_announcement'), annObj);
                } catch (err) {}
            }
            if (globalAnnouncementFeedback) {
                globalAnnouncementFeedback.innerText = '✓ Zaktualizowano u wszystkich klientów!';
                setTimeout(() => { globalAnnouncementFeedback.innerText = ''; }, 3000);
            }
        });
    }

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
            opt.innerText = `${acc.clientName || acc.id} [${acc.guardian || 'Wspólny'}]`;
            adminClientSelector.appendChild(opt);
        });
        if (!allAccountsCache.some(a => a.id === selectedAdminClientId) && allAccountsCache.length > 0) {
            selectedAdminClientId = allAccountsCache[0].id;
        }
        adminClientSelector.value = selectedAdminClientId;
    }

    // FUNKCJA #7: KALKULATOR PRZYCHODU AGENCJI + LISTA WSZYSTKICH KONT Z FILTREM OPIEKUNA
    function renderAllAccountsList() {
        if (!adminAccountsList) return;
        const searchQuery = (adminAccountSearch ? adminAccountSearch.value : '').trim().toLowerCase();
        const roleFilter = adminRoleFilter ? adminRoleFilter.value : 'all';
        const guardianFilter = adminGuardianFilter ? adminGuardianFilter.value : 'all';

        let adminsCount = 0;
        let clientsCount = 0;
        let paidRevenueSum = 0;
        let pendingRevenueSum = 0;

        allAccountsCache.forEach(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            if (isAccAdmin) {
                adminsCount++;
            } else {
                clientsCount++;
            }

            // Zliczanie przychodu z głównego pakietu klienta
            const pkgAmount = parseAmountPLN(acc.currentCost);
            if (pkgAmount > 0) {
                if ((acc.paymentStatus || '').includes('Opłacone')) {
                    paidRevenueSum += pkgAmount;
                } else {
                    pendingRevenueSum += pkgAmount;
                }
            }
        });

        if (statTotalAccounts) statTotalAccounts.innerText = allAccountsCache.length;
        if (statAdminAccounts) statAdminAccounts.innerText = adminsCount;
        if (statClientAccounts) statClientAccounts.innerText = clientsCount;
        if (statPaidRevenue) statPaidRevenue.innerText = formatPLN(paidRevenueSum);
        if (statPendingRevenue) statPendingRevenue.innerText = formatPLN(pendingRevenueSum);
        if (statSplitPerOwner) {
            const half = Math.round(paidRevenueSum / 2);
            statSplitPerOwner.innerText = `Podział 50/50: po ${formatPLN(half)} (Mateusz / Bartek)`;
        }

        const filtered = allAccountsCache.filter(acc => {
            const isAccAdmin = isOwnerEmail(acc.email) || acc.isAdminRole === true;
            const isBlocked = acc.isBlocked === true;
            const accGuardian = acc.guardian || 'Wspólny';

            if (roleFilter === 'admin' && !isAccAdmin) return false;
            if (roleFilter === 'client' && isAccAdmin) return false;
            if (roleFilter === 'blocked' && !isBlocked) return false;
            if (guardianFilter !== 'all' && accGuardian !== guardianFilter) return false;

            if (searchQuery) {
                const hay = `${acc.clientName || ''} ${acc.userName || ''} ${acc.email || ''} ${acc.packageName || ''} ${accGuardian}`.toLowerCase();
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
            const accGuardian = acc.guardian || 'Wspólny';
            const hasBrief = Boolean(acc.brief);

            return `
                <div class="account-card-row ${isSelected ? 'selected-account' : ''}">
                    <div class="account-main-info">
                        <div class="account-title-line">
                            <strong style="font-size:1.05rem;">${acc.clientName || 'Bez nazwy'}</strong>
                            ${isAccAdmin ? '<span class="role-pill admin-role">👑 Administrator</span>' : '<span class="role-pill client-role">👤 Klient</span>'}
                            <span class="role-pill guardian-pill">🤝 Opiekun: ${accGuardian}</span>
                            ${hasBrief ? '<span class="role-pill client-role">📋 Brief wypełniony</span>' : ''}
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

    // FUNKCJA #8: MINI-CRM W ZAPYTANIACH Z KONTAKTU (ZMIANA STATUSU LEADA)
    function renderLeadsListUI(leadsArray) {
        const count = leadsArray ? leadsArray.length : 0;
        if (statTotalLeads) statTotalLeads.innerText = count;
        if (sidebarLeadsCount) sidebarLeadsCount.innerText = count;
        if (!adminLeadsList) return;

        if (!leadsArray || leadsArray.length === 0) {
            adminLeadsList.innerHTML = '<li class="dash-task-item"><span>Brak zapytań z formularza kontaktowego.</span></li>';
            return;
        }

        adminLeadsList.innerHTML = leadsArray.map(lead => `
            <li class="dash-task-item" style="align-items:flex-start;">
                <div class="task-meta">
                    <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin-bottom:0.25rem;">
                        <strong>${lead.name} (${lead.email})</strong>
                        <span style="color:var(--accent-lime);font-size:0.82rem;">• ${lead.topics}</span>
                    </div>
                    <p style="margin:0.4rem 0;color:#d1d5db;">${lead.message}</p>
                    <small>Wysłano: ${lead.createdAt}</small>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                    <button type="button" class="btn-mini" data-cycle-lead="${lead.id}" title="Kliknij, aby zmienić status CRM">
                        ${leadStatusBadgeHTML(lead.crmStatus || 'new')}
                    </button>
                    <a href="mailto:${lead.email}?subject=Odpowiedź Wake The Brand" class="btn-mini">✉️ Odpisz mailem</a>
                    <button type="button" class="admin-action-btn" data-del-lead="${lead.id}">Usuń</button>
                </div>
            </li>
        `).join('');

        // Przełączanie statusu CRM po kliknięciu (new -> contacted -> client)
        adminLeadsList.querySelectorAll('[data-cycle-lead]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const leadId = btn.getAttribute('data-cycle-lead');
                const currentLeads = getLocalLeads();
                const target = currentLeads.find(l => l.id === leadId);
                const curStatus = (target && target.crmStatus) ? target.crmStatus : 'new';
                const nextStatus = curStatus === 'new' ? 'contacted' : (curStatus === 'contacted' ? 'client' : 'new');

                if (target) target.crmStatus = nextStatus;
                saveLocalLeadsList(currentLeads);
                renderLeadsListUI(currentLeads);

                if (firebaseReady && db) {
                    try {
                        await fbFns.setDoc(fbFns.doc(db, 'contact_leads', leadId), { crmStatus: nextStatus }, { merge: true });
                    } catch (e) {}
                }
            });
        });

        adminLeadsList.querySelectorAll('[data-del-lead]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const leadId = btn.getAttribute('data-del-lead');
                const localFiltered = getLocalLeads().filter(l => l.id !== leadId);
                saveLocalLeadsList(localFiltered);
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

        if (bannerClientName) bannerClientName.innerText = `${data.clientName || 'Konto'} (${data.email || 'brak e-maila'}) • Opiekun: ${data.guardian || 'Wspólny'}`;
        adminClientName.value = data.clientName || '';
        if (adminProjectGuardian) adminProjectGuardian.value = data.guardian || 'Wspólny';
        adminPackageName.value = data.packageName || '';
        adminProgressSlider.value = progressVal;
        adminProgressVal.innerText = `${progressVal}%`;
        adminCurrentCost.value = data.currentCost || '0 zł (Do ustalenia)';
        adminPaymentStatus.value = data.paymentStatus || '⏳ Oczekuje na płatność';
        adminAdBudget.value = data.adBudget || '0 zł';

        // Prywatne notatki wewnętrzne (#2)
        if (adminInternalNotesInput && !adminInternalNotesInput.matches(':focus')) {
            adminInternalNotesInput.value = data.internalNotes || '';
        }

        // Karta Marki (#4) w Adminie
        const bb = data.brandboard || defaultClientData.brandboard;
        if (brandPrimaryColor && !brandPrimaryColor.matches(':focus')) {
            brandPrimaryColor.value = bb.primaryColor || '#D4FF00';
            brandAccentColor.value = bb.accentColor || '#FF6B00';
            brandFonts.value = bb.fonts || '';
            brandWebsite.value = bb.website || '';
            brandSocialLinks.value = bb.socials || '';
            brandTone.value = bb.tone || '';
            if (previewPrimarySwatch) previewPrimarySwatch.style.background = bb.primaryColor || '#D4FF00';
            if (previewAccentSwatch) previewAccentSwatch.style.background = bb.accentColor || '#FF6B00';
        }

        // Podgląd wypełnionego Briefu (#5) w Adminie
        if (adminClientBriefView) {
            if (!data.brief) {
                adminClientBriefView.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;">Klient nie wypełnił jeszcze Ankiety Startowej w swoim panelu.</p>`;
            } else {
                adminClientBriefView.innerHTML = `
                    <div class="brief-answer-box">
                        <small>1. Branża i wyróżnik oferty:</small>
                        <div>${data.brief.industry || '-'}</div>
                    </div>
                    <div class="brief-answer-box">
                        <small>2. Grupa docelowa (Idealni klienci):</small>
                        <div>${data.brief.audience || '-'}</div>
                    </div>
                    <div class="brief-answer-box">
                        <small>3. Inspiracje i estetyka:</small>
                        <div>${data.brief.inspiration || '-'}</div>
                    </div>
                    <div class="brief-answer-box">
                        <small>4. Cel na najbliższe 30 dni (Aktualizacja: ${data.brief.updatedAt || ''}):</small>
                        <strong>${data.brief.goal || '-'}</strong>
                    </div>
                `;
            }
        }

        // Lista materiałów przesłanych OD klienta (#6) w Adminie
        const clientUploads = data.clientUploads || [];
        if (adminClientUploadsList) {
            adminClientUploadsList.innerHTML = clientUploads.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Klient nie wgrał jeszcze żadnych własnych materiałów.</span></li>`
                : clientUploads.map((u, idx) => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>📤 ${u.title}</strong>
                            <small>${u.notes || 'Brak opisu'} • Wysłano: ${u.createdAt}</small>
                        </div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            ${u.url && u.url !== '#' ? `<a href="${u.url}" target="_blank" download="${u.fileName || 'plik'}" class="btn-mini btn-manage">⬇️️ Otwórz / Pobierz</a>` : ''}
                            <button type="button" class="admin-action-btn" data-del-upload="${idx}">Usuń</button>
                        </div>
                    </li>
                `).join('');

            adminClientUploadsList.querySelectorAll('[data-del-upload]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.getAttribute('data-del-upload'), 10);
                    selectedAdminClientData.clientUploads.splice(idx, 1);
                    renderAdminUI(selectedAdminClientData);
                    await saveClientData(selectedAdminClientId, selectedAdminClientData);
                });
            });
        }

        // Lista zadań w Adminie
        const tasks = data.tasks || [];
        if (adminTaskList) {
            adminTaskList.innerHTML = tasks.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Brak zadań na koncie tego klienta. Dodaj zadanie lub użyj szablonu 1-Click powyżej.</span></li>`
                : tasks.map((t, idx) => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${t.title}</strong>
                            <small>${t.category} • Wykonawca: <strong style="color:var(--accent-lime);">${t.assignee || 'Wspólnie'}</strong></small>
                        </div>
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

        // Kontenery plików do akceptacji
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

        // Finanse w Adminie
        const finances = data.finances || [];
        if (adminFinanceList) {
            adminFinanceList.innerHTML = finances.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Brak wystawionych rozliczeń dla tego klienta.</span></li>`
                : finances.map((f, idx) => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${f.period} – ${f.amount}</strong>
                            <small>${f.scope} (${f.docType}) • ${f.status} ${f.paymentLink ? '• 🔗 Link podpięty' : ''}</small>
                        </div>
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
    if (adminGuardianFilter) adminGuardianFilter.addEventListener('change', renderAllAccountsList);
    if (adminClientSelector) adminClientSelector.addEventListener('change', () => subscribeToSelectedClient(adminClientSelector.value));

    // Podgląd kolorów HEX na żywo w edytorze Brandboardu
    if (brandPrimaryColor && previewPrimarySwatch) {
        brandPrimaryColor.addEventListener('input', () => { previewPrimarySwatch.style.background = brandPrimaryColor.value; });
    }
    if (brandAccentColor && previewAccentSwatch) {
        brandAccentColor.addEventListener('input', () => { previewAccentSwatch.style.background = brandAccentColor.value; });
    }

    // 8. POŁĄCZENIE Z FIREBASE (PROMISE.ALL + BRAVE LONG-POLLING)
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
            currentLoggedInAdminEmail = auth.currentUser.email.toLowerCase();
            localStorage.setItem('wtb_admin_email', currentLoggedInAdminEmail);
            if (adminEmailLabelEl) adminEmailLabelEl.innerText = currentLoggedInAdminEmail;
        }

        // Nasłuch Globalnego Ogłoszenia (#9) u Klienta i Admina
        fbFns.onSnapshot(fbFns.doc(db, 'settings', 'global_announcement'), (annSnap) => {
            if (annSnap.exists()) {
                const annData = annSnap.data();
                saveLocalAnnouncement(annData);
                renderAnnouncementBanner(annData);
                if (globalAnnouncementInput && !globalAnnouncementInput.matches(':focus')) {
                    globalAnnouncementInput.value = annData.text || '';
                    if (globalAnnouncementActive) globalAnnouncementActive.checked = Boolean(annData.active);
                }
            }
        });

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
                    saveLocalLeadsList(arr);
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
                crmStatus: 'new',
                createdAt: getCurrentTimeStr(),
                timestamp: Date.now()
            };

            const currentLeads = getLocalLeads();
            currentLeads.unshift(leadObj);
            saveLocalLeadsList(currentLeads);

            if (firebaseReady && db) {
                try { await fbFns.setDoc(fbFns.doc(db, 'contact_leads', leadObj.id), leadObj); } catch (err) {}
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
            formFeedback.innerText = `Dzięki, ${name}! Zgłoszenie zostało zapisane i wysłane do Wake The Brand ⚡`;
            contactForm.reset();
        });
    }

    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm =Oto **pełny, kompletny kod pliku `script.js`** (Część 3 z 3), który spina wszystkie 9 nowych funkcji z bazą danych **Firebase**:

### Co dokładnie robi ten skrypt?
1. **Kalkulator Przychodu Agencji (`#7`):** Automatycznie wyciąga kwoty z opłaconych i oczekujących pakietów oraz faktur wszystkich klientów, sumuje je na żywo i wylicza podział 50/50 dla Mateusza i Bartka.
2. **Globalny Pasek Ogłoszeń (`#9`):** Zapisuje ogłoszenie w kolekcji `settings/global_announcement` w Firebase (oraz w pamięci podręcznej) i natychmiast wyświetla je na górze u wszystkich klientów.
3. **Opiekun Projektu i Zadań (`#3`):** Pozwala przypisać projekt lub pojedyncze zadanie do **Mateusza**, **Bartka** lub **Wspólnie**, wyświetla plakietkę opiekuna u klienta oraz pozwala filtrować konta po opiekunie w wyszukiwarce.
4. **Prywatne Notatki Wewnętrzne (`#2`):** Zapisuje tajne notatki o kliencie widoczne wyłącznie w `admin.html`.
5. **Karta Marki – Mini Brandboard (`#4`):** Aktualizuje kolory HEX (z podglądem na żywo i kopiowaniem po kliknięciu u klienta), czcionki, stronę WWW i styl komunikacji.
6. **Ankieta Startowa – Brief (`#5`):** Zapisuje odpowiedzi klienta z formularza w `panel-klienta.html`, wyświetla je w czytelnych boksach w `admin.html` i wysyła powiadomienie na czat.
7. **Repozytorium materiałów OD klienta (`#6`):** Klient przesyła linki lub małe pliki ze swojego panelu, a Wy widzicie je na liście w `admin.html` z przyciskiem otwarcia/pobrania.
8. **Powiadomienia na maila klienta (`#1`):** Przyciski w `admin.html` wysyłają automatyczne powiadomienie przez FormSubmit prosto na adres e-mail wybranego klienta.
9. **Mini-CRM w Zapytaniach z Kontaktu (`#8`):** Kliknięcie plakietki statusu przy zapytaniu przełącza je pomiędzy: `🔥 Nowe` ➡️ `📞 W kontakcie` ➡️ `✅ Klient`.

*(Wskazówka: aby w Firebase działał też zapis globalnego paska ogłoszeń, upewnij się, że w zakładce **Rules** w Firestore masz ogólną regułę `match /{document=**} { allow read, write: if true; }`).*

---

### Część 3 z 3: Pełny kod pliku `script.js`

Podmień cały plik **`script.js`** na poniższy kod:

```javascript
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

    const CONTACT_RECEIVER_EMAIL = "wakethebrand.kontakt@gmail.com";

    const ADMIN_EMAILS = [
        'mbugajski@wakethebrand.pl',
        'bkoczara@wakethebrand.pl',
        'kontakt@wakethebrand.pl',
        'contact@wakethebrand.pl',
        'wakethebrand.kontakt@gmail.com',
        'mateuszbugecik@gmail.com'
    ];

    const STORAGE_KEY = 'wtb_portal_data_v7';
    const LEADS_STORAGE_KEY = 'wtb_leads_local_v2';
    const ACCOUNTS_CACHE_KEY = 'wtb_accounts_cache_v7';
    const ANNOUNCEMENT_KEY = 'wtb_global_announcement_v1';

    // Gotowe szablony zadań (1-Click Onboarding w Adminie)
    const TASK_TEMPLATES = {
        www: [
            { title: 'Architektura informacji i makieta UX strony WWW', category: 'Strona WWW', status: 'todo', assignee: 'Mateusz' },
            { title: 'Projekt graficzny UI i kodowanie responsywnego front-endu', category: 'Strona WWW', status: 'todo', assignee: 'Mateusz' },
            { title: 'Podpięcie formularza, domeny i certyfikatu SSL', category: 'Strona WWW', status: 'todo', assignee: 'Wspólnie' },
            { title: 'Optymalizacja szybkości ładowania i podstawowe SEO', category: 'Strona WWW', status: 'todo', assignee: 'Bartek' }
        ],
        social: [
            { title: 'Audyt profilu, optymalizacja BIO i wyróżnionych relacji', category: 'Social Media', status: 'todo', assignee: 'Bartek' },
            { title: 'Opracowanie scenariuszy i haków (Hooks) do 4 Rolek', category: 'Wideo & Reels', status: 'todo', assignee: 'Bartek' },
            { title: 'Dynamiczny montaż wideo, napisy i sound design', category: 'Wideo & Reels', status: 'todo', assignee: 'Mateusz' },
            { title: 'Harmonogram publikacji i dobór słów kluczowych', category: 'Social Media', status: 'todo', assignee: 'Wspólnie' }
        ],
        branding: [
            { title: 'Moodboard i kierunek estetyczny identyfikacji marki', category: 'Branding', status: 'todo', assignee: 'Mateusz' },
            { title: 'Projekt sygnetu, logotypu oraz dobór typografii', category: 'Branding', status: 'todo', assignee: 'Mateusz' },
            { title: 'Przygotowanie Karty Marki (Brandboard) i paczki plików', category: 'Branding', status: 'todo', assignee: 'Wspólnie' }
        ],
        ads: [
            { title: 'Konfiguracja Menedżera Reklam i Piksela / zdarzeń konwersji', category: 'Kampanie Ads', status: 'todo', assignee: 'Bartek' },
            { title: 'Przygotowanie kreacji reklamowych i tekstów sprzedażowych', category: 'Kampanie Ads', status: 'todo', assignee: 'Wspólnie' },
            { title: 'Uruchomienie kampanii i optymalizacja grup odbiorców', category: 'Kampanie Ads', status: 'todo', assignee: 'Bartek' }
        ]
    };

    // Czysty szablon dla nowego klienta (0% postępu, 0 zł budżetu, brak zadań i plików)
    const defaultClientData = {
        clientName: 'Nowy Klient (Oczekuje na aktywację)',
        userName: 'Klient',
        email: 'klient@twojamarka.pl',
        isAdminRole: false,
        isBlocked: false,
        createdAt: 'Nowe konto',
        guardian: 'Wspólny',
        internalNotes: '',
        packageName: 'Oczekuje na wybór i opłacenie ⏳',
        progressPercent: 0,
        currentCost: '0 zł (Do ustalenia)',
        paymentStatus: '⏳ Oczekuje na płatność',
        adBudget: '0 zł',
        tasks: [],
        filePackages: [],
        clientUploads: [],
        finances: [],
        brandboard: {
            primaryColor: '#D4FF00',
            accentColor: '#FF6B00',
            fonts: 'Ustalane przez zespół Wake The Brand',
            website: 'W trakcie konfiguracji',
            socials: 'Do uzupełnienia',
            tone: 'Ustalany po wypełnieniu Briefu'
        },
        brief: null,
        messages: [
            {
                sender: 'agency',
                author: 'Wake The Brand ⚡',
                text: 'Cześć! Witamy w Twoim Panelu Klienta. Zachęcamy do wypełnienia krótkiej Ankiety Startowej w zakładce „Moja Marka & Brief”. Po opłaceniu pakietu uruchomimy tutaj Twój harmonogram zadań oraz pasek postępu.',
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

    function parseAmountPLN(str) {
        if (!str) return 0;
        const cleaned = String(str).replace(/\s+/g, '').replace(',', '.');
        const match = cleaned.match(/(\d+(\.\d+)?)/);
        return match ? Math.round(parseFloat(match[1])) : 0;
    }

    function formatPLN(num) {
        return Number(num || 0).toLocaleString('pl-PL') + ' zł';
    }

    function getLocalData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClientData));
            return JSON.parse(JSON.stringify(defaultClientData));
        }
        try { return JSON.parse(raw); } catch (e) { return JSON.parse(JSON.stringify(defaultClientData)); }
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
        try { localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function getLocalLeads() {
        const raw = localStorage.getItem(LEADS_STORAGE_KEY);
        if (!raw) return [];
        try { return JSON.parse(raw); } catch (e) { return []; }
    }

    function saveLocalLeads(arr) {
        try { localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    function getLocalAnnouncement() {
        const raw = localStorage.getItem(ANNOUNCEMENT_KEY);
        if (!raw) return { text: '', active: false };
        try { return JSON.parse(raw); } catch (e) { return { text: '', active: false }; }
    }

    function saveLocalAnnouncement(obj) {
        try { localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(obj)); } catch (e) {}
    }

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
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
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
            checkboxes.forEach(box => { if (box.checked) selected.push(box.getAttribute('data-name')); });
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
            const editTabs = ['admin-tab-status', 'admin-tab-tasks', 'admin-tab-files', 'admin-tab-brand', 'admin-tab-finances', 'admin-tab-chat'];
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
    let currentLoggedInAdminEmail = (localStorage.getItem('wtb_admin_email') || 'mbugajski@wakethebrand.pl').toLowerCase();

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

    function leadStatusBadgeHTML(status) {
        if (status === 'client') return '<span class="badge-status done">✅ Klient</span>';
        if (status === 'contacted') return '<span class="badge-status progress">📞 W kontakcie</span>';
        return '<span class="role-pill admin-role">🔥 Nowe zapytanie</span>';
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

    // FUNKCJA #1: WYSYŁANIE POWIADOMIENIA NA E-MAIL KLIENTA
    async function sendEmailNotificationToClient(clientData, subjectText, messageBody) {
        const targetEmail = (clientData && clientData.email) ? clientData.email.trim() : '';
        if (!targetEmail || !targetEmail.includes('@')) {
            alert('Ten profil nie ma przypisanego poprawnego adresu e-mail.');
            return;
        }

        try {
            if (window.location.protocol !== 'file:') {
                await fetch(`[https://formsubmit.co/ajax/$](https://formsubmit.co/ajax/$){targetEmail}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        _subject: `⚡ Wake The Brand: ${subjectText}`,
                        Powiadomienie_dla_Marki: clientData.clientName || 'Klient',
                        Wiadomosc_od_Zespolu: messageBody,
                        Opiekun_Projektu: clientData.guardian || 'Zespół Wake The Brand',
                        _template: 'table'
                    })
                });
            }
        } catch (e) {}

        // Otwórz dodatkowo gotowy szkic w programie pocztowym lub potwierdź na czacie
        clientData.messages = clientData.messages || [];
        clientData.messages.push({
            sender: 'agency',
            author: 'Wake The Brand ⚡ (Powiadomienie E-mail)',
            text: `📧 Wysłaliśmy powiadomienie na Twój adres ${targetEmail}: „${subjectText}”.`,
            time: getCurrentTimeStr()
        });
        await saveClientData(selectedAdminClientId, clientData);
        renderAdminUI(clientData);
        alert(`✅ Wysłano powiadomienie na adres klienta: ${targetEmail} oraz zapisano informację na czacie!`);
    }

    // 6. PANEL KLIENTA (W TYM PASEK OGŁOSZEń, BRANDBOARD, BRIEF, WGRYWANIE MATERIAŁÓW)
    const clientGlobalAnnouncement = document.getElementById('clientGlobalAnnouncement');
    const clientGlobalAnnouncementText = document.getElementById('clientGlobalAnnouncementText');
    const clientGuardianBadge = document.getElementById('clientGuardianBadge');
    const clientOverviewGuardian = document.getElementById('clientOverviewGuardian');

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

    // Brandboard & Brief u klienta
    const clientBrandPrimarySwatch = document.getElementById('clientBrandPrimarySwatch');
    const clientBrandPrimaryText = document.getElementById('clientBrandPrimaryText');
    const clientBrandAccentSwatch = document.getElementById('clientBrandAccentSwatch');
    const clientBrandAccentText = document.getElementById('clientBrandAccentText');
    const clientCopyPrimaryColor = document.getElementById('clientCopyPrimaryColor');
    const clientCopyAccentColor = document.getElementById('clientCopyAccentColor');
    const clientBrandFonts = document.getElementById('clientBrandFonts');
    const clientBrandWebsite = document.getElementById('clientBrandWebsite');
    const clientBrandSocials = document.getElementById('clientBrandSocials');
    const clientBrandTone = document.getElementById('clientBrandTone');

    const clientBriefForm = document.getElementById('clientBriefForm');
    const briefIndustry = document.getElementById('briefIndustry');
    const briefAudience = document.getElementById('briefAudience');
    const briefInspiration = document.getElementById('briefInspiration');
    const briefGoal = document.getElementById('briefGoal');
    const clientBriefFeedback = document.getElementById('clientBriefFeedback');

    // Repozytorium materiałów OD klienta
    const clientUploadMaterialForm = document.getElementById('clientUploadMaterialForm');
    const clientUploadedMaterialsList = document.getElementById('clientUploadedMaterialsList');
    const clientUploadFeedback = document.getElementById('clientUploadFeedback');

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

    function renderGlobalAnnouncementBar(annObj) {
        if (!clientGlobalAnnouncement) return;
        if (annObj && annObj.active && annObj.text && annObj.text.trim() !== '') {
            clientGlobalAnnouncementText.innerText = annObj.text;
            clientGlobalAnnouncement.classList.remove('hidden');
        } else {
            clientGlobalAnnouncement.classList.add('hidden');
        }
    }

    renderGlobalAnnouncementBar(getLocalAnnouncement());

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
            modalDownloadList.innerHTML = files.length === 0
                ? `<div class="download-file-row"><span style="color:var(--text-muted);">Brak załączonych plików bezpośrednich.</span></div>`
                : files.map(f => `
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

        if (modalApprovePackageBtn) {
            modalApprovePackageBtn.innerText = pkg.status === 'approved' ? '✓ Materiał został już zaakceptowany' : '✅ Akceptuję ten materiał';
            modalApprovePackageBtn.disabled = pkg.status === 'approved';
        }
        clientFileModal.classList.add('open');
    }

    if (closeClientFileModal && clientFileModal) {
        closeClientFileModal.addEventListener('click', () => clientFileModal.classList.remove('open'));
        clientFileModal.addEventListener('click', (e) => { if (e.target === clientFileModal) clientFileModal.classList.remove('open'); });
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
        const guardianName = data.guardian || 'Wspólny (Mateusz & Bartek)';

        if (clientTopName) clientTopName.innerText = data.clientName || 'Konto Klienta';
        if (clientGuardianBadge) clientGuardianBadge.innerText = `🤝 Opiekun: ${guardianName}`;
        if (clientOverviewGuardian) clientOverviewGuardian.innerText = `Opiekun projektu: ${guardianName}`;
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
                ? tasks.slice(0, 4).map(t => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${t.title} ${t.assignee ? `<span class="assignee-mini-tag">👤 ${t.assignee}</span>` : ''}</strong>
                            <small>${t.category}</small>
                        </div>
                        ${statusBadgeHTML(t.status)}
                    </li>
                `).join('')
                : emptyTasksHTML;
        }
        if (clientFullTaskList) {
            clientFullTaskList.innerHTML = tasks.length > 0
                ? tasks.map(t => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>${t.title} ${t.assignee ? `<span class="assignee-mini-tag">Wykonawca: ${t.assignee}</span>` : ''}</strong>
                            <small>Obszar: ${t.category}</small>
                        </div>
                        ${statusBadgeHTML(t.status)}
                    </li>
                `).join('')
                : emptyTasksHTML;
        }

        // Kontenery plików do akceptacji
        const filePackages = data.filePackages || [];
        if (clientFilesGrid) {
            if (filePackages.length === 0) {
                clientFilesGrid.innerHTML = `
                    <div class="glass-card" style="grid-column:1/-1;text-align:center;padding:3rem 1.5rem;">
                        <span style="font-size:2.4rem;display:block;margin-bottom:0.8rem;">📁</span>
                        <h3>Brak materiałów oczekujących na akceptację</h3>
                        <p style="color:var(--text-muted);max-width:520px;margin:0.6rem auto 0;">
                            Gdy nasz zespół przygotuje dla Ciebie projekty graficzne, wideo lub podgląd strony WWW, Administrator udostępni je tutaj w formie gotowych kontenerów do pobrania.
                        </p>
                    </div>
                `;
            } else {
                clientFilesGrid.innerHTML = filePackages.map(pkg => {
                    const filesCount = (pkg.files || []).length;
                    const shortDesc = (pkg.description || '').length > 110 ? pkg.description.slice(0, 110) + '...' : (pkg.description || '');
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
                                    📎 Załączone pliki: <strong>${filesCount}</strong> • Dodano: ${pkg.createdAt || 'Teraz'}
                                </div>
                                <button type="button" class="btn btn-primary btn-sm btn-full">
                                    📂 Otwórz kontener i pobierz pliki →
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');

                clientFilesGrid.querySelectorAll('[data-open-pkg]').forEach(card => {
                    card.addEventListener('click', () => openClientFilePackageModal(card.getAttribute('data-open-pkg')));
                });
            }
        }

        // Renderowanie Karty Marki (Brandboard #4) u klienta
        const bb = data.brandboard || defaultClientData.brandboard;
        if (clientBrandPrimarySwatch) clientBrandPrimarySwatch.style.background = bb.primaryColor || '#D4FF00';
        if (clientBrandPrimaryText) clientBrandPrimaryText.innerText = bb.primaryColor || '#D4FF00';
        if (clientBrandAccentSwatch) clientBrandAccentSwatch.style.background = bb.accentColor || '#FF6B00';
        if (clientBrandAccentText) clientBrandAccentText.innerText = bb.accentColor || '#FF6B00';
        if (clientBrandFonts) clientBrandFonts.innerText = bb.fonts || 'Ustalane przez zespół Wake The Brand';
        if (clientBrandWebsite) clientBrandWebsite.innerText = bb.website || 'W trakcie konfiguracji';
        if (clientBrandSocials) clientBrandSocials.innerText = bb.socials || 'Do uzupełnienia';
        if (clientBrandTone) clientBrandTone.innerText = bb.tone || 'Ustalany po wypełnieniu Briefu';

        // Wypełnienie pól Briefu (#5), jeśli klient już go wcześniej uzupełnił
        if (data.brief && briefIndustry) {
            if (!briefIndustry.value) briefIndustry.value = data.brief.industry || '';
            if (!briefAudience.value) briefAudience.value = data.brief.audience || '';
            if (!briefInspiration.value) briefInspiration.value = data.brief.inspiration || '';
            if (!briefGoal.value) briefGoal.value = data.brief.goal || '';
        }

        // Renderowanie materiałów przesłanych OD klienta (#6)
        const uploads = data.clientUploads || [];
        if (clientUploadedMaterialsList) {
            clientUploadedMaterialsList.innerHTML = uploads.length === 0
                ? `<li class="dash-task-item"><span style="color:var(--text-muted);">Nie przesłałeś jeszcze żadnych surowych materiałów. Użyj formularza obok, aby przekazać nam pliki lub link do dysku.</span></li>`
                : uploads.map(u => `
                    <li class="dash-task-item">
                        <div class="task-meta">
                            <strong>📤 ${u.title}</strong>
                            <small>${u.notes || 'Brak dodatkowych uwag'} • Przesłano: ${u.createdAt}</small>
                        </div>
                        ${u.url ? `<a href="${u.url}" download="${u.fileName || 'material'}" target="_blank" rel="noopener" class="btn-mini">🔗 Otwórz / Pobierz</a>` : ''}
                    </li>
                `).join('');
        }

        // Tabela finansów z opcjonalnym przyciskiem opłacenia
        const finances = data.finances || [];
        if (clientFinanceTable) {
            clientFinanceTable.innerHTML = finances.length > 0
                ? finances.map(f => `
                    <tr>
                        <td><strong>${f.period}</strong></td>
                        <td>${f.scope}</td>
                        <td>${f.docType}</td>
                        <td class="highlight-col">${f.amount}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
                                <span>${f.status}</span>
                                ${f.paymentLink ? `<a href="${f.paymentLink}" target="_blank" rel="noopener" class="btn-mini btn-manage">💳 Opłać / Pobierz</a>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')
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

    // Kopiowanie kolorów HEX z Brandboardu po kliknięciu
    [
        { card: clientCopyPrimaryColor, textEl: clientBrandPrimaryText },
        { card: clientCopyAccentColor, textEl: clientBrandAccentText }
    ].forEach(item => {
        if (item.card && item.textEl) {
            item.card.addEventListener('click', () => {
                const hex = item.textEl.innerText;
                navigator.clipboard?.writeText(hex);
                item.textEl.innerText = `${hex} (Skopiowano ✓)`;
                setTimeout(() => { item.textEl.innerText = hex; }, 1500);
            });
        }
    });

    // Zapis Ankiety Startowej (Briefu #5) przez klienta
    if (clientBriefForm) {
        clientBriefForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentClientCache.brief = {
                industry: briefIndustry.value.trim(),
                audience: briefAudience.value.trim(),
                inspiration: briefInspiration.value.trim(),
                goal: briefGoal.value.trim(),
                updatedAt: getCurrentTimeStr()
            };

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `📋 Wypełniłem Ankietę Startową (Brief Marki) w panelu! Cel na 30 dni: ${currentClientCache.brief.goal}.`,
                time: getCurrentTimeStr()
            });

            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);

            if (clientBriefFeedback) {
                clientBriefFeedback.style.color = '#d4ff00';
                clientBriefFeedback.innerText = '✅ Twój Brief został zapisany i przekazany do opiekuna projektu!';
            }
        });
    }

    // Przesyłanie surowych materiałów OD klienta (#6)
    if (clientUploadMaterialForm) {
        clientUploadMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('clientMatTitle').value.trim();
            const linkVal = document.getElementById('clientMatLink').value.trim();
            const notesVal = document.getElementById('clientMatNotes').value.trim();
            const fileInput = document.getElementById('clientMatFile');

            let finalUrl = linkVal;
            let fileName = '';

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const f = fileInput.files[0];
                if (f.size <= 750 * 1024) {
                    try {
                        finalUrl = await readFileAsDataURL(f);
                        fileName = f.name;
                    } catch (err) {}
                } else {
                    alert('Plik przekracza 750 KB. Wklej powyżej link do Google Drive / WeTransfer.');
                    return;
                }
            }

            currentClientCache.clientUploads = currentClientCache.clientUploads || [];
            currentClientCache.clientUploads.unshift({
                id: 'up_' + Date.now(),
                title,
                url: finalUrl,
                fileName,
                notes: notesVal,
                createdAt: getCurrentTimeStr()
            });

            currentClientCache.messages = currentClientCache.messages || [];
            currentClientCache.messages.push({
                sender: 'client',
                author: currentClientCache.clientName,
                text: `📤 Przesłałem nowe materiały do realizacji w zakładce „Prześlij Materiały”: „${title}”.`,
                time: getCurrentTimeStr()
            });

            clientUploadMaterialForm.reset();
            renderClientUI(currentClientCache);
            await saveClientData(currentClientId, currentClientCache);

            if (clientUploadFeedback) {
                clientUploadFeedback.style.color = '#d4ff00';
                clientUploadFeedback.innerText = '✅ Materiały zostały przekazane do zespołu Wake The Brand!';
            }
        });
    }

    // 7. PANEL ADMINA – WSZYSTKIE 9 NOWYCH FUNKCJI HQ
    const adminStatusForm = document.getElementById('adminStatusForm');
    const adminClientSelector = document.getElementById('adminClientSelector');
    const bannerClientName = document.getElementById('bannerClientName');
    const adminClientName = document.getElementById('adminClientName');
    const adminProjectGuardian = document.getElementById('adminProjectGuardian');
    const adminPackageName = document.getElementById('adminPackageName');
    const adminProgressSlider = document.getElementById('adminProgressSlider');
    const adminProgressVal = document.getElementById('adminProgressVal');
    const adminCurrentCost = document.getElementById('adminCurrentCost');
    const adminPaymentStatus = document.getElementById('adminPaymentStatus');
    const adminAdBudget = document.getElementById('adminAdBudget');
    const adminStatusFeedback = document.getElementById('adminStatusFeedback');

    // Prywatne notatki wewnętrzne (#2)
    const adminInternalNotesForm = document.getElementById('adminInternalNotesForm');
    const adminInternalNotesInput = document.getElementById('adminInternalNotesInput');
    const adminNotesFeedback = document.getElementById('adminNotesFeedback');

    // Przyciski powiadomień mailowych (#1)
    const sendEmailNotifyQuickBtn = document.getElementById('sendEmailNotifyQuickBtn');
    const notifyClientStatusBtn = document.getElementById('notifyClientStatusBtn');
    const notifyClientFilesBtn = document.getElementById('notifyClientFilesBtn');
    const notifyClientFinanceBtn = document.getElementById('notifyClientFinanceBtn');

    // Globalne ogłoszenie (#9)
    const globalAnnouncementForm = document.getElementById('globalAnnouncementForm');
    const globalAnnouncementInput = document.getElementById('globalAnnouncementInput');
    const globalAnnouncementActive = document.getElementById('globalAnnouncementActive');
    const globalAnnouncementFeedback = document.getElementById('globalAnnouncementFeedback');

    // Statystyki i Kalkulator Przychodu (#7)
    const statPaidRevenue = document.getElementById('statPaidRevenue');
    const statSplitPerOwner = document.getElementById('statSplitPerOwner');
    const statPendingRevenue = document.getElementById('statPendingRevenue');
    const statTotalAccounts = document.getElementById('statTotalAccounts');
    const statClientAccounts = document.getElementById('statClientAccounts');
    const statAdminAccounts = document.getElementById('statAdminAccounts');
    const statTotalLeads = document.getElementById('statTotalLeads');
    const sidebarLeadsCount = document.getElementById('sidebarLeadsCount');

    const adminAccountsList = document.getElementById('adminAccountsList');
    const adminAccountSearch = document.getElementById('adminAccountSearch');
    const adminGuardianFilter = document.getElementById('adminGuardianFilter');
    const adminRoleFilter = document.getElementById('adminRoleFilter');
    const adminAccountActionFeedback = document.getElementById('adminAccountActionFeedback');

    const adminAddTaskForm = document.getElementById('adminAddTaskForm');
    const adminTaskList = document.getElementById('adminTaskList');
    const adminAddFilePackageForm = document.getElementById('adminAddFilePackageForm');
    const adminFilePackagesList = document.getElementById('adminFilePackagesList');

    // Brandboard (#4), Brief (#5) i Materiały od klienta (#6) w Adminie
    const adminBrandboardForm = document.getElementById('adminBrandboardForm');
    const brandPrimaryColor = document.getElementById('brandPrimaryColor');
    const brandAccentColor = document.getElementById('brandAccentColor');
    const previewPrimarySwatch = document.getElementById('previewPrimarySwatch');
    const previewAccentSwatch = document.getElementById('previewAccentSwatch');
    const brandFonts = document.getElementById('brandFonts');
    const brandWebsite = document.getElementById('brandWebsite');
    const brandSocialLinks = document.getElementById('brandSocialLinks');
    const brandTone = document.getElementById('brandTone');
    const adminBrandFeedback = document.getElementById('adminBrandFeedback');
    const adminClientBriefView = document.getElementById('adminClientBriefView');
    const adminClientUploadsList = document.getElementById('adminClientUploadsList');

    const adminAddFinanceForm = document.getElementById('adminAddFinanceForm');
    const
