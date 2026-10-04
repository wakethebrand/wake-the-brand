document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('hqCalendarGrid');
    if (!calendarGrid) return; // Działa wyłącznie w admin.html

    // Elementy DOM Kalendarza
    const calMonthTitle = document.getElementById('calMonthTitle');
    const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    const calNextMonthBtn = document.getElementById('calNextMonthBtn');
    const calTodayBtn = document.getElementById('calTodayBtn');
    const calFilterScope = document.getElementById('calFilterScope');

    // Elementy DOM Modala Wybranego Dnia
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

    function getCurrentOwnerKey() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getCurrentOwner === 'function') {
            return window.WTB_HQ.getCurrentOwner();
        }
        const savedEmail = (localStorage.getItem('wtb_admin_email') || '').toLowerCase();
        return savedEmail.includes('bkoczara') ? 'Bartek' : 'Mateusz';
    }

    function getCurrentProfile() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getCurrentProfile === 'function') {
            return window.WTB_HQ.getCurrentProfile();
        }
        const key = getCurrentOwnerKey();
        return {
            key,
            displayName: key,
            isFounder: key === 'Mateusz' || key === 'Bartek'
        };
    }

    function getEmployeesArray() {
        if (window.WTB_HQ && typeof window.WTB_HQ.getEmployees === 'function') {
            return window.WTB_HQ.getEmployees();
        }
        return [];
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

    // Buduje listę opcji w polu "Dla kogo zadanie?" (Założyciele mogą zlecać zadania pracownikom)
    function rebuildOwnerSelectOptions() {
        if (!dayTaskOwner) return;
        const profile = getCurrentProfile();
        const me = profile.key;
        const employees = getEmployeesArray().filter(e => e.status !== 'suspended');

        let optionsHTML = '';
        if (me === 'Mateusz') {
            optionsHTML += `<option value="MINE">🟢 Tylko dla mnie (Mateusz - Prywatne)</option>`;
        } else if (me === 'Bartek') {
            optionsHTML += `<option value="MINE">🔵 Tylko dla mnie (Bartek - Prywatne)</option>`;
        } else {
            optionsHTML += `<option value="MINE">🔒 Tylko dla mnie (${profile.displayName})</option>`;
        }

        optionsHTML += `<option value="Wspólnie">⚡ Wspólne (Widoczne dla całego zespołu)</option>`;

        // Jeśli zalogowany jest Założyciel, może przypisać zadanie konkretnemu pracownikowi
        if (profile.isFounder && employees.length > 0) {
            employees.forEach(emp => {
                optionsHTML += `<option value="${emp.name}">👤 Zleć pracownikowi: ${emp.name} (${emp.roleTitle || 'Zespół'})</option>`;
            });
        }

        const prevVal = dayTaskOwner.value;
        dayTaskOwner.innerHTML = optionsHTML;
        if (prevVal && Array.from(dayTaskOwner.options).some(o => o.value === prevVal)) {
            dayTaskOwner.value = prevVal;
        }
    }

    // Reguła widoczności zadań w Kalendarzu:
    // - Mateusz nie widzi prywatnych zadań Bartka (i odwrotnie), ale Założyciele widzą zadania pracowników.
    // - Pracownik widzi wyłącznie swoje zadania oraz zadania Wspólne.
    function isTaskVisibleForCurrentUser(task) {
        const profile = getCurrentProfile();
        const me = profile.key;
        const taskOwner = task.owner || 'Wspólnie';

        if (taskOwner === me || taskOwner === 'Wspólnie') return true;

        // Jeśli zalogowany jest Założyciel, widzi też zadania zlecone pracownikom (ale NIE prywatne zadania drugiego Założyciela)
        if (profile.isFounder) {
            if (taskOwner === 'Mateusz' || taskOwner === 'Bartek') {
                return false;
            }
            return true;
        }

        return false;
    }

    function priorityWeight(prio) {
        if (prio === 'high') return 3;
        if (prio === 'medium') return 2;
        return 1;
    }

    function priorityIcon(prio) {
        if (prio === 'high') return '🔥';
        if (prio === 'low') return '🟢';
        return '⚡';
    }

    function priorityBadgeHTML(prio) {
        if (prio === 'high') return '<span class="cal-prio-badge prio-high">🔥 Wysoki</span>';
        if (prio === 'low') return '<span class="cal-prio-badge prio-low">🟢 Niski</span>';
        return '<span class="cal-prio-badge prio-medium">⚡ Normalny</span>';
    }

    function ownerBadgeHTML(owner) {
        if (owner === 'Mateusz') return '<span class="hq-pill mateusz">🟢 Mateusz (Prywatne)</span>';
        if (owner === 'Bartek') return '<span class="hq-pill bartek">🔵 Bartek (Prywatne)</span>';
        if (!owner || owner === 'Wspólnie') return '<span class="hq-pill wspolnie">⚡ Wspólne</span>';

        const emp = getEmployeesArray().find(e => e.name === owner);
        if (emp) {
            if (emp.color === 'lime') return `<span class="hq-pill mateusz">👤 ${emp.name}</span>`;
            if (emp.color === 'blue') return `<span class="hq-pill bartek">👤 ${emp.name}</span>`;
        }
        return `<span class="hq-pill wspolnie">👤 ${owner}</span>`;
    }

    function ownerPillColorClass(owner) {
        if (owner === 'Mateusz') return 'pill-owner-mateusz';
        if (owner === 'Bartek') return 'pill-owner-bartek';
        if (!owner || owner === 'Wspólnie') return 'pill-owner-wspolnie';

        const emp = getEmployeesArray().find(e => e.name === owner);
        if (emp) {
            if (emp.color === 'lime') return 'pill-owner-mateusz';
            if (emp.color === 'blue') return 'pill-owner-bartek';
        }
        return 'pill-owner-wspolnie';
    }

    // =========================================================
    // 1. RENDEROWANIE SIATKI KALENDARZA MIESIĘCZNEGO
    // =========================================================
    function renderCalendar() {
        if (!calendarGrid) return;
        rebuildOwnerSelectOptions();
        calMonthTitle.innerText = `${MONTHS_PL[currentMonth]} ${currentYear}`;

        const me = getCurrentOwnerKey();
        const allTasks = getTasksArray();
        const scopeVal = calFilterScope ? calFilterScope.value : 'all';

        const visibleTasks = allTasks.filter(t => {
            if (!isTaskVisibleForCurrentUser(t)) return false;
            if (scopeVal === 'mine') return t.owner === me;
            if (scopeVal === 'shared') return (t.owner || 'Wspólnie') === 'Wspólnie';
            return true;
        });

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const startWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Pon = 0 ... Ndz = 6
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        const todayKey = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
        let cellsHTML = '';

        // Dni z poprzedniego miesiąca
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

            const dayTasks = visibleTasks
                .filter(t => (t.date || todayKey) === dateKey)
                .sort((a, b) => {
                    if (a.status === 'done' && b.status !== 'done') return 1;
                    if (a.status !== 'done' && b.status === 'done') return -1;
                    if (priorityWeight(b.priority) !== priorityWeight(a.priority)) {
                        return priorityWeight(b.priority) - priorityWeight(a.priority);
                    }
                    return (a.time || '23:59').localeCompare(b.time || '23:59');
                });

            const activeCount = dayTasks.filter(t => t.status !== 'done').length;

            const pillsHTML = dayTasks.slice(0, 3).map(t => {
                const doneClass = t.status === 'done' ? 'is-done' : '';
                const ownerClass = ownerPillColorClass(t.owner || 'Wspólnie');
                const pIcon = priorityIcon(t.priority || 'medium');
                const timePrefix = t.time ? `${t.time} ` : '';
                return `<div class="cal-task-pill ${ownerClass} ${doneClass}">${pIcon} ${timePrefix}${t.title}</div>`;
            }).join('');

            const moreHTML = dayTasks.length > 3
                ? `<div class="cal-more-tasks">+${dayTasks.length - 3} więcej</div>`
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

        // Dopełnienie siatki do pełnych tygodni
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

        calendarGrid.querySelectorAll('.cal-day-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                const clickedDate = cell.getAttribute('data-date');
                openDayModal(clickedDate);
            });
        });
    }

    // =========================================================
    // 2. KONTENER (MODAL) WYBRANEGO DNIA
    // =========================================================
    function openDayModal(dateKey) {
        selectedDateStr = dateKey;
        rebuildOwnerSelectOptions();
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
            .filter(t => (t.date || todayKey) === selectedDateStr && isTaskVisibleForCurrentUser(t))
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
                ? 'Brak zadań na ten dzień – dodaj nowe poniżej.'
                : `Widoczne zadania na ten dzień: ${tasksForDay.length} (Do wykonania: ${activeCount})`;
        }

        if (tasksForDay.length === 0) {
            dayTasksList.innerHTML = `
                <li class="dash-task-item">
                    <span class="task-meta">Ten dzień jest pusty. Zaplanuj zadanie dla siebie, wspólne lub zleć je pracownikowi.</span>
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
                            ${ownerBadgeHTML(t.owner || 'Wspólnie')}
                            ${priorityBadgeHTML(t.priority || 'medium')}
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

    // Dodawanie nowego zadania
    if (dayTaskForm) {
        dayTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleVal = (dayTaskTitle?.value || '').trim();
            if (!titleVal) return;

            const me = getCurrentOwnerKey();
            const selectedScope = dayTaskOwner ? dayTaskOwner.value : 'MINE';
            const resolvedOwner = selectedScope === 'MINE' ? me : selectedScope;

            const newTask = {
                id: 'cal_' + Date.now(),
                date: selectedDateStr,
                time: (dayTaskTime?.value || '').trim(),
                title: titleVal,
                project: (dayTaskProject?.value || '').trim() || 'Wake The Brand',
                owner: resolvedOwner,
                priority: dayTaskPriority ? dayTaskPriority.value : 'medium',
                status: 'todo'
            };

            const currentAll = getTasksArray();
            currentAll.unshift(newTask);
            saveTasksArray(currentAll);

            dayTaskForm.reset();
            rebuildOwnerSelectOptions();
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

    if (calFilterScope) {
        calFilterScope.addEventListener('change', renderCalendar);
    }

    if (closeDayModalBtn && dayModal) {
        closeDayModalBtn.addEventListener('click', () => dayModal.classList.remove('open'));
        dayModal.addEventListener('click', (e) => {
            if (e.target === dayModal) dayModal.classList.remove('open');
        });
    }

    window.addEventListener('wtb:workspace-updated', () => {
        renderCalendar();
        if (dayModal && dayModal.classList.contains('open')) {
            renderDayModalTasks();
        }
    });

    renderCalendar();
});
