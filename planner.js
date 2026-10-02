document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('hqCalendarGrid');
    if (!calendarGrid) return; // Skrypt uruchamia się tylko w admin.html

    // Elementy DOM Kalendarza
    const calMonthTitle = document.getElementById('calMonthTitle');
    const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    const calNextMonthBtn = document.getElementById('calNextMonthBtn');
    const calTodayBtn = document.getElementById('calTodayBtn');
    const calFilterOwner = document.getElementById('calFilterOwner');

    // Elementy DOM Kontenera (Modala) Dnia
    const dayModal = document.getElementById('calendarDayModal');
    const closeDayModalBtn = document.getElementById('closeDayModalBtn');
    const dayModalDateTitle = document.getElementById('dayModalDateTitle');
    const dayModalSubtitle = document.getElementById('dayModalSubtitle');
    const dayTasksList = document.getElementById('dayTasksList');
    const dayTaskForm = document.getElementById('dayTaskForm');

    const dayTaskTitle = document.getElementById('dayTaskTitle');
    const dayTaskTime = document.getElementById('dayTaskTime');
    const dayTaskProject = document.getElementById('dayTaskProject');
    const dayTaskOwner = document.getElementById('dayTaskOwner');
    const dayTaskPriority = document.getElementById('dayTaskPriority');

    const MONTHS_PL = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let selectedDateStr = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

    function formatDateKey(year, month1to12, day) {
        const m = String(month1to12).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    function formatHumanDatePL(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        return `${d} ${MONTHS_PL[m - 1]} ${y}`;
    }

    function getTasksArray() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getTasks === 'function') {
            return window.WTB_HQ.getTasks();
        }
        return [];
    }

    function saveTasksArray(updatedTasks) {
        if (window.WTB_HQ && typeof window.WTB_HQ.saveTasks === 'function') {
            window.WTB_HQ.saveTasks(updatedTasks);
        }
    }

    function priorityWeight(prio) {
        if (prio === 'high') return 3;
        if (prio === 'medium') return 2;
        return 1;
    }

    function priorityBadgeHTML(prio) {
        if (prio === 'high') return '<span class="cal-prio-badge prio-high">🔥 Wysoki</span>';
        if (prio === 'low') return '<span class="cal-prio-badge prio-low">🟢 Niski</span>';
        return '<span class="cal-prio-badge prio-medium">⚡ Normalny</span>';
    }

    function ownerBadgeHTML(owner) {
        if (owner === 'Mateusz') return '<span class="hq-pill mateusz">🟢 Mateusz</span>';
        if (owner === 'Bartek') return '<span class="hq-pill bartek">🔵 Bartek</span>';
        return '<span class="hq-pill wspolnie">⚡ Wspólnie</span>';
    }

    // =========================================================
    // 1. RENDEROWANIE SIATKI KALENDARZA MIESIĘCZNEGO
    // =========================================================
    function renderCalendar() {
        if (!calendarGrid) return;
        calMonthTitle.innerText = `${MONTHS_PL[currentMonth]} ${currentYear}`;

        const allTasks = getTasksArray();
        const ownerFilter = calFilterOwner ? calFilterOwner.value : 'all';

        const filteredTasks = allTasks.filter(t => {
            if (ownerFilter === 'all') return true;
            return t.owner === ownerFilter;
        });

        // Wyliczanie układu dni w miesiącu (Poniedziałek = 0 ... Niedziela = 6)
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
        let cellsHTML = '';

        // Dni z poprzedniego miesiąca (wypełnienie początku siatki)
        for (let i = startWeekday - 1; i >= 0; i--) {
            const prevDay = daysInPrevMonth - i;
            cellsHTML += `
                <div class="cal-day-cell cal-day-outside">
                    <div class="cal-day-header">
                        <span class="cal-day-num">${prevDay}</span>
                    </div>
                </div>
            `;
        }

        // Dni bieżącego miesiąca
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(currentYear, currentMonth + 1, day);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateStr;

            const dayTasks = filteredTasks
                .filter(t => (t.date || todayKey) === dateKey)
                .sort((a, b) => {
                    if (a.status === 'done' && b.status !== 'done') return 1;
                    if (a.status !== 'done' && b.status === 'done') return -1;
                    return priorityWeight(b.priority) - priorityWeight(a.priority);
                });

            const activeCount = dayTasks.filter(t => t.status !== 'done').length;

            const pillsHTML = dayTasks.slice(0, 3).map(t => {
                const doneClass = t.status === 'done' ? 'is-done' : '';
                const prioClass = `pill-prio-${t.priority || 'medium'}`;
                const timePrefix = t.time ? `${t.time} ` : '';
                return `<div class="cal-task-pill ${prioClass} ${doneClass}">${timePrefix}${t.title}</div>`;
            }).join('');

            const moreHTML = dayTasks.length > 3
                ? `<div class="cal-more-tasks">+${dayTasks.length - 3} więcej...</div>`
                : '';

            cellsHTML += `
                <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateKey}">
                    <div class="cal-day-header">
                        <span class="cal-day-num">${day}</span>
                        ${activeCount > 0 ? `<span class="cal-day-count">${activeCount}</span>` : ''}
                    </div>
                    <div class="cal-day-events">
                        ${pillsHTML}
                        ${moreHTML}
                    </div>
                </div>
            `;
        }

        // Dopełnienie siatki do pełnych wierszy (wielokrotność 7)
        const totalCellsSoFar = startWeekday + daysInMonth;
        const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
        for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
            cellsHTML += `
                <div class="cal-day-cell cal-day-outside">
                    <div class="cal-day-header">
                        <span class="cal-day-num">${nextDay}</span>
                    </div>
                </div>
            `;
        }

        calendarGrid.innerHTML = cellsHTML;

        // Obsługa kliknięcia w kafelek konkretnej daty
        calendarGrid.querySelectorAll('.cal-day-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                const clickedDate = cell.getAttribute('data-date');
                openDayModal(clickedDate);
            });
        });
    }

    // =========================================================
    // 2. KONTENER (MODAL) WYBRANEGO DNIA – LISTA I DODAWANIE ZADAŃ
    // =========================================================
    function openDayModal(dateKey) {
        selectedDateStr = dateKey;
        renderCalendar();
        renderDayModalTasks();
        if (dayModal) {
            dayModal.classList.add('open');
        }
    }

    function renderDayModalTasks() {
        if (!dayTasksList) return;
        if (dayModalDateTitle) {
            dayModalDateTitle.innerText = `📅 Plan na dzień: ${formatHumanDatePL(selectedDateStr)}`;
        }

        const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
        const allTasks = getTasksArray();
        const tasksForDay = allTasks
            .filter(t => (t.date || todayKey) === selectedDateStr)
            .sort((a, b) => {
                if (a.status === 'done' && b.status !== 'done') return 1;
                if (a.status !== 'done' && b.status === 'done') return -1;
                if (priorityWeight(b.priority) !== priorityWeight(a.priority)) {
                    return priorityWeight(b.priority) - priorityWeight(a.priority);
                }
                return (a.time || '23:59').localeCompare(b.time || '23:59');
            });

        if (dayModalSubtitle) {
            const activeCount = tasksForDay.filter(t => t.status !== 'done').length;
            dayModalSubtitle.innerText = tasksForDay.length === 0
                ? 'Brak zaplanowanych zadań na ten dzień – dodaj pierwsze poniżej.'
                : `Łącznie zadań: ${tasksForDay.length} (Do wykonania: ${activeCount})`;
        }

        if (tasksForDay.length === 0) {
            dayTasksList.innerHTML = `
                <li class="dash-task-item">
                    <span class="task-meta">Ten dzień jest jeszcze pusty. Użyj formularza obok, aby zaplanować działania i ustawić priorytet.</span>
                </li>
            `;
            return;
        }

        dayTasksList.innerHTML = tasksForDay.map(t => {
            const isDone = t.status === 'done';
            const statusLabel = isDone
                ? '<span class="badge-status done">✓ Gotowe</span>'
                : '<span class="badge-status todo">📋 Do zrobienia</span>';

            return `
                <li class="dash-task-item ${isDone ? 'cal-task-row-done' : ''}">
                    <div class="task-meta">
                        <div class="cal-task-row-badges">
                            ${priorityBadgeHTML(t.priority || 'medium')}
                            ${ownerBadgeHTML(t.owner || 'Wspólnie')}
                            ${t.time ? `<span class="cal-time-badge">⏰ ${t.time}</span>` : ''}
                        </div>
                        <strong class="${isDone ? 'text-strike' : ''}">${t.title}</strong>
                        <small>Projekt / Klient: <strong>${t.project || 'Wake The Brand'}</strong></small>
                    </div>
                    <div class="cookie-actions">
                        <button type="button" class="btn-mini" data-toggle-day-task="${t.id}">
                            ${statusLabel}
                        </button>
                        <button type="button" class="btn-mini btn-danger" data-del-day-task="${t.id}">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');

        // Przełączanie statusu (Do zrobienia <-> Gotowe)
        dayTasksList.querySelectorAll('[data-toggle-day-task]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-toggle-day-task');
                const currentAll = getTasksArray();
                const target = currentAll.find(x => x.id === id);
                if (!target) return;
                target.status = target.status === 'done' ? 'todo' : 'done';
                saveTasksArray(currentAll);
                renderDayModalTasks();
                renderCalendar();
            });
        });

        // Usuwanie zadania z wybranego dnia
        dayTasksList.querySelectorAll('[data-del-day-task]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-del-day-task');
                const updated = getTasksArray().filter(x => x.id !== id);
                saveTasksArray(updated);
                renderDayModalTasks();
                renderCalendar();
            });
        });
    }

    // Dodawanie nowego zadania w wybranym dniu
    if (dayTaskForm) {
        dayTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleVal = (dayTaskTitle?.value || '').trim();
            if (!titleVal) return;

            const newTask = {
                id: 'cal_' + Date.now(),
                date: selectedDateStr,
                time: (dayTaskTime?.value || '').trim(),
                title: titleVal,
                project: (dayTaskProject?.value || '').trim() || 'Wake The Brand',
                owner: dayTaskOwner ? dayTaskOwner.value : 'Wspólnie',
                priority: dayTaskPriority ? dayTaskPriority.value : 'medium',
                status: 'todo'
            };

            const currentAll = getTasksArray();
            currentAll.unshift(newTask);
            saveTasksArray(currentAll);

            dayTaskForm.reset();
            renderDayModalTasks();
            renderCalendar();
        });
    }

    // Nawigacja między miesiącami
    if (calPrevMonthBtn) {
        calPrevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (calNextMonthBtn) {
        calNextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    if (calTodayBtn) {
        calTodayBtn.addEventListener('click', () => {
            const now = new Date();
            currentYear = now.getFullYear();
            currentMonth = now.getMonth();
            selectedDateStr = formatDateKey(currentYear, currentMonth + 1, now.getDate());
            renderCalendar();
        });
    }

    if (calFilterOwner) {
        calFilterOwner.addEventListener('change', renderCalendar);
    }

    if (closeDayModalBtn && dayModal) {
        closeDayModalBtn.addEventListener('click', () => dayModal.classList.remove('open'));
        dayModal.addEventListener('click', (e) => {
            if (e.target === dayModal) dayModal.classList.remove('open');
        });
    }

    // Nasłuchiwanie na aktualizacje z chmury Firebase (wywoływane przez script.js)
    window.addEventListener('wtb:workspace-updated', () => {
        renderCalendar();
        if (dayModal && dayModal.classList.contains('open')) {
            renderDayModalTasks();
        }
    });

    renderCalendar();
});
