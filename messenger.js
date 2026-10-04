document.addEventListener('DOMContentLoaded', () => {
    const messengerLayout = document.getElementById('hqMessengerLayout');
    if (!messengerLayout) return; // Uruchamia się wyłącznie w admin.html

    // Elementy DOM Messengera
    const contactsListEl = document.getElementById('msgContactsList');
    const contactSearchInput = document.getElementById('msgContactSearch');
    const activeRoomTitleEl = document.getElementById('msgActiveRoomTitle');
    const activeRoomSubEl = document.getElementById('msgActiveRoomSub');
    const activeRoomBadgeEl = document.getElementById('msgActiveRoomBadge');
    const messagesStreamEl = document.getElementById('msgMessagesStream');
    const messageForm = document.getElementById('msgSendForm');
    const messageInput = document.getElementById('msgTextInput');
    const urgentCheck = document.getElementById('msgUrgentCheck');
    const senderBadgeEl = document.getElementById('msgCurrentSenderBadge');
    const sidebarUnreadBadge = document.getElementById('sidebarChatUnread');

    const READ_STATE_STORAGE_KEY = 'wtb_messenger_last_read_v1';

    // Aktualnie wybrany pokój ('GLOBAL' = Kanał Ogólny, lub klucz konkretnej osoby np. 'Bartek' / 'Kamil Nowak')
    let activeTargetKey = 'GLOBAL';

    function getReadStateMap() {
        try {
            return JSON.parse(localStorage.getItem(READ_STATE_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveReadStateMap(map) {
        try {
            localStorage.setItem(READ_STATE_STORAGE_KEY, JSON.stringify(map));
        } catch (e) {}
    }

    function getCurrentProfile() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getCurrentProfile === 'function') {
            return window.WTB_HQ.getCurrentProfile();
        }
        return {
            key: 'Mateusz',
            displayName: 'Mateusz Bugajski',
            roleLabel: 'Root Admin',
            pillClass: 'hq-pill mateusz',
            icon: '🟢',
            isFounder: true
        };
    }

    function getEmployeesArray() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getEmployees === 'function') {
            return window.WTB_HQ.getEmployees();
        }
        return [];
    }

    function getMessagesArray() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getMessages === 'function') {
            return window.WTB_HQ.getMessages();
        }
        return [];
    }

    function saveMessagesArray(updatedArr) {
        if (window.WTB_HQ && typeof window.WTB_HQ.saveMessages === 'function') {
            window.WTB_HQ.saveMessages(updatedArr);
        }
    }

    // Tworzy unikalny identyfikator pokoju dla rozmowy 1-na-1 (np. dm__Bartek__Mateusz)
    function buildDirectRoomId(userKeyA, userKeyB) {
        if (userKeyB === 'GLOBAL' || !userKeyB) return 'GLOBAL';
        const sorted = [String(userKeyA).trim(), String(userKeyB).trim()].sort();
        return `dm__${sorted[0]}__${sorted[1]}`;
    }

    // Zwraca pełny katalog osób w zespole (Założyciele + Aktywni Pracownicy)
    function getAllTeamContacts() {
        const contacts = [
            {
                key: 'GLOBAL',
                name: 'Kanał Ogólny (#wszyscy)',
                role: 'Tablica całego zespołu WTB',
                icon: '🌐',
                color: 'lime',
                isChannel: true
            },
            {
                key: 'Mateusz',
                name: 'Mateusz Bugajski',
                role: 'Root Admin • Tech, SEO & Web',
                icon: '🟢',
                color: 'lime',
                isChannel: false
            },
            {
                key: 'Bartek',
                name: 'Bartosz Koczara',
                role: 'Współzałożyciel • Ads & Allegro',
                icon: '🔵',
                color: 'blue',
                isChannel: false
            }
        ];

        const employees = getEmployeesArray().filter(emp => emp.status !== 'suspended');
        employees.forEach(emp => {
            const iconMap = { lime: '🟢', blue: '🔵', orange: '🟠' };
            contacts.push({
                key: emp.name,
                name: emp.name,
                role: emp.roleTitle || 'Specjalista WTB',
                icon: iconMap[emp.color] || '🟠',
                color: emp.color || 'orange',
                isChannel: false
            });
        });

        return contacts;
    }

    // Sprawdza, czy dana wiadomość należy do aktualnie otwartego pokoju
    function belongsToRoom(msg, myKey, targetKey) {
        const expectedRoomId = targetKey === 'GLOBAL'
            ? 'GLOBAL'
            : buildDirectRoomId(myKey, targetKey);

        const msgRoomId = msg.roomId || 'GLOBAL';
        return msgRoomId === expectedRoomId;
    }

    // Oznacza dany pokój jako przeczytany
    function markRoomAsRead(myKey, targetKey) {
        const roomId = targetKey === 'GLOBAL' ? 'GLOBAL' : buildDirectRoomId(myKey, targetKey);
        const readMap = getReadStateMap();
        readMap[`${myKey}::${roomId}`] = Date.now();
        saveReadStateMap(readMap);
    }

    // Zlicza nieprzeczytane wiadomości w danym pokoju
    function countUnreadInRoom(myKey, targetKey, allMessages) {
        const roomId = targetKey === 'GLOBAL' ? 'GLOBAL' : buildDirectRoomId(myKey, targetKey);
        const readMap = getReadStateMap();
        const lastReadTs = readMap[`${myKey}::${roomId}`] || 0;

        return allMessages.filter(m => {
            const mRoom = m.roomId || 'GLOBAL';
            if (mRoom !== roomId) return false;
            if (m.senderKey === myKey) return false;
            return (m.timestamp || 0) > lastReadTs;
        }).length;
    }

    function formatNowTime() {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${d}.${m}, ${h}:${min}`;
    }

    // Zamienia linki w wiadomościach na klikalne odnośniki
    function formatMessageTextHTML(rawText) {
        const escaped = String(rawText || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return escaped.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener" style="color:#d4ff00; text-decoration:underline; font-weight:600;">$1</a>'
        );
    }

    // =========================================================
    // 1. RENDEROWANIE LISTY KONTAKTÓW I KANAŁÓW PO LEWEJ STRONIE
    // =========================================================
    function renderContactsSidebar() {
        if (!contactsListEl) return;
        const me = getCurrentProfile();
        const allMessages = getMessagesArray();
        const searchVal = (contactSearchInput?.value || '').trim().toLowerCase();

        // Aktualizacja plakietki "Piszesz jako..."
        if (senderBadgeEl) {
            senderBadgeEl.className = me.pillClass;
            senderBadgeEl.innerText = `${me.icon} ${me.displayName}`;
        }

        // Wykluczamy samego siebie z listy rozmów 1-na-1
        const contacts = getAllTeamContacts().filter(c => c.isChannel || c.key !== me.key);

        // Jeśli wybrany kontakt został usunięty, wróć na Kanał Ogólny
        if (!contacts.some(c => c.key === activeTargetKey)) {
            activeTargetKey = 'GLOBAL';
        }

        let totalUnreadAllRooms = 0;

        const filteredContacts = contacts.filter(c => {
            if (!searchVal) return true;
            return `${c.name} ${c.role}`.toLowerCase().includes(searchVal);
        });

        contactsListEl.innerHTML = filteredContacts.map(contact => {
            const isActive = contact.key === activeTargetKey;
            const roomMessages = allMessages.filter(m => belongsToRoom(m, me.key, contact.key));
            const lastMsg = roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : null;

            const unreadCount = isActive ? 0 : countUnreadInRoom(me.key, contact.key, allMessages);
            totalUnreadAllRooms += unreadCount;

            const previewText = lastMsg
                ? `${lastMsg.senderKey === me.key ? 'Ty: ' : ''}${lastMsg.text.slice(0, 34)}${lastMsg.text.length > 34 ? '...' : ''}`
                : (contact.isChannel ? 'Kanał ogólny dla całego zespołu' : 'Kliknij, aby napisać prywatnie (1-na-1)');

            return `
                <button type="button" class="msg-contact-item ${isActive ? 'active' : ''}" data-target-key="${contact.key}">
                    <div class="msg-contact-avatar ${contact.color}">
                        ${contact.icon}
                    </div>
                    <div class="msg-contact-info">
                        <div class="msg-contact-top">
                            <strong>${contact.name}</strong>
                            ${unreadCount > 0 ? `<span class="msg-unread-pill">${unreadCount}</span>` : ''}
                        </div>
                        <small class="msg-contact-role">${contact.role}</small>
                        <span class="msg-contact-preview">${previewText}</span>
                    </div>
                </button>
            `;
        }).join('');

        // Aktualizacja licznika na przycisku w głównym sidebarze HQ
        if (sidebarUnreadBadge) {
            if (totalUnreadAllRooms > 0) {
                sidebarUnreadBadge.innerText = String(totalUnreadAllRooms);
                sidebarUnreadBadge.classList.remove('hidden');
            } else {
                sidebarUnreadBadge.classList.add('hidden');
            }
        }

        contactsListEl.querySelectorAll('[data-target-key]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTargetKey = btn.getAttribute('data-target-key') || 'GLOBAL';
                markRoomAsRead(me.key, activeTargetKey);
                renderMessenger();
            });
        });
    }

    // =========================================================
    // 2. RENDEROWANIE OKNA ROZMOWY (WIADOMOŚCI W POKOJU)
    // =========================================================
    function renderConversationWindow() {
        if (!messagesStreamEl) return;
        const me = getCurrentProfile();
        const contacts = getAllTeamContacts();
        const targetObj = contacts.find(c => c.key === activeTargetKey) || contacts[0];

        // Nagłówek aktywnego pokoju
        if (activeRoomTitleEl) {
            activeRoomTitleEl.innerText = `${targetObj.icon} ${targetObj.name}`;
        }
        if (activeRoomSubEl) {
            activeRoomSubEl.innerText = targetObj.isChannel
                ? 'Wszystkie wiadomości tutaj są widoczne dla całego zespołu Wake The Brand.'
                : `🔒 Prywatna rozmowa 1-na-1 (${me.displayName} ↔ ${targetObj.name}). Widoczna wyłącznie dla Was dwojga.`;
        }
        if (activeRoomBadgeEl) {
            activeRoomBadgeEl.className = targetObj.isChannel ? 'hq-pill mateusz' : 'hq-pill wspolnie';
            activeRoomBadgeEl.innerText = targetObj.isChannel ? '🌐 Kanał Zespołu' : '🔒 Prywatny Czat 1-na-1';
        }

        const allMessages = getMessagesArray();
        const roomMessages = allMessages.filter(m => belongsToRoom(m, me.key, activeTargetKey));

        if (roomMessages.length === 0) {
            messagesStreamEl.innerHTML = `
                <div class="msg-empty-state">
                    <div style="font-size:2.2rem; margin-bottom:0.5rem;">💬</div>
                    <strong>Brak wiadomości w tej rozmowie</strong>
                    <p>Napisz pierwszą wiadomość poniżej – zostanie natychmiast zsynchronizowana w czasie rzeczywistym.</p>
                </div>
            `;
            return;
        }

        messagesStreamEl.innerHTML = roomMessages.map(m => {
            const isMine = m.senderKey === me.key;
            const alignClass = isMine ? 'chat-mine' : 'chat-partner';
            const colorClass = m.senderKey === 'Bartek'
                ? 'bubble-bartek'
                : (m.senderKey === 'Mateusz' ? 'bubble-mateusz' : 'bubble-employee');
            const urgentClass = m.urgent ? 'msg-bubble-urgent' : '';

            // Usuwać może autor wiadomości lub Mateusz (Root Admin)
            const canDelete = isMine || me.key === 'Mateusz';

            return `
                <div class="chat-bubble ${alignClass} ${colorClass} ${urgentClass}">
                    <div class="msg-bubble-header">
                        <span class="chat-sender">
                            ${m.urgent ? '<strong style="color:#ff6b00;">🔥 PILNE • </strong>' : ''}
                            ${m.author} • ${m.time}
                        </span>
                        ${canDelete ? `<button type="button" class="msg-del-btn" data-del-msg="${m.id}" title="Usuń wiadomość">&times;</button>` : ''}
                    </div>
                    <div class="msg-bubble-body">${formatMessageTextHTML(m.text)}</div>
                </div>
            `;
        }).join('');

        messagesStreamEl.scrollTop = messagesStreamEl.scrollHeight;

        messagesStreamEl.querySelectorAll('[data-del-msg]').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-del-msg');
                const updated = getMessagesArray().filter(x => x.id !== msgId);
                saveMessagesArray(updated);
                renderMessenger();
            });
        });
    }

    function renderMessenger() {
        const me = getCurrentProfile();
        const chatTabSec = document.getElementById('hq-tab-chat');
        if (chatTabSec && !chatTabSec.classList.contains('hidden')) {
            markRoomAsRead(me.key, activeTargetKey);
        }
        renderContactsSidebar();
        renderConversationWindow();
    }

    // =========================================================
    // 3. WYSYŁANIE WIADOMOŚCI (KANAŁ OGÓLNY LUB PRYWATNY 1-NA-1)
    // =========================================================
    if (messageForm && messageInput) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textVal = messageInput.value.trim();
            if (!textVal) return;

            const me = getCurrentProfile();
            const roomId = activeTargetKey === 'GLOBAL'
                ? 'GLOBAL'
                : buildDirectRoomId(me.key, activeTargetKey);

            const newMsg = {
                id: 'msg_' + Date.now(),
                roomId,
                recipientKey: activeTargetKey,
                senderKey: me.key,
                author: `${me.icon} ${me.displayName}`,
                text: textVal,
                urgent: Boolean(urgentCheck && urgentCheck.checked),
                time: formatNowTime(),
                timestamp: Date.now()
            };

            const currentMessages = getMessagesArray();
            currentMessages.push(newMsg);
            saveMessagesArray(currentMessages);

            messageInput.value = '';
            if (urgentCheck) urgentCheck.checked = false;
            markRoomAsRead(me.key, activeTargetKey);
            renderMessenger();
        });
    }

    if (contactSearchInput) {
        contactSearchInput.addEventListener('input', renderContactsSidebar);
    }

    // Gdy użytkownik kliknie zakładkę Czat HQ w menu bocznym, oznacz aktywny pokój jako przeczytany
    const chatNavBtn = document.querySelector('[data-tab="hq-tab-chat"]');
    if (chatNavBtn) {
        chatNavBtn.addEventListener('click', () => {
            setTimeout(() => {
                const me = getCurrentProfile();
                markRoomAsRead(me.key, activeTargetKey);
                renderMessenger();
            }, 50);
        });
    }

    window.addEventListener('wtb:workspace-updated', () => {
        renderMessenger();
    });

    renderMessenger();
});
