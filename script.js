document.addEventListener('DOMContentLoaded', async () => {

    const firebaseConfig = {
        apiKey: "AIzaSyBBPECw6qPYOd7g1NUFzHNQMzljUBOwL9I",
        authDomain: "wake-the-brand.firebaseapp.com",
        projectId: "wake-the-brand",
        storageBucket: "wake-the-brand.firebasestorage.app",
        messagingSenderId: "765483574565",
        appId: "1:765483574565:web:c898771abb393cf11526cc"
    };

    const CONTACT_RECEIVER_EMAIL = "wakethebrand.kontakt@gmail.com";
    const LEADS_STORAGE_KEY = 'wtb_leads_local_v1';

    function getCurrentTimeStr() {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${d}.${m}, ${h}:${min}`;
    }

    // 1. MENU MOBILNE & BANER COOKIES
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

    // 2. SYMULATOR MARKI (index.html), FAQ & KONCEPTY (koncepty.html)
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

    // 4. FORMULARZ KONTAKTOWY (kontakt.html)
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

            formFeedback.style.color = '#d4ff00';
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

            try {
                const raw = localStorage.getItem(LEADS_STORAGE_KEY);
                const arr = raw ? JSON.parse(raw) : [];
                arr.unshift(leadObj);
                localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(arr));
            } catch (err) {}

            try {
                const [appMod, firestoreMod] = await Promise.all([
                    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
                    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
                ]);
                const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
                const db = firestoreMod.getFirestore(app);
                await firestoreMod.addDoc(firestoreMod.collection(db, 'contact_leads'), leadObj);
            } catch (err) {
                console.warn('Zapis formularza do Firebase:', err);
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

});
